#!/bin/bash

# Script para configurar banco de dados de teste para o serviço de payments

echo "🔧 Configurando banco de dados de teste para Payments..."

# Configurações padrão
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME="easy_hotel_payments_test"

# Verificar se PostgreSQL está rodando
echo "📡 Verificando conexão com PostgreSQL..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
    echo "❌ PostgreSQL não está rodando ou não está acessível"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   User: $DB_USER"
    exit 1
fi

echo "✅ PostgreSQL está acessível"

# Criar banco de dados de teste se não existir
echo "🗄️  Verificando banco de dados de teste..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "📝 Criando banco de dados de teste: $DB_NAME"
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    if [ $? -eq 0 ]; then
        echo "✅ Banco de dados criado com sucesso"
    else
        echo "❌ Erro ao criar banco de dados"
        exit 1
    fi
else
    echo "✅ Banco de dados já existe"
fi

# Criar tabela de pagamentos
echo "📋 Criando tabela de pagamentos..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
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
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tabela de pagamentos criada/verificada com sucesso"
else
    echo "❌ Erro ao criar tabela de pagamentos"
    exit 1
fi

# Configurar variáveis de ambiente para teste
echo "🔧 Configurando variáveis de ambiente de teste..."
export TEST_DB_HOST=$DB_HOST
export TEST_DB_PORT=$DB_PORT
export TEST_DB_USER=$DB_USER
export TEST_DB_PASSWORD=$DB_PASSWORD
export TEST_DB_NAME=$DB_NAME

echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo da configuração:"
echo "   Host: $TEST_DB_HOST"
echo "   Port: $TEST_DB_PORT"
echo "   User: $TEST_DB_USER"
echo "   Database: $TEST_DB_NAME"
echo ""
echo "🚀 Para executar os testes:"
echo "   go test -v"
echo ""
echo "💡 Para limpar o banco de teste:"
echo "   dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME" 