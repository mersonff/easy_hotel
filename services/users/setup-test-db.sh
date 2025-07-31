#!/bin/bash

echo "🧪 Configurando banco de teste"

# Verificar PostgreSQL
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL não está rodando na porta 5432"
    exit 1
fi

# Executar migrations
echo "🔄 Executando migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/easy_hotel_users_test?schema=public" npm run db:push

echo "✅ Banco de teste configurado!"
echo "📋 npm test                    # Executar testes" 