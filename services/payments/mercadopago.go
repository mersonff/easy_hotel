package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type MercadoPagoClient struct {
	AccessToken string
	BaseURL     string
	HTTPClient  *http.Client
}

// MercadoPagoPaymentRequest representa a requisição de pagamento
type MercadoPagoPaymentRequest struct {
	TransactionAmount   float64                 `json:"transaction_amount"`
	Token               string                  `json:"token"`
	Description         string                  `json:"description"`
	Installments        int                     `json:"installments"`
	PaymentMethodID     string                  `json:"payment_method_id"`
	Payer               MercadoPagoPayerRequest `json:"payer"`
	ExternalReference   string                  `json:"external_reference"`
	NotificationURL     string                  `json:"notification_url"`
	StatementDescriptor string                  `json:"statement_descriptor"`
}

// MercadoPagoPayerRequest representa o pagador na requisição
type MercadoPagoPayerRequest struct {
	Email          string                    `json:"email"`
	FirstName      string                    `json:"first_name"`
	LastName       string                    `json:"last_name"`
	Identification MercadoPagoIdentification `json:"identification"`
}

// MercadoPagoIdentification representa a identificação do pagador
type MercadoPagoIdentification struct {
	Type   string `json:"type"`
	Number string `json:"number"`
}

// MercadoPagoPaymentResponse representa a resposta do pagamento
type MercadoPagoPaymentResponse struct {
	ID                  int64            `json:"id"`
	Status              string           `json:"status"`
	StatusDetail        string           `json:"status_detail"`
	TransactionAmount   float64          `json:"transaction_amount"`
	Currency            string           `json:"currency"`
	PaymentMethodID     string           `json:"payment_method_id"`
	Payer               MercadoPagoPayer `json:"payer"`
	Description         string           `json:"description"`
	ExternalReference   string           `json:"external_reference"`
	StatementDescriptor string           `json:"statement_descriptor"`
	CreatedAt           string           `json:"created_at"`
	UpdatedAt           string           `json:"updated_at"`
}

// MercadoPagoCardTokenRequest representa a requisição para criar token do cartão
type MercadoPagoCardTokenRequest struct {
	CardNumber      string                    `json:"card_number"`
	SecurityCode    string                    `json:"security_code"`
	ExpirationMonth string                    `json:"expiration_month"`
	ExpirationYear  string                    `json:"expiration_year"`
	CardholderName  string                    `json:"cardholder_name"`
	Identification  MercadoPagoIdentification `json:"identification"`
}

// MercadoPagoCardTokenResponse representa a resposta do token do cartão
type MercadoPagoCardTokenResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// NewMercadoPagoClient cria uma nova instância do cliente MercadoPago
func NewMercadoPagoClient() *MercadoPagoClient {
	accessToken := os.Getenv("MERCADOPAGO_ACCESS_TOKEN")
	if accessToken == "" {
		accessToken = "TEST-6700584212967078-073014-26fb886b92988261a6a0b1b629e56839-119916772" // Token de teste
	}

	baseURL := "https://api.mercadopago.com"
	if os.Getenv("MERCADOPAGO_SANDBOX") == "true" {
		baseURL = "https://api.mercadopago.com"
	}

	return &MercadoPagoClient{
		AccessToken: accessToken,
		BaseURL:     baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateCardToken cria um token para o cartão
func (mp *MercadoPagoClient) CreateCardToken(cardTokenReq MercadoPagoCardTokenRequest) (*MercadoPagoCardTokenResponse, error) {
	url := mp.BaseURL + "/v1/card_tokens"

	jsonData, err := json.Marshal(cardTokenReq)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+mp.AccessToken)

	resp, err := mp.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta: %v", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("erro na API: %s - %s", resp.Status, string(body))
	}

	var cardTokenResp MercadoPagoCardTokenResponse
	if err := json.Unmarshal(body, &cardTokenResp); err != nil {
		return nil, fmt.Errorf("erro ao deserializar resposta: %v", err)
	}

	return &cardTokenResp, nil
}

// CreatePayment cria um pagamento no MercadoPago
func (mp *MercadoPagoClient) CreatePayment(paymentReq MercadoPagoPaymentRequest) (*MercadoPagoPaymentResponse, error) {
	url := mp.BaseURL + "/v1/payments"

	jsonData, err := json.Marshal(paymentReq)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar requisição: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+mp.AccessToken)

	resp, err := mp.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta: %v", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("erro na API: %s - %s", resp.Status, string(body))
	}

	var paymentResp MercadoPagoPaymentResponse
	if err := json.Unmarshal(body, &paymentResp); err != nil {
		return nil, fmt.Errorf("erro ao deserializar resposta: %v", err)
	}

	return &paymentResp, nil
}

// GetPayment busca um pagamento pelo ID
func (mp *MercadoPagoClient) GetPayment(paymentID string) (*MercadoPagoPaymentResponse, error) {
	url := mp.BaseURL + "/v1/payments/" + paymentID

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+mp.AccessToken)

	resp, err := mp.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro na API: %s - %s", resp.Status, string(body))
	}

	var paymentResp MercadoPagoPaymentResponse
	if err := json.Unmarshal(body, &paymentResp); err != nil {
		return nil, fmt.Errorf("erro ao deserializar resposta: %v", err)
	}

	return &paymentResp, nil
}

// RefundPayment faz reembolso de um pagamento
func (mp *MercadoPagoClient) RefundPayment(paymentID string, amount float64) error {
	url := mp.BaseURL + "/v1/payments/" + paymentID + "/refunds"

	refundData := map[string]interface{}{
		"amount": amount,
	}

	jsonData, err := json.Marshal(refundData)
	if err != nil {
		return fmt.Errorf("erro ao serializar requisição: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+mp.AccessToken)

	resp, err := mp.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("erro ao fazer requisição: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("erro na API: %s - %s", resp.Status, string(body))
	}

	return nil
}

// ConvertMercadoPagoStatus converte o status do MercadoPago para nosso enum
func ConvertMercadoPagoStatus(mpStatus string) PaymentStatus {
	switch mpStatus {
	case "approved":
		return StatusApproved
	case "rejected":
		return StatusRejected
	case "cancelled":
		return StatusCancelled
	case "refunded":
		return StatusRefunded
	default:
		return StatusPending
	}
}
