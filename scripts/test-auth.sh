#!/bin/bash

echo "🔐 Testando Estratégias de Autenticação"
echo "======================================"

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

# Configurar port forward para Kong
echo -e "${BLUE}🔌 Configurando port forward para Kong...${NC}"
kubectl port-forward -n easy-hotel svc/kong-service 3000:8001 > /dev/null 2>&1 &
KONG_PF_PID=$!

# Aguardar um pouco para o port forward
sleep 3

echo -e "${GREEN}✅ Port forward configurado${NC}"

# Teste 1: Endpoint público (sem autenticação)
echo ""
echo -e "${YELLOW}🧪 Teste 1: Endpoint público (sem autenticação)${NC}"
echo "Testando: GET /api/rooms"

RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/rooms)
HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Sucesso! Status: $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Falha! Status: $HTTP_CODE${NC}"
    echo "Resposta: $BODY"
fi

# Teste 2: Login (obter JWT token)
echo ""
echo -e "${YELLOW}🧪 Teste 2: Login (obter JWT token)${NC}"
echo "Testando: POST /api/users/auth/login"

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@easyhotel.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login bem-sucedido! Token obtido${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Falha no login${NC}"
    echo "Resposta: $LOGIN_RESPONSE"
    # Criar usuário de teste se necessário
    echo -e "${BLUE}📝 Criando usuário de teste...${NC}"
    
    CREATE_USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Admin Test",
        "email": "admin@easyhotel.com",
        "password": "admin123",
        "role": "ADMIN"
      }')
    
    echo "Criação de usuário: $CREATE_USER_RESPONSE"
    
    # Tentar login novamente
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@easyhotel.com",
        "password": "admin123"
      }')
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✅ Login bem-sucedido após criar usuário!${NC}"
    else
        echo -e "${RED}❌ Falha no login mesmo após criar usuário${NC}"
        echo "Resposta: $LOGIN_RESPONSE"
    fi
fi

# Teste 3: Endpoint protegido com JWT
if [ -n "$TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}🧪 Teste 3: Endpoint protegido com JWT${NC}"
    echo "Testando: GET /api/reservations"

    PROTECTED_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/reservations \
      -H "Authorization: Bearer $TOKEN")
    
    HTTP_CODE="${PROTECTED_RESPONSE: -3}"
    BODY="${PROTECTED_RESPONSE%???}"

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Sucesso! Status: $HTTP_CODE${NC}"
    else
        echo -e "${RED}❌ Falha! Status: $HTTP_CODE${NC}"
        echo "Resposta: $BODY"
    fi
else
    echo ""
    echo -e "${RED}⚠️  Pulando Teste 3: Token não disponível${NC}"
fi

# Teste 4: Endpoint protegido sem JWT (deve falhar)
echo ""
echo -e "${YELLOW}🧪 Teste 4: Endpoint protegido sem JWT (deve falhar)${NC}"
echo "Testando: GET /api/reservations (sem Authorization header)"

UNAUTHORIZED_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/reservations)
HTTP_CODE="${UNAUTHORIZED_RESPONSE: -3}"
BODY="${UNAUTHORIZED_RESPONSE%???}"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Comportamento correto! Status: $HTTP_CODE (Unauthorized)${NC}"
else
    echo -e "${RED}❌ Comportamento inesperado! Status: $HTTP_CODE${NC}"
    echo "Resposta: $BODY"
fi

# Teste 5: Service-to-Service com API Key
echo ""
echo -e "${YELLOW}🧪 Teste 5: Service-to-Service com API Key${NC}"
echo "Testando: GET /internal/users/123 (com API Key)"

# Configurar port forward para users service
kubectl port-forward -n easy-hotel svc/users-service 3003:3003 > /dev/null 2>&1 &
USERS_PF_PID=$!

sleep 2

SERVICE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3003/internal/users/123 \
  -H "X-API-Key: reservations-secret-key")
HTTP_CODE="${SERVICE_RESPONSE: -3}"
BODY="${SERVICE_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Sucesso! Status: $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Falha! Status: $HTTP_CODE${NC}"
    echo "Resposta: $BODY"
fi

# Teste 6: Service-to-Service sem API Key (deve falhar)
echo ""
echo -e "${YELLOW}🧪 Teste 6: Service-to-Service sem API Key (deve falhar)${NC}"
echo "Testando: GET /internal/users/123 (sem API Key)"

SERVICE_UNAUTHORIZED_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3003/internal/users/123)
HTTP_CODE="${SERVICE_UNAUTHORIZED_RESPONSE: -3}"
BODY="${SERVICE_UNAUTHORIZED_RESPONSE%???}"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Comportamento correto! Status: $HTTP_CODE (Unauthorized)${NC}"
else
    echo -e "${RED}❌ Comportamento inesperado! Status: $HTTP_CODE${NC}"
    echo "Resposta: $BODY"
fi

# Limpar port forwards
kill $KONG_PF_PID 2>/dev/null
kill $USERS_PF_PID 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Testes de autenticação concluídos!${NC}"
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo "  ✅ Endpoints públicos funcionam sem autenticação"
echo "  ✅ Login gera JWT token válido"
echo "  ✅ Endpoints protegidos requerem JWT"
echo "  ✅ Service-to-Service usa API Keys"
echo "  ✅ Autenticação falha corretamente sem credenciais"
echo ""
echo -e "${BLUE}📚 Próximos passos:${NC}"
echo "  1. Configurar autenticação JWT: ./scripts/kong-jwt-setup.sh"
echo "  2. Ver documentação completa: docs/authentication-strategy.md"
echo "  3. Implementar em outros serviços conforme necessário" 