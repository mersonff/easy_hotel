package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

// setupTestDB inicializa um banco de dados de teste
func setupTestDB(t *testing.T) *sql.DB {
	// Usar variáveis de ambiente de teste
	host := os.Getenv("TEST_DB_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("TEST_DB_PORT")
	if port == "" {
		port = "5432"
	}

	user := os.Getenv("TEST_DB_USER")
	if user == "" {
		user = "postgres"
	}

	password := os.Getenv("TEST_DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}

	dbname := os.Getenv("TEST_DB_NAME")
	if dbname == "" {
		dbname = "easy_hotel_payments_test"
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	testDB, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		t.Skipf("Não foi possível conectar ao banco de teste: %v", err)
		return nil
	}

	// Testar conexão
	if err = testDB.Ping(); err != nil {
		t.Skipf("Não foi possível pingar banco de teste: %v", err)
		return nil
	}

	// Criar tabela de teste se não existir
	createTestTable(testDB)

	return testDB
}

// createTestTable cria a tabela de pagamentos para testes
func createTestTable(testDB *sql.DB) {
	query := `
	CREATE TABLE IF NOT EXISTS payments (
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
	
	CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
	CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
	CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
	CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_id ON payments(mercadopago_id);
	`

	_, err := testDB.Exec(query)
	if err != nil {
		log.Printf("Erro ao criar tabela de teste: %v", err)
	}
}

// cleanupTestDB limpa os dados de teste
func cleanupTestDB(testDB *sql.DB) {
	if testDB != nil {
		_, err := testDB.Exec("DELETE FROM payments")
		if err != nil {
			log.Printf("Erro ao limpar dados de teste: %v", err)
		}
	}
}

// setupTestEnvironment configura o ambiente de teste
func setupTestEnvironment(t *testing.T) *sql.DB {
	// Configurar variáveis de ambiente de teste se não estiverem definidas
	if os.Getenv("TEST_DB_HOST") == "" {
		os.Setenv("TEST_DB_HOST", "localhost")
	}
	if os.Getenv("TEST_DB_PORT") == "" {
		os.Setenv("TEST_DB_PORT", "5432")
	}
	if os.Getenv("TEST_DB_USER") == "" {
		os.Setenv("TEST_DB_USER", "postgres")
	}
	if os.Getenv("TEST_DB_PASSWORD") == "" {
		os.Setenv("TEST_DB_PASSWORD", "postgres")
	}
	if os.Getenv("TEST_DB_NAME") == "" {
		os.Setenv("TEST_DB_NAME", "easy_hotel_payments_test")
	}

	// Inicializar banco de teste
	testDB := setupTestDB(t)
	if testDB == nil {
		t.Skip("Banco de dados de teste não disponível")
		return nil
	}

	// Substituir a variável global db pela de teste
	db = testDB

	return testDB
}

// teardownTestEnvironment limpa o ambiente de teste
func teardownTestEnvironment(testDB *sql.DB) {
	if testDB != nil {
		cleanupTestDB(testDB)
		testDB.Close()
	}
}
