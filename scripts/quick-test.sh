#!/bin/bash

echo "🚀 Teste Rápido do Easy Hotel"
echo "============================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando se o projeto está rodando...${NC}"

# Verificar se o namespace existe
if ! kubectl get namespace easy-hotel &> /dev/null; then
    echo -e "${RED}❌ Namespace 'easy-hotel' não existe!${NC}"
    echo "Execute primeiro: ./scripts/skaffold-dev.sh"
    exit 1
fi

# Verificar se os pods estão rodando
echo -e "${BLUE}📊 Verificando status dos pods...${NC}"
kubectl get pods -n easy-hotel

# Verificar se os serviços estão disponíveis
echo -e "${BLUE}🌐 Verificando serviços...${NC}"
kubectl get services -n easy-hotel

# Testar Kong
echo -e "${BLUE}🔍 Testando Kong API Gateway...${NC}"
kubectl port-forward -n easy-hotel svc/kong-service 3000:8001 > /dev/null 2>&1 &
KONG_PF_PID=$!

sleep 3

if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kong está funcionando${NC}"
else
    echo -e "${RED}❌ Kong não está respondendo${NC}"
fi

kill $KONG_PF_PID 2>/dev/null

# Testar serviços individuais
echo -e "${BLUE}🔍 Testando serviços individuais...${NC}"

# Reservations Service
kubectl port-forward -n easy-hotel svc/reservations-service 3001:3001 > /dev/null 2>&1 &
RESERVATIONS_PF_PID=$!

sleep 2

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Reservations Service está funcionando${NC}"
else
    echo -e "${RED}❌ Reservations Service não está respondendo${NC}"
fi

kill $RESERVATIONS_PF_PID 2>/dev/null

# Users Service
kubectl port-forward -n easy-hotel svc/users-service 3003:3003 > /dev/null 2>&1 &
USERS_PF_PID=$!

sleep 2

if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Users Service está funcionando${NC}"
else
    echo -e "${RED}❌ Users Service não está respondendo${NC}"
fi

kill $USERS_PF_PID 2>/dev/null

# Testar bancos de dados
echo -e "${BLUE}🗄️  Testando bancos de dados...${NC}"

# PostgreSQL
if kubectl exec -n easy-hotel deployment/postgres -- pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL está funcionando${NC}"
else
    echo -e "${RED}❌ PostgreSQL não está respondendo${NC}"
fi

# Redis
if kubectl exec -n easy-hotel deployment/redis -- redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis está funcionando${NC}"
else
    echo -e "${RED}❌ Redis não está respondendo${NC}"
fi

# MongoDB
if kubectl exec -n easy-hotel deployment/mongodb -- mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB está funcionando${NC}"
else
    echo -e "${RED}❌ MongoDB não está respondendo${NC}"
fi

# Testar Kafka
echo -e "${BLUE}📡 Testando Kafka...${NC}"
if kubectl get pods -n easy-hotel | grep -q "kafka.*Running"; then
    echo -e "${GREEN}✅ Kafka está rodando${NC}"
else
    echo -e "${RED}❌ Kafka não está rodando${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Teste rápido concluído!${NC}"
echo ""
echo -e "${BLUE}📋 Endpoints disponíveis:${NC}"
echo "  🌐 Kong API Gateway: http://localhost:3000"
echo "  📅 Reservations: http://localhost:3001"
echo "  👥 Users: http://localhost:3003"
echo "  💳 Payments: http://localhost:3004"
echo "  📧 Notifications: http://localhost:3005"
echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "  ./scripts/test-k8s.sh        # Teste completo"
echo "  ./scripts/test-events.sh      # Teste de eventos"
echo "  ./scripts/skaffold-clean.sh   # Limpeza"
echo "  kubectl logs -f deployment/kong -n easy-hotel  # Ver logs" 