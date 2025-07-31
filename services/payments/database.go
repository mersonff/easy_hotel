package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

// InitDatabase inicializa a conexão com o banco de dados
func InitDatabase() error {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}

	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "easy_hotel_payments"
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	var err error
	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		return fmt.Errorf("erro ao conectar ao banco: %v", err)
	}

	// Testar conexão
	if err = db.Ping(); err != nil {
		return fmt.Errorf("erro ao pingar banco: %v", err)
	}

	// Criar tabela se não existir
	if err = createTables(); err != nil {
		return fmt.Errorf("erro ao criar tabelas: %v", err)
	}

	log.Println("✅ Conectado ao banco de dados PostgreSQL")
	return nil
}

// createTables cria as tabelas necessárias
func createTables() error {
	// Verificar se a tabela já existe
	var exists bool
	err := db.QueryRow("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments')").Scan(&exists)
	if err != nil {
		return fmt.Errorf("erro ao verificar se tabela existe: %v", err)
	}

	if exists {
		log.Println("📋 Tabela payments já existe, pulando criação")
		return nil
	}

	query := `
	CREATE TABLE payments (
		id VARCHAR(36) PRIMARY KEY,
		reservation_id VARCHAR(36) NOT NULL,
		user_id VARCHAR(36) NOT NULL,
		amount DECIMAL(10,2) NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		method VARCHAR(20) NOT NULL,
		mercadopago_id VARCHAR(50),
		description TEXT NOT NULL,
		external_reference VARCHAR(100),
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	);
	
	CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
	CREATE INDEX idx_payments_user_id ON payments(user_id);
	CREATE INDEX idx_payments_status ON payments(status);
	CREATE INDEX idx_payments_mercadopago_id ON payments(mercadopago_id);
	`

	_, err = db.Exec(query)
	if err != nil {
		return fmt.Errorf("erro ao criar tabelas: %v", err)
	}

	log.Println("📋 Tabelas criadas com sucesso")
	return nil
}

// CreatePayment salva um novo pagamento no banco
func CreatePayment(payment *Payment) error {
	query := `
		INSERT INTO payments (
			id, reservation_id, user_id, amount, currency, status, method,
			mercadopago_id, description, external_reference, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := db.Exec(query,
		payment.ID, payment.ReservationID, payment.UserID, payment.Amount,
		payment.Currency, payment.Status, payment.Method, payment.MercadoPagoID,
		payment.Description, payment.ExternalReference, payment.CreatedAt, payment.UpdatedAt,
	)

	return err
}

// GetPaymentByID busca um pagamento pelo ID
func GetPaymentByID(id string) (*Payment, error) {
	query := `
		SELECT id, reservation_id, user_id, amount, currency, status, method,
			   mercadopago_id, description, external_reference, created_at, updated_at
		FROM payments WHERE id = $1
	`

	payment := &Payment{}
	err := db.QueryRow(query, id).Scan(
		&payment.ID, &payment.ReservationID, &payment.UserID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.Method, &payment.MercadoPagoID,
		&payment.Description, &payment.ExternalReference, &payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// GetPaymentByMercadoPagoID busca um pagamento pelo ID do MercadoPago
func GetPaymentByMercadoPagoID(mercadopagoID string) (*Payment, error) {
	query := `
		SELECT id, reservation_id, user_id, amount, currency, status, method,
			   mercadopago_id, description, external_reference, created_at, updated_at
		FROM payments WHERE mercadopago_id = $1
	`

	payment := &Payment{}
	err := db.QueryRow(query, mercadopagoID).Scan(
		&payment.ID, &payment.ReservationID, &payment.UserID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.Method, &payment.MercadoPagoID,
		&payment.Description, &payment.ExternalReference, &payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// UpdatePaymentStatus atualiza o status de um pagamento
func UpdatePaymentStatus(id string, status PaymentStatus) error {
	query := `
		UPDATE payments 
		SET status = $1, updated_at = $2 
		WHERE id = $3
	`

	result, err := db.Exec(query, status, time.Now(), id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pagamento não encontrado")
	}

	return nil
}

// UpdateMercadoPagoID atualiza o ID do MercadoPago
func UpdateMercadoPagoID(id string, mercadopagoID string) error {
	query := `
		UPDATE payments 
		SET mercadopago_id = $1, updated_at = $2 
		WHERE id = $3
	`

	result, err := db.Exec(query, mercadopagoID, time.Now(), id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pagamento não encontrado")
	}

	return nil
}

// GetPaymentsByUserID busca todos os pagamentos de um usuário
func GetPaymentsByUserID(userID string) ([]*Payment, error) {
	query := `
		SELECT id, reservation_id, user_id, amount, currency, status, method,
			   mercadopago_id, description, external_reference, created_at, updated_at
		FROM payments WHERE user_id = $1 ORDER BY created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []*Payment
	for rows.Next() {
		payment := &Payment{}
		err := rows.Scan(
			&payment.ID, &payment.ReservationID, &payment.UserID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.Method, &payment.MercadoPagoID,
			&payment.Description, &payment.ExternalReference, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

// GetPaymentsByReservationID busca todos os pagamentos de uma reserva
func GetPaymentsByReservationID(reservationID string) ([]*Payment, error) {
	query := `
		SELECT id, reservation_id, user_id, amount, currency, status, method,
			   mercadopago_id, description, external_reference, created_at, updated_at
		FROM payments WHERE reservation_id = $1 ORDER BY created_at DESC
	`

	rows, err := db.Query(query, reservationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []*Payment
	for rows.Next() {
		payment := &Payment{}
		err := rows.Scan(
			&payment.ID, &payment.ReservationID, &payment.UserID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.Method, &payment.MercadoPagoID,
			&payment.Description, &payment.ExternalReference, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}
