package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

var mpClient *MercadoPagoClient

// InitHandlers inicializa os handlers e dependências
func InitHandlers() {
	mpClient = NewMercadoPagoClient()
}

// CreatePaymentHandler cria um novo pagamento
func CreatePaymentHandler(c *gin.Context) {
	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Dados inválidos",
			"details": err.Error(),
		})
		return
	}

	// Criar pagamento no banco
	payment := NewPayment()
	payment.ReservationID = req.ReservationID
	payment.UserID = req.UserID
	payment.Amount = req.Amount
	payment.Currency = req.Currency
	payment.Method = req.Method
	payment.Description = req.Description
	payment.ExternalReference = req.ReservationID

	// Salvar no banco
	if err := CreatePayment(payment); err != nil {
		log.Printf("Erro ao salvar pagamento: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro interno do servidor",
		})
		return
	}

	// Preparar dados para o frontend processar
	// O token será gerado pelo frontend usando MercadoPago SDK

	// Retornar dados para o frontend processar
	response := PaymentResponse{
		ID:                payment.ID,
		ReservationID:     payment.ReservationID,
		UserID:            payment.UserID,
		Amount:            payment.Amount,
		Currency:          payment.Currency,
		Status:            payment.Status,
		Method:            payment.Method,
		MercadoPagoID:     payment.MercadoPagoID,
		Description:       payment.Description,
		ExternalReference: payment.ExternalReference,
		CreatedAt:         payment.CreatedAt,
		UpdatedAt:         payment.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// ProcessPaymentHandler processa o pagamento com token do cartão
func ProcessPaymentHandler(c *gin.Context) {
	paymentID := c.Param("id")

	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Token é obrigatório",
		})
		return
	}

	// Buscar pagamento no banco
	payment, err := GetPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pagamento não encontrado",
		})
		return
	}

	// Preparar requisição para MercadoPago
	mpReq := MercadoPagoPaymentRequest{
		TransactionAmount: payment.Amount,
		Token:             req.Token,
		Description:       payment.Description,
		Installments:      1,
		PaymentMethodID:   getPaymentMethodID(payment.Method),
		Payer: MercadoPagoPayerRequest{
			Email:     "", // Será preenchido pelo frontend
			FirstName: "",
			LastName:  "",
			Identification: MercadoPagoIdentification{
				Type:   "CPF",
				Number: "",
			},
		},
		ExternalReference:   payment.ID,
		NotificationURL:     getNotificationURL(),
		StatementDescriptor: "EASY HOTEL",
	}

	// Criar pagamento no MercadoPago
	mpResp, err := mpClient.CreatePayment(mpReq)
	if err != nil {
		log.Printf("Erro ao criar pagamento no MercadoPago: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao processar pagamento",
		})
		return
	}

	// Atualizar pagamento no banco
	payment.MercadoPagoID = strconv.FormatInt(mpResp.ID, 10)
	payment.Status = ConvertMercadoPagoStatus(mpResp.Status)

	if err := UpdateMercadoPagoID(payment.ID, payment.MercadoPagoID); err != nil {
		log.Printf("Erro ao atualizar MercadoPago ID: %v", err)
	}

	if err := UpdatePaymentStatus(payment.ID, payment.Status); err != nil {
		log.Printf("Erro ao atualizar status: %v", err)
	}

	// Retornar resposta
	response := PaymentResponse{
		ID:                payment.ID,
		ReservationID:     payment.ReservationID,
		UserID:            payment.UserID,
		Amount:            payment.Amount,
		Currency:          payment.Currency,
		Status:            payment.Status,
		Method:            payment.Method,
		MercadoPagoID:     payment.MercadoPagoID,
		Description:       payment.Description,
		ExternalReference: payment.ExternalReference,
		CreatedAt:         payment.CreatedAt,
		UpdatedAt:         payment.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetPaymentHandler busca um pagamento pelo ID
func GetPaymentHandler(c *gin.Context) {
	paymentID := c.Param("id")

	payment, err := GetPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pagamento não encontrado",
		})
		return
	}

	response := PaymentResponse{
		ID:                payment.ID,
		ReservationID:     payment.ReservationID,
		UserID:            payment.UserID,
		Amount:            payment.Amount,
		Currency:          payment.Currency,
		Status:            payment.Status,
		Method:            payment.Method,
		MercadoPagoID:     payment.MercadoPagoID,
		Description:       payment.Description,
		ExternalReference: payment.ExternalReference,
		CreatedAt:         payment.CreatedAt,
		UpdatedAt:         payment.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetPaymentsByUserHandler busca pagamentos de um usuário
func GetPaymentsByUserHandler(c *gin.Context) {
	userID := c.Param("user_id")

	payments, err := GetPaymentsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao buscar pagamentos",
		})
		return
	}

	var responses []PaymentResponse
	if payments != nil {
		for _, payment := range payments {
			response := PaymentResponse{
				ID:                payment.ID,
				ReservationID:     payment.ReservationID,
				UserID:            payment.UserID,
				Amount:            payment.Amount,
				Currency:          payment.Currency,
				Status:            payment.Status,
				Method:            payment.Method,
				MercadoPagoID:     payment.MercadoPagoID,
				Description:       payment.Description,
				ExternalReference: payment.ExternalReference,
				CreatedAt:         payment.CreatedAt,
				UpdatedAt:         payment.UpdatedAt,
			}
			responses = append(responses, response)
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetPaymentsByReservationHandler busca pagamentos de uma reserva
func GetPaymentsByReservationHandler(c *gin.Context) {
	reservationID := c.Param("reservation_id")

	payments, err := GetPaymentsByReservationID(reservationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao buscar pagamentos",
		})
		return
	}

	var responses []PaymentResponse
	if payments != nil {
		for _, payment := range payments {
			response := PaymentResponse{
				ID:                payment.ID,
				ReservationID:     payment.ReservationID,
				UserID:            payment.UserID,
				Amount:            payment.Amount,
				Currency:          payment.Currency,
				Status:            payment.Status,
				Method:            payment.Method,
				MercadoPagoID:     payment.MercadoPagoID,
				Description:       payment.Description,
				ExternalReference: payment.ExternalReference,
				CreatedAt:         payment.CreatedAt,
				UpdatedAt:         payment.UpdatedAt,
			}
			responses = append(responses, response)
		}
	}

	c.JSON(http.StatusOK, responses)
}

