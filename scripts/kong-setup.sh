#!/bin/bash

echo "🔧 Configurando Kong API Gateway"
echo "================================"

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
    echo "Execute primeiro: ./scripts/skaffold-dev.sh"
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

# Configurar serviços no Kong
echo -e "${BLUE}🔧 Configurando serviços no Kong...${NC}"

# Criar serviços
echo -e "${YELLOW}📝 Criando serviços...${NC}"

# Rooms Service
curl -s -X POST http://localhost:8000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rooms-service",
    "url": "http://rooms-service:3002"
  }' > /dev/null

# Reservations Service
curl -s -X POST http://localhost:8000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "reservations-service",
    "url": "http://reservations-service:3001"
  }' > /dev/null

# Users Service
curl -s -X POST http://localhost:8000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users-service",
    "url": "http://users-service:3003"
  }' > /dev/null

# Payments Service
curl -s -X POST http://localhost:8000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payments-service",
    "url": "http://payments-service:3004"
  }' > /dev/null

# Notifications Service
curl -s -X POST http://localhost:8000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "notifications-service",
    "url": "http://notifications-service:3005"
  }' > /dev/null

echo -e "${GREEN}✅ Serviços criados${NC}"

# Criar rotas
echo -e "${YELLOW}🛣️  Criando rotas...${NC}"

# Rooms routes
curl -s -X POST http://localhost:8000/services/rooms-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rooms-routes",
    "paths": ["/api/rooms", "/api/rooms/"],
    "strip_path": true
  }' > /dev/null

# Reservations routes
curl -s -X POST http://localhost:8000/services/reservations-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "reservations-routes",
    "paths": ["/api/reservations", "/api/reservations/"],
    "strip_path": true
  }' > /dev/null

# Users routes
curl -s -X POST http://localhost:8000/services/users-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users-routes",
    "paths": ["/api/users", "/api/users/"],
    "strip_path": true
  }' > /dev/null

# Payments routes
curl -s -X POST http://localhost:8000/services/payments-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payments-routes",
    "paths": ["/api/payments", "/api/payments/"],
    "strip_path": true
  }' > /dev/null

# Notifications routes
curl -s -X POST http://localhost:8000/services/notifications-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "notifications-routes",
    "paths": ["/api/notifications", "/api/notifications/"],
    "strip_path": true
  }' > /dev/null

echo -e "${GREEN}✅ Rotas criadas${NC}"

# Configurar plugins básicos
echo -e "${YELLOW}🔌 Configurando plugins...${NC}"

# CORS para todos os serviços
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

echo -e "${GREEN}✅ Plugins configurados${NC}"

# Limpar port forward
kill $KONG_PF_PID 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Kong configurado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Endpoints disponíveis:${NC}"
echo "  🌐 Kong API Gateway: http://localhost:3000"
echo "  📚 Kong Admin API: http://localhost:8000"
echo "  🏨 Rooms API: http://localhost:3000/api/rooms"
echo "  📅 Reservations API: http://localhost:3000/api/reservations"
echo "  👥 Users API: http://localhost:3000/api/users"
echo "  💳 Payments API: http://localhost:3000/api/payments"
echo "  📧 Notifications API: http://localhost:3000/api/notifications"
echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "  kubectl logs -f deployment/kong -n easy-hotel     # Ver logs do Kong"
echo "  kubectl port-forward svc/kong-service 3000:8001 -n easy-hotel  # Port forward"
echo "  kubectl port-forward svc/kong-service 8000:8000 -n easy-hotel  # Admin API" 