#!/bin/bash

echo "🎯 Testando Arquitetura Baseada em Eventos"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Kafka está rodando
echo -e "${BLUE}🔍 Verificando Kafka...${NC}"
if kubectl get pods -n easy-hotel | grep -q "kafka.*Running"; then
    echo -e "${GREEN}✅ Kafka está rodando${NC}"
else
    echo -e "${RED}❌ Kafka não está rodando${NC}"
    exit 1
fi

# Verificar se Zookeeper está rodando
echo -e "${BLUE}🔍 Verificando Zookeeper...${NC}"
if kubectl get pods -n easy-hotel | grep -q "zookeeper.*Running"; then
    echo -e "${GREEN}✅ Zookeeper está rodando${NC}"
else
    echo -e "${RED}❌ Zookeeper não está rodando${NC}"
    exit 1
fi

# Port forward para Kafka
echo -e "${BLUE}🔌 Configurando port forward para Kafka...${NC}"
kubectl port-forward -n easy-hotel svc/kafka-service 9092:9092 > /dev/null 2>&1 &
KAFKA_PF_PID=$!

# Aguardar Kafka ficar disponível
sleep 5

# Testar conexão com Kafka
echo -e "${BLUE}🧪 Testando conexão com Kafka...${NC}"
if nc -z localhost 9092 2>/dev/null; then
    echo -e "${GREEN}✅ Kafka acessível na porta 9092${NC}"
else
    echo -e "${RED}❌ Kafka não está acessível${NC}"
    kill $KAFKA_PF_PID 2>/dev/null
    exit 1
fi

# Port forward para serviços
echo -e "${BLUE}🔌 Configurando port forward para serviços...${NC}"
kubectl port-forward -n easy-hotel svc/reservations-service 3001:3001 > /dev/null 2>&1 &
RESERVATIONS_PF_PID=$!

kubectl port-forward -n easy-hotel svc/notifications-service 3005:3005 > /dev/null 2>&1 &
NOTIFICATIONS_PF_PID=$!

sleep 3

# Testar criação de reserva (que deve disparar eventos)
echo -e "${BLUE}🧪 Testando criação de reserva...${NC}"
RESERVATION_RESPONSE=$(curl -s -X POST http://localhost:3001/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "guest_name": "João Silva",
    "guest_email": "joao@example.com",
    "guest_phone": "+5511999999999",
    "room_id": "room_101",
    "check_in_date": "2024-02-01T14:00:00Z",
    "check_out_date": "2024-02-03T12:00:00Z",
    "total_amount": 300.00
  }')

if echo "$RESERVATION_RESPONSE" | grep -q "res_"; then
    echo -e "${GREEN}✅ Reserva criada com sucesso${NC}"
    RESERVATION_ID=$(echo "$RESERVATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}📋 ID da Reserva: $RESERVATION_ID${NC}"
else
    echo -e "${RED}❌ Erro ao criar reserva${NC}"
    echo "$RESERVATION_RESPONSE"
fi

# Testar check-in
echo -e "${BLUE}🧪 Testando check-in...${NC}"
if [ ! -z "$RESERVATION_ID" ]; then
    CHECKIN_RESPONSE=$(curl -s -X POST http://localhost:3001/reservations/$RESERVATION_ID/check-in)
    if echo "$CHECKIN_RESPONSE" | grep -q "checked-in"; then
        echo -e "${GREEN}✅ Check-in realizado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro no check-in${NC}"
    fi
fi

# Testar check-out
echo -e "${BLUE}🧪 Testando check-out...${NC}"
if [ ! -z "$RESERVATION_ID" ]; then
    CHECKOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/reservations/$RESERVATION_ID/check-out)
    if echo "$CHECKOUT_RESPONSE" | grep -q "checked-out"; then
        echo -e "${GREEN}✅ Check-out realizado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro no check-out${NC}"
    fi
fi

# Verificar logs dos serviços
echo -e "${BLUE}📋 Verificando logs dos serviços...${NC}"
echo -e "${YELLOW}📊 Logs do Reservations Service:${NC}"
kubectl logs -n easy-hotel deployment/reservations --tail=10 | grep -E "(Evento publicado|✅|❌)" || echo "Nenhum log de evento encontrado"

echo -e "${YELLOW}📊 Logs do Notifications Service:${NC}"
kubectl logs -n easy-hotel deployment/notifications --tail=10 | grep -E "(Evento recebido|✅|❌)" || echo "Nenhum log de evento encontrado"

# Limpar port forwards
echo -e "${BLUE}🧹 Limpando port forwards...${NC}"
kill $KAFKA_PF_PID $RESERVATIONS_PF_PID $NOTIFICATIONS_PF_PID 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Teste de eventos concluído!${NC}"
echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "  kubectl logs -f deployment/reservations -n easy-hotel    # Ver logs do Reservations"
echo "  kubectl logs -f deployment/notifications -n easy-hotel   # Ver logs do Notifications"
echo "  kubectl logs -f deployment/kafka -n easy-hotel           # Ver logs do Kafka"
echo "  kubectl port-forward svc/kafka-service 9092:9092 -n easy-hotel  # Port forward Kafka" 