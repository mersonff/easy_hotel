package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupIntegrationTest(t *testing.T) *gin.Engine {
	// Configurar ambiente de teste
	testDB := setupTestEnvironment(t)
	if testDB == nil {
		t.Skip("Banco de dados de teste não disponível")
	}

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Configurar todas as rotas
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	r.POST("/payments", CreatePaymentHandler)
	r.GET("/payments/:id", GetPaymentHandler)
	r.GET("/payments/user/:user_id", GetPaymentsByUserHandler)
	r.GET("/payments/reservation/:reservation_id", GetPaymentsByReservationHandler)
	r.POST("/payments/:id/process", ProcessPaymentHandler)
	r.POST("/payments/:id/refund", RefundPaymentHandler)
	r.GET("/mercadopago/config", GetMercadoPagoConfigHandler)
	r.POST("/webhook", WebhookHandler)

	return r
}

func TestPaymentFlowIntegration(t *testing.T) {
	router := setupIntegrationTest(t)

	t.Run("Complete Payment Flow", func(t *testing.T) {
		// 1. Criar pagamento
		createReq := CreatePaymentRequest{
			ReservationID: "res-int-123",
			UserID:        "user-int-123",
			Amount:        150.75,
			Currency:      "BRL",
			Method:        MethodCreditCard,
			Description:   "Integration test payment",
			PayerEmail:    "integration@test.com",
			PayerName:     "Integration Test",
			PayerDocument: "12345678901",
		}

		jsonData, _ := json.Marshal(createReq)
		req, _ := http.NewRequest("POST", "/payments", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var paymentResponse PaymentResponse
		err := json.Unmarshal(w.Body.Bytes(), &paymentResponse)
		assert.NoError(t, err)
		assert.NotEmpty(t, paymentResponse.ID)

		// 2. Buscar pagamento criado
		req, _ = http.NewRequest("GET", "/payments/"+paymentResponse.ID, nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		// 3. Buscar pagamentos do usuário
		req, _ = http.NewRequest("GET", "/payments/user/"+createReq.UserID, nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		// 4. Buscar pagamentos da reserva
		req, _ = http.NewRequest("GET", "/payments/reservation/"+createReq.ReservationID, nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHealthCheckIntegration(t *testing.T) {
	router := setupIntegrationTest(t)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "OK", response["status"])
}

func TestMercadoPagoConfigIntegration(t *testing.T) {
	router := setupIntegrationTest(t)

	req, _ := http.NewRequest("GET", "/mercadopago/config", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "public_key")
}
