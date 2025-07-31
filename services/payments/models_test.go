package main

import (
	"testing"
	"time"
)

func TestNewPayment(t *testing.T) {
	payment := NewPayment()

	// Verificar se o ID foi gerado
	if payment.ID == "" {
		t.Error("ID não deve estar vazio")
	}

	// Verificar se as datas foram definidas
	if payment.CreatedAt.IsZero() {
		t.Error("CreatedAt deve ser definido")
	}

	if payment.UpdatedAt.IsZero() {
		t.Error("UpdatedAt deve ser definido")
	}

	// Verificar valores padrão
	if payment.Currency != "BRL" {
		t.Errorf("Currency deve ser BRL, got %s", payment.Currency)
	}

	if payment.Status != StatusPending {
		t.Errorf("Status deve ser pending, got %s", payment.Status)
	}
}

func TestPaymentStatusConstants(t *testing.T) {
	// Verificar se as constantes de status estão definidas
	expectedStatuses := []PaymentStatus{
		StatusPending,
		StatusApproved,
		StatusRejected,
		StatusCancelled,
		StatusRefunded,
	}

	for _, status := range expectedStatuses {
		if status == "" {
			t.Error("Status não deve estar vazio")
		}
	}
}

func TestPaymentMethodConstants(t *testing.T) {
	// Verificar se as constantes de método estão definidas
	expectedMethods := []PaymentMethod{
		MethodCreditCard,
		MethodDebitCard,
		MethodPix,
		MethodBoleto,
	}

	for _, method := range expectedMethods {
		if method == "" {
			t.Error("Method não deve estar vazio")
		}
	}
}

func TestCreatePaymentRequestValidation(t *testing.T) {
	tests := []struct {
		name    string
		request CreatePaymentRequest
		isValid bool
	}{
		{
			name: "Request válida",
			request: CreatePaymentRequest{
				ReservationID: "res-123",
				UserID:        "user-123",
				Amount:        100.50,
				Currency:      "BRL",
				Method:        MethodCreditCard,
				Description:   "Pagamento da reserva",
				PayerEmail:    "test@example.com",
				PayerName:     "João Silva",
				PayerDocument: "12345678901",
			},
			isValid: true,
		},
		{
			name: "Amount zero",
			request: CreatePaymentRequest{
				ReservationID: "res-123",
				UserID:        "user-123",
				Amount:        0,
				Currency:      "BRL",
				Method:        MethodCreditCard,
				Description:   "Pagamento da reserva",
				PayerEmail:    "test@example.com",
				PayerName:     "João Silva",
				PayerDocument: "12345678901",
			},
			isValid: false,
		},
		{
			name: "Amount negativo",
			request: CreatePaymentRequest{
				ReservationID: "res-123",
				UserID:        "user-123",
				Amount:        -100.50,
				Currency:      "BRL",
				Method:        MethodCreditCard,
				Description:   "Pagamento da reserva",
				PayerEmail:    "test@example.com",
				PayerName:     "João Silva",
				PayerDocument: "12345678901",
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Aqui você pode adicionar validação real se implementar
			// Por enquanto, apenas verificamos se os campos obrigatórios estão preenchidos
			isValid := tt.request.ReservationID != "" &&
				tt.request.UserID != "" &&
				tt.request.Amount > 0 &&
				tt.request.Currency != "" &&
				tt.request.Method != "" &&
				tt.request.Description != "" &&
				tt.request.PayerEmail != "" &&
				tt.request.PayerName != "" &&
				tt.request.PayerDocument != ""

			if isValid != tt.isValid {
				t.Errorf("Expected isValid=%v, got %v", tt.isValid, isValid)
			}
		})
	}
}

func TestPaymentResponse(t *testing.T) {
	payment := &Payment{
		ID:                "pay-123",
		ReservationID:     "res-123",
		UserID:            "user-123",
		Amount:            100.50,
		Currency:          "BRL",
		Status:            StatusPending,
		Method:            MethodCreditCard,
		MercadoPagoID:     "mp-123",
		Description:       "Pagamento da reserva",
		ExternalReference: "res-123",
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
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

	// Verificar se todos os campos foram copiados corretamente
	if response.ID != payment.ID {
		t.Errorf("ID não foi copiado corretamente")
	}

	if response.Amount != payment.Amount {
		t.Errorf("Amount não foi copiado corretamente")
	}

	if response.Status != payment.Status {
		t.Errorf("Status não foi copiado corretamente")
	}
}
