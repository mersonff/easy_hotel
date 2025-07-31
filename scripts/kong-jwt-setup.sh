#!/bin/bash

echo "🔐 Configurando Autenticação JWT no Kong API Gateway"
echo "=================================================="

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

# Aguardar Kong estar pronto
echo -e "${BLUE}⏳ Aguardando Kong estar pronto...${NC}"
kubectl wait --for=condition=ready pod -l app=kong -n easy-hotel --timeout=300s

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Kong não ficou pronto no tempo esperado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kong está pronto${NC}"

# Configurar port forward para Kong Admin API
echo -e "${BLUE}🔌 Configurando port forward para Kong Admin API...${NC}"
kubectl port-forward -n easy-hotel svc/kong-service 8000:8000 > /dev/null 2>&1 &
KONG_PF_PID=$!

# Aguardar um pouco para o port forward
sleep 3

# Obter JWT secret do Kubernetes
JWT_SECRET=$(kubectl get secret app-secrets -n easy-hotel -o jsonpath='{.data.JWT_SECRET}' | base64 -d)

if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET não encontrado no Kubernetes${NC}"
    kill $KONG_PF_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ JWT Secret obtido${NC}"

# Configurar JWT Plugin para serviços protegidos
echo -e "${YELLOW}🔐 Configurando JWT Plugin...${NC}"

# Serviços que precisam de autenticação
PROTECTED_SERVICES=("reservations-service" "payments-service" "notifications-service")

for service in "${PROTECTED_SERVICES[@]}"; do
    echo -e "${BLUE}🔧 Configurando JWT para $service...${NC}"
    
    # Criar JWT plugin
    curl -s -X POST http://localhost:8000/services/$service/plugins \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"jwt\",
        \"config\": {
          \"secret\": \"$JWT_SECRET\",
          \"key_claim_name\": \"id\",
          \"algorithm\": \"HS256\",
          \"claims_to_verify\": [\"exp\"]
        }
      }" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ JWT configurado para $service${NC}"
    else
        echo -e "${RED}❌ Erro ao configurar JWT para $service${NC}"
    fi
done

# Configurar Rate Limiting para endpoints de autenticação
echo -e "${YELLOW}🚦 Configurando Rate Limiting...${NC}"

# Rate limiting para login
curl -s -X POST http://localhost:8000/services/users-service/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rate-limiting",
    "config": {
      "minute": 10,
      "hour": 100,
      "policy": "local"
    }
  }' > /dev/null

echo -e "${GREEN}✅ Rate limiting configurado${NC}"

# Configurar CORS para todos os serviços
echo -e "${YELLOW}🌐 Configurando CORS...${NC}"

for service in rooms-service reservations-service users-service payments-service notifications-service; do
    curl -s -X POST http://localhost:8000/services/$service/plugins \
      -H "Content-Type: application/json" \
      -d '{
        "name": "cors",
        "config": {
          "origins": ["*"],
          "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          "headers": ["Content-Type", "Authorization"],
          "exposed_headers": ["X-Total-Count"],
          "credentials": true,
          "max_age": 3600
        }
      }' > /dev/null
done

echo -e "${GREEN}✅ CORS configurado${NC}"

# Limpar port forward
kill $KONG_PF_PID 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Autenticação JWT configurada com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Endpoints protegidos:${NC}"
echo "  📅 Reservations: http://localhost:3000/api/reservations"
echo "  💳 Payments: http://localhost:3000/api/payments"
echo "  📧 Notifications: http://localhost:3000/api/notifications"
echo ""
echo -e "${BLUE}📋 Endpoints públicos:${NC}"
echo "  👥 Users (login/register): http://localhost:3000/api/users"
echo "  🏨 Rooms: http://localhost:3000/api/rooms"
echo ""
echo -e "${BLUE}🔑 Como usar:${NC}"
echo "  1. Faça login: POST /api/users/auth/login"
echo "  2. Use o token retornado no header: Authorization: Bearer <token>"
echo "  3. Acesse endpoints protegidos"
echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "  kubectl logs -f deployment/kong -n easy-hotel     # Ver logs do Kong"
echo "  kubectl port-forward svc/kong-service 3000:8001 -n easy-hotel  # Port forward"
echo "  kubectl port-forward svc/kong-service 8000:8000 -n easy-hotel  # Admin API" 