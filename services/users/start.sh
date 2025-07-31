#!/bin/sh

# Construir DATABASE_URL dinamicamente
export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres-users-service:5432/easy_hotel_users?schema=public"

echo "🔗 DATABASE_URL configurada: postgresql://postgres:***@postgres-users-service:5432/easy_hotel_users?schema=public"

# Aguardar um pouco para garantir que o banco está pronto
echo "⏳ Aguardando banco de dados..."
sleep 5

# Executar o comando original
exec "$@" 