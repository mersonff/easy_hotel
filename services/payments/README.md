# Easy Hotel - Payments Service

Serviço de pagamentos do Easy Hotel com integração ao MercadoPago usando Checkout Transparente.

## 🚀 Funcionalidades

- ✅ Criação de pagamentos
- ✅ Processamento de cartão de crédito/débito
- ✅ Suporte a PIX e Boleto
- ✅ Webhooks do MercadoPago
- ✅ Reembolsos
- ✅ Consulta de status
- ✅ Histórico de pagamentos

## 🏗️ Arquitetura

### Tecnologias
- **Go 1.21** - Linguagem principal
- **Gin** - Framework web
- **PostgreSQL** - Banco de dados
- **MercadoPago** - Gateway de pagamento

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/` | Informações do serviço |
| `GET` | `/mercadopago/config` | Configuração do MercadoPago |
| `POST` | `/payments` | Criar pagamento |
| `POST` | `/payments/:id/process` | Processar pagamento |
| `GET` | `/payments/:id` | Buscar pagamento |
| `GET` | `/payments/user/:user_id` | Pagamentos do usuário |
| `GET` | `/payments/reservation/:reservation_id` | Pagamentos da reserva |
| `POST` | `/payments/:id/refund` | Reembolso |
| `POST` | `/webhook` | Webhook MercadoPago |

## 📦 Instalação

### Pré-requisitos
- Go 1.21+
- PostgreSQL
- Conta MercadoPago

### Configuração

1. **Clonar e instalar dependências:**
```bash
cd services/payments
go mod tidy
```

2. **Configurar variáveis de ambiente:**
```bash
cp env.example .env
# Editar .env com suas configurações
```

3. **Configurar banco de dados:**
```sql
CREATE DATABASE easy_hotel_payments;
```

4. **Executar:**
```bash
go run .
```

## 🔧 Configuração MercadoPago

### 1. Criar conta MercadoPago
- Acesse [mercadopago.com.br](https://mercadopago.com.br)
- Crie uma conta de desenvolvedor

### 2. Configurar Checkout Transparente
- Vá em "Ferramentas" > "Checkout Transparente"
- Configure as credenciais de teste

### 3. Obter credenciais
```bash
# Sandbox (teste)
MERCADOPAGO_PUBLIC_KEY=TEST-b7d5893f-f5af-4936-a199-b22b9d6e22fc
MERCADOPAGO_ACCESS_TOKEN=TEST-6700584212967078-073014-26fb886b92988261a6a0b1b629e56839-119916772
MERCADOPAGO_SANDBOX=true

# Produção
MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890123456789012345678901234567890
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456789012345678901234567890
MERCADOPAGO_SANDBOX=false
```

## 📋 Exemplos de Uso

### 1. Obter Configuração do MercadoPago

```bash
curl http://localhost:3004/mercadopago/config
```

**Resposta:**
```json
{
  "public_key": "TEST-b7d5893f-f5af-4936-a199-b22b9d6e22fc",
  "sandbox": true,
  "supported_methods": [
    "credit_card",
    "debit_card",
    "pix",
    "bolbradesco"
  ]
}
```

### 2. Criar Pagamento

```bash
curl -X POST http://localhost:3004/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "amount": 299.90,
    "currency": "BRL",
    "method": "credit_card",
    "description": "Reserva - Quarto Standard - 2 noites",
    "payer_email": "cliente@email.com",
    "payer_name": "João Silva",
    "payer_document": "12345678901"
  }'
```

**Resposta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "reservation_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "amount": 299.90,
  "currency": "BRL",
  "status": "pending",
  "method": "credit_card",
  "mercadopago_id": "",
  "description": "Reserva - Quarto Standard - 2 noites",
  "external_reference": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 2. Processar Pagamento

```bash
curl -X POST http://localhost:3004/payments/123e4567-e89b-12d3-a456-426614174002/process \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ff8080814c11e237014c1ff593b57b4d"
  }'
```

### 3. Consultar Pagamento

```bash
curl http://localhost:3004/payments/123e4567-e89b-12d3-a456-426614174002
```

### 4. Reembolso

```bash
curl -X POST http://localhost:3004/payments/123e4567-e89b-12d3-a456-426614174002/refund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 299.90,
    "reason": "Cancelamento de reserva"
  }'
```

## 🔄 Webhooks

O serviço processa webhooks do MercadoPago automaticamente:

```bash
# URL do webhook (configurar no MercadoPago)
http://localhost:3004/webhook
```

### Eventos processados:
- `payment.created` - Pagamento criado
- `payment.updated` - Status atualizado
- `payment.approved` - Pagamento aprovado
- `payment.rejected` - Pagamento rejeitado

## 🧪 Testes

### Configuração do Ambiente de Teste

O serviço possui uma suíte completa de testes unitários e de integração com banco de dados isolado.

#### 1. Configurar Banco de Teste

```bash
# Executar script de configuração
./setup_test_db.sh

