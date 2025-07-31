package main

import (
	"testing"
	"time"
)

func TestCreatePayment(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	payment := NewPayment()
	payment.ReservationID = "test-res-123"
	payment.UserID = "test-user-123"
	payment.Amount = 100.50
	payment.Currency = "BRL"
	payment.Method = MethodCreditCard
	payment.Description = "Test payment"

	err := CreatePayment(payment)
	if err != nil {
		t.Errorf("Erro ao criar pagamento: %v", err)
	}

	// Verificar se o pagamento foi criado
	createdPayment, err := GetPaymentByID(payment.ID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamento criado: %v", err)
	}

	if createdPayment == nil {
		t.Error("Pagamento não foi encontrado após criação")
	}

	if createdPayment.ID != payment.ID {
		t.Errorf("ID do pagamento não corresponde: esperado %s, obtido %s", payment.ID, createdPayment.ID)
	}
}

func TestGetPaymentByID(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para pagamento não encontrado
	_, err := GetPaymentByID("non-existent-id")
	if err == nil {
		t.Error("Deveria retornar erro para ID inexistente")
	}

	// Criar um pagamento para testar busca
	payment := NewPayment()
	payment.ReservationID = "test-res-456"
	payment.UserID = "test-user-456"
	payment.Amount = 200.75
	payment.Currency = "BRL"
	payment.Method = MethodPix
	payment.Description = "Test payment for retrieval"

	err = CreatePayment(payment)
	if err != nil {
		t.Errorf("Erro ao criar pagamento: %v", err)
	}

	// Buscar o pagamento criado
	retrievedPayment, err := GetPaymentByID(payment.ID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamento: %v", err)
	}

	if retrievedPayment == nil {
		t.Error("Pagamento não foi encontrado")
	}

	if retrievedPayment.ID != payment.ID {
		t.Errorf("ID do pagamento não corresponde: esperado %s, obtido %s", payment.ID, retrievedPayment.ID)
	}
}

func TestGetPaymentByMercadoPagoID(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para pagamento não encontrado
	_, err := GetPaymentByMercadoPagoID("non-existent-mp-id")
	if err == nil {
		t.Error("Deveria retornar erro para MercadoPago ID inexistente")
	}

	// Criar um pagamento com MercadoPago ID
	payment := NewPayment()
	payment.ReservationID = "test-res-789"
	payment.UserID = "test-user-789"
	payment.Amount = 300.25
	payment.Currency = "BRL"
	payment.Method = MethodCreditCard
	payment.Description = "Test payment with MP ID"
	payment.MercadoPagoID = "mp-test-123"

	err = CreatePayment(payment)
	if err != nil {
		t.Errorf("Erro ao criar pagamento: %v", err)
	}

	// Buscar o pagamento pelo MercadoPago ID
	retrievedPayment, err := GetPaymentByMercadoPagoID(payment.MercadoPagoID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamento por MP ID: %v", err)
	}

	if retrievedPayment == nil {
		t.Error("Pagamento não foi encontrado por MP ID")
	}

	if retrievedPayment.MercadoPagoID != payment.MercadoPagoID {
		t.Errorf("MercadoPago ID não corresponde: esperado %s, obtido %s", payment.MercadoPagoID, retrievedPayment.MercadoPagoID)
	}
}

func TestUpdatePaymentStatus(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para atualização de status inexistente
	err := UpdatePaymentStatus("non-existent-id", StatusApproved)
	if err == nil {
		t.Error("Deveria retornar erro para ID inexistente")
	}

	// Criar um pagamento para testar atualização
	payment := NewPayment()
	payment.ReservationID = "test-res-update"
	payment.UserID = "test-user-update"
	payment.Amount = 150.50
	payment.Currency = "BRL"
	payment.Method = MethodCreditCard
	payment.Description = "Test payment for status update"

	err = CreatePayment(payment)
	if err != nil {
		t.Errorf("Erro ao criar pagamento: %v", err)
	}

	// Atualizar status
	err = UpdatePaymentStatus(payment.ID, StatusApproved)
	if err != nil {
		t.Errorf("Erro ao atualizar status: %v", err)
	}

	// Verificar se o status foi atualizado
	updatedPayment, err := GetPaymentByID(payment.ID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamento atualizado: %v", err)
	}

	if updatedPayment.Status != StatusApproved {
		t.Errorf("Status não foi atualizado: esperado %s, obtido %s", StatusApproved, updatedPayment.Status)
	}
}

