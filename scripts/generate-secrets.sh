#!/bin/bash

echo "🔐 Gerando Secrets Seguros para Easy Hotel"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl não está instalado!${NC}"
    exit 1
fi

# Verificar se o namespace existe
if ! kubectl get namespace easy-hotel &> /dev/null; then
    echo -e "${RED}❌ Namespace 'easy-hotel' não existe!${NC}"
    echo "Execute primeiro: skaffold dev"
    exit 1
fi

# Função para gerar string aleatória
generate_random_string() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Função para gerar JWT secret
generate_jwt_secret() {
    openssl rand -base64 32
}

# Função para codificar em base64
encode_base64() {
    echo -n "$1" | base64
}

echo -e "${BLUE}🔧 Gerando secrets seguros...${NC}"

# Gerar secrets
POSTGRES_PASSWORD=$(generate_random_string 16)
JWT_SECRET=$(generate_jwt_secret)
RESERVATIONS_API_KEY=$(generate_random_string 32)
PAYMENTS_API_KEY=$(generate_random_string 32)
NOTIFICATIONS_API_KEY=$(generate_random_string 32)
ROOMS_API_KEY=$(generate_random_string 32)

# Secrets para desenvolvimento (valores padrão seguros)
STRIPE_SECRET_KEY="sk_test_$(generate_random_string 24)"
TWILIO_ACCOUNT_SID="AC$(generate_random_string 32)"
TWILIO_AUTH_TOKEN=$(generate_random_string 32)
SMTP_USERNAME="dev@easyhotel.local"
SMTP_PASSWORD=$(generate_random_string 16)

echo -e "${GREEN}✅ Secrets gerados com sucesso${NC}"

# Criar arquivo temporário com secrets
TEMP_SECRETS_FILE=$(mktemp)

cat > "$TEMP_SECRETS_FILE" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: easy-hotel
type: Opaque
data:
  # Database
  POSTGRES_PASSWORD: $(encode_base64 "$POSTGRES_PASSWORD")
  
  # JWT
  JWT_SECRET: $(encode_base64 "$JWT_SECRET")
  
  # Service-to-Service API Keys
  RESERVATIONS_API_KEY: $(encode_base64 "$RESERVATIONS_API_KEY")
  PAYMENTS_API_KEY: $(encode_base64 "$PAYMENTS_API_KEY")
  NOTIFICATIONS_API_KEY: $(encode_base64 "$NOTIFICATIONS_API_KEY")
  ROOMS_API_KEY: $(encode_base64 "$ROOMS_API_KEY")
  
  # External Services
  STRIPE_SECRET_KEY: $(encode_base64 "$STRIPE_SECRET_KEY")
  TWILIO_ACCOUNT_SID: $(encode_base64 "$TWILIO_ACCOUNT_SID")
  TWILIO_AUTH_TOKEN: $(encode_base64 "$TWILIO_AUTH_TOKEN")
  
  # Email
  SMTP_USERNAME: $(encode_base64 "$SMTP_USERNAME")
  SMTP_PASSWORD: $(encode_base64 "$SMTP_PASSWORD")
EOF

# Aplicar secrets no Kubernetes
echo -e "${BLUE}🚀 Aplicando secrets no Kubernetes...${NC}"

kubectl apply -f "$TEMP_SECRETS_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secrets aplicados com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar secrets${NC}"
    rm -f "$TEMP_SECRETS_FILE"
    exit 1
fi

# Limpar arquivo temporário
rm -f "$TEMP_SECRETS_FILE"

# Criar arquivo .env.local com secrets para desenvolvimento local
echo -e "${BLUE}📝 Criando arquivo .env.local para desenvolvimento...${NC}"

cat > .env.local << EOF
# Secrets gerados automaticamente - NÃO COMMITAR ESTE ARQUIVO!
# Adicione .env.local ao .gitignore

# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Service-to-Service API Keys
RESERVATIONS_API_KEY=$RESERVATIONS_API_KEY
PAYMENTS_API_KEY=$PAYMENTS_API_KEY
NOTIFICATIONS_API_KEY=$NOTIFICATIONS_API_KEY
ROOMS_API_KEY=$ROOMS_API_KEY

# External Services
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN

# Email
SMTP_USERNAME=$SMTP_USERNAME
SMTP_PASSWORD=$SMTP_PASSWORD
EOF

echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"

# Verificar se .gitignore contém .env.local
if ! grep -q "\.env\.local" .gitignore 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Adicionando .env.local ao .gitignore...${NC}"
    echo "" >> .gitignore
    echo "# Local secrets (gerados automaticamente)" >> .gitignore
    echo ".env.local" >> .gitignore
    echo "*.local" >> .gitignore
fi

# Mostrar resumo
echo ""
echo -e "${GREEN}🎉 Secrets configurados com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Resumo dos secrets gerados:${NC}"
echo "  🔐 JWT Secret: ${JWT_SECRET:0:20}..."
echo "  🗄️  Postgres Password: ${POSTGRES_PASSWORD:0:10}..."
echo "  🔑 Reservations API Key: ${RESERVATIONS_API_KEY:0:20}..."
echo "  💳 Payments API Key: ${PAYMENTS_API_KEY:0:20}..."
echo "  📧 Notifications API Key: ${NOTIFICATIONS_API_KEY:0:20}..."
echo "  🏨 Rooms API Key: ${ROOMS_API_KEY:0:20}..."
echo ""
echo -e "${BLUE}📁 Arquivos criados:${NC}"
echo "  ✅ Kubernetes Secret: app-secrets"
echo "  ✅ Local development: .env.local"
echo "  ✅ Gitignore atualizado"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  • O arquivo .env.local contém secrets reais - NÃO COMMITAR!"
echo "  • Para produção, use um gerenciador de secrets (HashiCorp Vault, AWS Secrets Manager, etc.)"
echo "  • Rotacione os secrets regularmente"
echo ""
echo -e "${BLUE}🔧 Próximos passos:${NC}"
echo "  1. Reiniciar os pods para carregar os novos secrets:"
echo "     kubectl rollout restart deployment -n easy-hotel"
echo "  2. Testar a autenticação: ./scripts/test-auth.sh"
echo "  3. Para produção, configure um gerenciador de secrets" 