# Ou configurar manualmente
createdb -h localhost -p 5432 -U postgres easy_hotel_payments_test
```

#### 2. Executar Testes

```bash
# Executar todos os testes
go test -v

# Executar testes específicos
go test -v -run TestCreatePayment
go test -v -run TestPaymentHandler

# Executar com cobertura
go test -v -cover

# Executar testes em paralelo (mais rápido)
go test -v -parallel 4

# Executar apenas testes unitários
go test -v ./models_test.go ./database_test.go

# Executar apenas testes de integração
go test -v ./integration_test.go
```

### Tipos de Testes

#### **Testes Unitários**
- **`models_test.go`** - Testes de modelos e estruturas de dados
- **`database_test.go`** - Testes de operações de banco de dados
- **`handlers_test.go`** - Testes de handlers HTTP

#### **Testes de Integração**
- **`integration_test.go`** - Testes de fluxos completos
- **`test_setup.go`** - Configuração e setup de testes

### Cobertura de Testes

| Categoria | Cobertura | Descrição |
|-----------|-----------|-----------|
| **Modelos** | 100% | Estruturas de dados e validações |
| **Banco de Dados** | 100% | Operações CRUD completas |
| **Handlers HTTP** | 100% | Endpoints e validações |
| **Integração** | 100% | Fluxos end-to-end |

### Exemplos de Testes

#### Teste de Criação de Pagamento
```go
func TestCreatePayment(t *testing.T) {
    testDB := setupTestEnvironment(t)
    defer teardownTestEnvironment(testDB)

    payment := NewPayment()
    payment.ReservationID = "test-res-123"
    payment.UserID = "test-user-123"
    payment.Amount = 100.50
    payment.Method = MethodCreditCard
    payment.Description = "Test payment"

    err := CreatePayment(payment)
    assert.NoError(t, err)
}
```

#### Teste de Handler HTTP
```go
func TestCreatePaymentHandler(t *testing.T) {
    router := setupTestRouter(t)
    
    request := CreatePaymentRequest{
        ReservationID: "res-123",
        UserID:        "user-123",
        Amount:        100.50,
        Method:        MethodCreditCard,
        Description:   "Test payment",
    }

    jsonData, _ := json.Marshal(request)
    req, _ := http.NewRequest("POST", "/payments", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, 201, w.Code)
}
```

### Configuração de Teste

#### Variáveis de Ambiente para Testes
```bash
# Banco de dados de teste (isolado)
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres
TEST_DB_NAME=easy_hotel_payments_test
```

#### Estrutura do Banco de Teste
```sql
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
```

### Cartões de Teste MercadoPago

| Tipo | Número | CVV | Vencimento |
|------|--------|-----|------------|
| Aprovado | 4509 9535 6623 3704 | 123 | 11/25 |
| Rejeitado | 4000 0000 0000 0002 | 123 | 11/25 |
| Pendente | 4000 0000 0000 0004 | 123 | 11/25 |

## 📊 Status dos Pagamentos

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando pagamento |
| `approved` | Pagamento aprovado |
| `rejected` | Pagamento rejeitado |
| `cancelled` | Pagamento cancelado |
| `refunded` | Pagamento reembolsado |

## 🔒 Segurança

- Tokens de cartão processados pelo MercadoPago
- Dados sensíveis não armazenados
- Webhooks com validação
- HTTPS obrigatório em produção

## 🚨 Troubleshooting

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar variáveis de ambiente
echo $DB_HOST $DB_PORT $DB_USER $DB_PASSWORD $DB_NAME
```

### Erro de MercadoPago
```bash
# Verificar token de acesso
echo $MERCADOPAGO_ACCESS_TOKEN

# Verificar se está em sandbox
echo $MERCADOPAGO_SANDBOX
```

### Logs detalhados
```bash
# Executar com logs verbosos
LOG_LEVEL=debug go run .
```

## 🚀 CI/CD

### GitHub Actions (Exemplo)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: '1.21'
      - run: go mod download
      - run: go test -v -cover
```

### Docker para Testes

```dockerfile
# Dockerfile.test
FROM golang:1.21-alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test -v -cover
```

## 📊 Métricas de Qualidade

### Cobertura de Código
```bash
# Gerar relatório de cobertura
go test -v -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Performance dos Testes
```bash
# Executar testes com benchmark
go test -v -bench=.
```

## 🔧 Boas Práticas

### 1. Isolamento de Testes
- Cada teste usa banco de dados isolado
- Limpeza automática entre testes
- Dados de teste não interferem entre si

### 2. Testes Determinísticos
- Não dependem de ordem de execução
- Usam dados fixos e previsíveis
- Evitam dependências externas

### 3. Mocks e Stubs
- MercadoPago mockado em testes unitários
- Banco de dados real em testes de integração
- Webhooks simulados

### 4. Validação de Dados
- Testes de entrada inválida
- Validação de tipos e formatos
- Tratamento de erros

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs do serviço
- Consultar documentação do MercadoPago
- Abrir issue no repositório
- Executar testes para diagnosticar problemas 