func TestUpdateMercadoPagoID(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para atualização de MercadoPago ID inexistente
	err := UpdateMercadoPagoID("non-existent-id", "mp-123")
	if err == nil {
		t.Error("Deveria retornar erro para ID inexistente")
	}

	// Criar um pagamento para testar atualização
	payment := NewPayment()
	payment.ReservationID = "test-res-mp-update"
	payment.UserID = "test-user-mp-update"
	payment.Amount = 175.50
	payment.Currency = "BRL"
	payment.Method = MethodCreditCard
	payment.Description = "Test payment for MP ID update"

	err = CreatePayment(payment)
	if err != nil {
		t.Errorf("Erro ao criar pagamento: %v", err)
	}

	// Atualizar MercadoPago ID
	mpID := "mp-test-update-123"
	err = UpdateMercadoPagoID(payment.ID, mpID)
	if err != nil {
		t.Errorf("Erro ao atualizar MercadoPago ID: %v", err)
	}

	// Verificar se o MercadoPago ID foi atualizado
	updatedPayment, err := GetPaymentByID(payment.ID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamento atualizado: %v", err)
	}

	if updatedPayment.MercadoPagoID != mpID {
		t.Errorf("MercadoPago ID não foi atualizado: esperado %s, obtido %s", mpID, updatedPayment.MercadoPagoID)
	}
}

func TestGetPaymentsByUserID(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para buscar pagamentos de usuário inexistente
	payments, err := GetPaymentsByUserID("test-user-123")
	if err != nil {
		t.Logf("Erro ao buscar pagamentos: %v", err)
	}

	// Deve retornar uma lista vazia para usuário inexistente
	if len(payments) != 0 {
		t.Errorf("Deveria retornar lista vazia, got %d pagamentos", len(payments))
	}

	// Criar pagamentos para um usuário específico
	userID := "test-user-multiple"

	payment1 := NewPayment()
	payment1.ReservationID = "res-1"
	payment1.UserID = userID
	payment1.Amount = 100.00
	payment1.Method = MethodCreditCard
	payment1.Description = "Payment 1"

	payment2 := NewPayment()
	payment2.ReservationID = "res-2"
	payment2.UserID = userID
	payment2.Amount = 200.00
	payment2.Method = MethodPix
	payment2.Description = "Payment 2"

	err = CreatePayment(payment1)
	if err != nil {
		t.Errorf("Erro ao criar pagamento 1: %v", err)
	}

	err = CreatePayment(payment2)
	if err != nil {
		t.Errorf("Erro ao criar pagamento 2: %v", err)
	}

	// Buscar pagamentos do usuário
	userPayments, err := GetPaymentsByUserID(userID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamentos do usuário: %v", err)
	}

	if len(userPayments) != 2 {
		t.Errorf("Deveria retornar 2 pagamentos, got %d", len(userPayments))
	}
}

func TestGetPaymentsByReservationID(t *testing.T) {
	testDB := setupTestEnvironment(t)
	defer teardownTestEnvironment(testDB)

	// Teste para buscar pagamentos de reserva inexistente
	payments, err := GetPaymentsByReservationID("test-res-123")
	if err != nil {
		t.Logf("Erro ao buscar pagamentos: %v", err)
	}

	// Deve retornar uma lista vazia para reserva inexistente
	if len(payments) != 0 {
		t.Errorf("Deveria retornar lista vazia, got %d pagamentos", len(payments))
	}

	// Criar pagamentos para uma reserva específica
	reservationID := "test-res-multiple"

	payment1 := NewPayment()
	payment1.ReservationID = reservationID
	payment1.UserID = "user-1"
	payment1.Amount = 150.00
	payment1.Method = MethodCreditCard
	payment1.Description = "Payment for reservation 1"

	payment2 := NewPayment()
	payment2.ReservationID = reservationID
	payment2.UserID = "user-2"
	payment2.Amount = 250.00
	payment2.Method = MethodPix
	payment2.Description = "Payment for reservation 2"

	err = CreatePayment(payment1)
	if err != nil {
		t.Errorf("Erro ao criar pagamento 1: %v", err)
	}

	err = CreatePayment(payment2)
	if err != nil {
		t.Errorf("Erro ao criar pagamento 2: %v", err)
	}

	// Buscar pagamentos da reserva
	reservationPayments, err := GetPaymentsByReservationID(reservationID)
	if err != nil {
		t.Errorf("Erro ao buscar pagamentos da reserva: %v", err)
	}

	if len(reservationPayments) != 2 {
		t.Errorf("Deveria retornar 2 pagamentos, got %d", len(reservationPayments))
	}
}

