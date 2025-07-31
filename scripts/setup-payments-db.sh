#!/bin/bash

echo "🔧 Configurando banco de dados para Payments Service"
echo "=================================================="

# Verificar se o namespace existe
if ! kubectl get namespace easy-hotel > /dev/null 2>&1; then
    echo "❌ Namespace 'easy-hotel' não existe!"
    echo "Execute primeiro: skaffold dev"
    exit 1
fi

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
kubectl wait --for=condition=ready pod -l app=postgres -n easy-hotel --timeout=300s

if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL não ficou pronto no tempo esperado"
    exit 1
fi

echo "✅ PostgreSQL está pronto!"

# Criar banco de dados easy_hotel_payments
echo "🗄️ Criando banco de dados easy_hotel_payments..."
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "CREATE DATABASE easy_hotel_payments;" 2>/dev/null || echo "Banco já existe ou erro ao criar"

# Verificar se o banco foi criado
echo "🔍 Verificando se o banco foi criado..."
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "\l" | grep easy_hotel_payments

if [ $? -eq 0 ]; then
    echo "✅ Banco easy_hotel_payments criado com sucesso!"
else
    echo "❌ Erro ao criar banco easy_hotel_payments"
    exit 1
fi

echo ""
echo "🎉 Configuração concluída!"
echo "Agora você pode executar: skaffold dev" 