// RefundPaymentHandler faz reembolso de um pagamento
func RefundPaymentHandler(c *gin.Context) {
	paymentID := c.Param("id")

	var req RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Buscar pagamento
	payment, err := GetPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pagamento não encontrado",
		})
		return
	}

	// Verificar se tem MercadoPago ID
	if payment.MercadoPagoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Pagamento não foi processado no MercadoPago",
		})
		return
	}

	// Fazer reembolso no MercadoPago
	amount := req.Amount
	if amount == 0 {
		amount = payment.Amount // Reembolso total
	}

	if err := mpClient.RefundPayment(payment.MercadoPagoID, amount); err != nil {
		log.Printf("Erro ao fazer reembolso: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao processar reembolso",
		})
		return
	}

	// Atualizar status no banco
	if err := UpdatePaymentStatus(payment.ID, StatusRefunded); err != nil {
		log.Printf("Erro ao atualizar status: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Reembolso processado com sucesso",
		"amount":  amount,
	})
}

// WebhookHandler processa webhooks do MercadoPago
func WebhookHandler(c *gin.Context) {
	var webhookReq WebhookRequest
	if err := c.ShouldBindJSON(&webhookReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Webhook inválido",
		})
		return
	}

	// Verificar se é um evento de pagamento
	if webhookReq.Type != "payment" {
		c.JSON(http.StatusOK, gin.H{"message": "Evento ignorado"})
		return
	}

	// Buscar pagamento pelo ID do MercadoPago
	payment, err := GetPaymentByMercadoPagoID(webhookReq.Data.ID)
	if err != nil {
		log.Printf("Pagamento não encontrado para webhook: %s", webhookReq.Data.ID)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pagamento não encontrado",
		})
		return
	}

	// Buscar dados atualizados do MercadoPago
	mpPayment, err := mpClient.GetPayment(webhookReq.Data.ID)
	if err != nil {
		log.Printf("Erro ao buscar pagamento no MercadoPago: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao processar webhook",
		})
		return
	}

	// Atualizar status no banco
	newStatus := ConvertMercadoPagoStatus(mpPayment.Status)
	if err := UpdatePaymentStatus(payment.ID, newStatus); err != nil {
		log.Printf("Erro ao atualizar status: %v", err)
	}

	log.Printf("Webhook processado: Payment %s -> Status %s", payment.ID, newStatus)

	c.JSON(http.StatusOK, gin.H{
		"message": "Webhook processado com sucesso",
	})
}

// GetMercadoPagoConfigHandler retorna configurações do MercadoPago para o frontend
func GetMercadoPagoConfigHandler(c *gin.Context) {
	publicKey := os.Getenv("MERCADOPAGO_PUBLIC_KEY")
	if publicKey == "" {
		publicKey = "TEST-b7d5893f-f5af-4936-a199-b22b9d6e22fc"
	}

	isSandbox := os.Getenv("MERCADOPAGO_SANDBOX") == "true"

	c.JSON(http.StatusOK, gin.H{
		"public_key": publicKey,
		"sandbox":    isSandbox,
		"supported_methods": []string{
			"credit_card",
			"debit_card",
			"pix",
			"bolbradesco",
		},
	})
}

// Funções auxiliares
func getPaymentMethodID(method PaymentMethod) string {
	switch method {
	case MethodCreditCard:
		return "credit_card"
	case MethodDebitCard:
		return "debit_card"
	case MethodPix:
		return "pix"
	case MethodBoleto:
		return "bolbradesco"
	default:
		return "credit_card"
	}
}

func getNotificationURL() string {
	baseURL := "http://localhost:3004"
	if os.Getenv("WEBHOOK_BASE_URL") != "" {
		baseURL = os.Getenv("WEBHOOK_BASE_URL")
	}
	return baseURL + "/webhook"
}

func getLastName(fullName string) string {
	parts := strings.Split(fullName, " ")
	if len(parts) > 1 {
		return strings.Join(parts[1:], " ")
	}
	return ""
}