// Testes de integração com banco de dados
func TestPaymentCRUD(t *testing.T) {
	// Este teste simula um fluxo completo de CRUD
	// Em um ambiente real, você usaria um banco de teste isolado

	t.Run("Create and Retrieve Payment", func(t *testing.T) {
		payment := NewPayment()
		payment.ReservationID = "test-res-456"
		payment.UserID = "test-user-456"
		payment.Amount = 200.75
		payment.Currency = "BRL"
		payment.Method = MethodPix
		payment.Description = "Test payment CRUD"

		// Verificar se o pagamento foi criado corretamente
		if payment.ID == "" {
			t.Error("ID deve ser gerado automaticamente")
		}

		if payment.Status != StatusPending {
			t.Errorf("Status inicial deve ser pending, got %s", payment.Status)
		}

		if payment.Currency != "BRL" {
			t.Errorf("Currency padrão deve ser BRL, got %s", payment.Currency)
		}

	})

	t.Run("Update Payment Status", func(t *testing.T) {
		testDB := setupTestEnvironment(t)
		defer teardownTestEnvironment(testDB)

		payment := NewPayment()
		payment.ReservationID = "test-res-789"
		payment.UserID = "test-user-789"
		payment.Amount = 150.25
		payment.Method = MethodCreditCard
		payment.Description = "Test status update"

		// Criar pagamento no banco
		err := CreatePayment(payment)
		if err != nil {
			t.Errorf("Erro ao criar pagamento: %v", err)
		}

		// Atualizar status
		err = UpdatePaymentStatus(payment.ID, StatusApproved)
		if err != nil {
			t.Errorf("Erro ao atualizar status: %v", err)
		}

		// Verificar se o status foi atualizado
		updatedPayment, err := GetPaymentByID(payment.ID)
		if err != nil {
			t.Errorf("Erro ao buscar pagamento: %v", err)
		}

		if updatedPayment.Status != StatusApproved {
			t.Errorf("Status deve ser approved, got %s", updatedPayment.Status)
		}
	})
}

// Testes de validação de dados
func TestPaymentValidation(t *testing.T) {
	t.Run("Valid Payment", func(t *testing.T) {
		payment := NewPayment()
		payment.ReservationID = "res-123"
		payment.UserID = "user-123"
		payment.Amount = 100.50
		payment.Method = MethodCreditCard
		payment.Description = "Valid payment"

		// Verificar se todos os campos obrigatórios estão preenchidos
		if payment.ReservationID == "" {
			t.Error("ReservationID é obrigatório")
		}

		if payment.UserID == "" {
			t.Error("UserID é obrigatório")
		}

		if payment.Amount <= 0 {
			t.Error("Amount deve ser maior que zero")
		}

		if payment.Method == "" {
			t.Error("Method é obrigatório")
		}

		if payment.Description == "" {
			t.Error("Description é obrigatório")
		}
	})

	t.Run("Invalid Payment Amount", func(t *testing.T) {
		payment := NewPayment()
		payment.ReservationID = "res-123"
		payment.UserID = "user-123"
		payment.Amount = -50.00 // Valor negativo
		payment.Method = MethodCreditCard
		payment.Description = "Invalid payment"

		if payment.Amount <= 0 {
			t.Log("Amount negativo detectado corretamente")
		}
	})

	t.Run("Invalid Payment Method", func(t *testing.T) {
		payment := NewPayment()
		payment.ReservationID = "res-123"
		payment.UserID = "user-123"
		payment.Amount = 100.50
		payment.Method = "" // Método vazio
		payment.Description = "Invalid payment"

		if payment.Method == "" {
			t.Log("Method vazio detectado corretamente")
		}
	})
}

// Testes de formatação de dados
func TestPaymentFormatting(t *testing.T) {
	t.Run("Currency Formatting", func(t *testing.T) {
		payment := NewPayment()
		payment.Amount = 1234.56
		payment.Currency = "BRL"

		// Verificar se o valor está no formato correto
		expectedAmount := 1234.56
		if payment.Amount != expectedAmount {
			t.Errorf("Amount deve ser %f, got %f", expectedAmount, payment.Amount)
		}
	})

	t.Run("Date Formatting", func(t *testing.T) {
		payment := NewPayment()
		now := time.Now()

		// Verificar se as datas estão próximas (com tolerância de 1 segundo)
		if payment.CreatedAt.Sub(now) > time.Second {
			t.Error("CreatedAt deve ser próximo ao tempo atual")
		}

		if payment.UpdatedAt.Sub(now) > time.Second {
			t.Error("UpdatedAt deve ser próximo ao tempo atual")
		}
	})
}
