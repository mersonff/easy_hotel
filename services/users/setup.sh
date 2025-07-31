#!/bin/bash

echo "🚀 Setup do Users Service"
echo "=========================="

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando .env a partir do env.example..."
    cp env.example .env
    echo "⚠️  IMPORTANTE: Edite o .env com suas credenciais do PostgreSQL!"
fi

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Verificar se o banco está acessível
echo "🔍 Verificando conexão com banco..."
if npx prisma db push --skip-generate > /dev/null 2>&1; then
    echo "✅ Banco conectado com sucesso!"
    
    # Popular dados iniciais
    echo "🌱 Populando dados iniciais..."
    npm run db:seed
    
    # Executar testes
    echo "🧪 Executando testes..."
    npm run test:run
else
    echo "❌ Erro ao conectar com banco!"
    echo "💡 Verifique se:"
    echo "   1. PostgreSQL está rodando"
    echo "   2. Credenciais no .env estão corretas"
    echo "   3. Banco 'easy_hotel_users' existe"
    echo ""
    echo "🔧 Para criar o banco:"
    echo "   createdb easy_hotel_users"
fi

echo "✅ Setup concluído!" 