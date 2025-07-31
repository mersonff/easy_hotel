package main

import (
	"time"

	"github.com/google/uuid"
)

// PaymentStatus representa o status de um pagamento
type PaymentStatus string

const (
	StatusPending   PaymentStatus = "pending"
	StatusApproved  PaymentStatus = "approved"
	StatusRejected  PaymentStatus = "rejected"
	StatusCancelled PaymentStatus = "cancelled"
	StatusRefunded  PaymentStatus = "refunded"
)

// PaymentMethod representa o método de pagamento
type PaymentMethod string

const (
	MethodCreditCard PaymentMethod = "credit_card"
	MethodDebitCard  PaymentMethod = "debit_card"
	MethodPix        PaymentMethod = "pix"
	MethodBoleto     PaymentMethod = "boleto"
)

// Payment representa uma transação de pagamento
type Payment struct {
	ID              string        `json:"id" db:"id"`
	ReservationID   string        `json:"reservation_id" db:"reservation_id"`
	UserID          string        `json:"user_id" db:"user_id"`
	Amount          float64       `json:"amount" db:"amount"`
	Currency        string        `json:"currency" db:"currency"`
	Status          PaymentStatus `json:"status" db:"status"`
	Method          PaymentMethod `json:"method" db:"method"`
	MercadoPagoID   string        `json:"mercadopago_id" db:"mercadopago_id"`
	Description     string        `json:"description" db:"description"`
	ExternalReference string      `json:"external_reference" db:"external_reference"`
	CreatedAt       time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at" db:"updated_at"`
}

// CreatePaymentRequest representa a requisição para criar um pagamento
type CreatePaymentRequest struct {
	ReservationID   string        `json:"reservation_id" binding:"required"`
	UserID          string        `json:"user_id" binding:"required"`
	Amount          float64       `json:"amount" binding:"required,gt=0"`
	Currency        string        `json:"currency" binding:"required"`
	Method          PaymentMethod `json:"method" binding:"required"`
	Description     string        `json:"description" binding:"required"`
	PayerEmail      string        `json:"payer_email" binding:"required,email"`
	PayerName       string        `json:"payer_name" binding:"required"`
	PayerDocument   string        `json:"payer_document" binding:"required"`
}

// PaymentResponse representa a resposta de um pagamento
type PaymentResponse struct {
	ID              string        `json:"id"`
	ReservationID   string        `json:"reservation_id"`
	UserID          string        `json:"user_id"`
	Amount          float64       `json:"amount"`
	Currency        string        `json:"currency"`
	Status          PaymentStatus `json:"status"`
	Method          PaymentMethod `json:"method"`
	MercadoPagoID   string        `json:"mercadopago_id"`
	Description     string        `json:"description"`
	ExternalReference string      `json:"external_reference"`
	PaymentURL      string        `json:"payment_url,omitempty"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

// RefundRequest representa a requisição para reembolso
type RefundRequest struct {
	Amount    float64 `json:"amount"`
	Reason    string  `json:"reason" binding:"required"`
}

// WebhookRequest representa o webhook do MercadoPago
type WebhookRequest struct {
	Type    string `json:"type"`
	Data    struct {
		ID string `json:"id"`
	} `json:"data"`
}

// MercadoPagoPayment representa a estrutura de pagamento do MercadoPago
type MercadoPagoPayment struct {
	ID                 string                 `json:"id"`
	Status             string                 `json:"status"`
	StatusDetail       string                 `json:"status_detail"`
	ExternalReference  string                 `json:"external_reference"`
	TransactionAmount  float64                `json:"transaction_amount"`
	Currency           string                 `json:"currency"`
	PaymentMethodID    string                 `json:"payment_method_id"`
	Payer              MercadoPagoPayer      `json:"payer"`
	Description        string                 `json:"description"`
	InitPoint          string                 `json:"init_point"`
	SandboxInitPoint   string                 `json:"sandbox_init_point"`
	CreatedAt          string                 `json:"created_at"`
	UpdatedAt          string                 `json:"updated_at"`
}

// MercadoPagoPayer representa o pagador no MercadoPago
type MercadoPagoPayer struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Document struct {
		Type  string `json:"type"`
		Number string `json:"number"`
	} `json:"identification"`
}

// NewPayment cria uma nova instância de Payment
func NewPayment() *Payment {
	return &Payment{
		ID:        uuid.New().String(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Currency:  "BRL",
		Status:    StatusPending,
	}
} 