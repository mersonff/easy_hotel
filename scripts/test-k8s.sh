#!/bin/bash

echo "🧪 Testando Easy Hotel no Kubernetes"
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar um serviço
test_service() {
    local name=$1
    local port=$2
    local path=$3
    
    echo -n "🔍 Testando $name (porta $port)... "
    
    # Port forward temporário
    kubectl port-forward svc/${name}-service $port:$port -n easy-hotel --address=0.0.0.0 > /dev/null 2>&1 &
    PF_PID=$!
    
    # Aguardar um pouco para o port forward
    sleep 3
    
    # Testar o serviço
    if curl -s --connect-timeout 5 "http://localhost:$port$path" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        result=0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        result=1
    fi
    
    # Matar o port forward
    kill $PF_PID 2>/dev/null
    wait $PF_PID 2>/dev/null
    
    return $result
}

echo ""
echo "📡 Testando conectividade dos serviços:"

# Testar serviços
test_service "kong" "3000" "/"
test_service "rooms" "3002" "/health"
test_service "reservations" "3001" "/health"
test_service "users" "3003" "/health"
test_service "payments" "3004" "/health"
test_service "notifications" "3005" "/health"

echo ""
echo "🗄️  Testando bancos de dados:"

# Testar PostgreSQL
echo -n "🔍 Testando PostgreSQL... "
if kubectl exec -n easy-hotel deployment/postgres -- pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

# Testar Redis
echo -n "🔍 Testando Redis... "
if kubectl exec -n easy-hotel deployment/redis -- redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

# Testar MongoDB
echo -n "🔍 Testando MongoDB... "
if kubectl exec -n easy-hotel deployment/mongodb -- mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

echo ""
echo "📊 Status dos pods:"
kubectl get pods -n easy-hotel

echo ""
echo "🌐 Serviços disponíveis:"
kubectl get services -n easy-hotel

echo ""
echo "📋 Comandos úteis:"
echo "  kubectl get pods -n easy-hotel                    # Ver pods"
echo "  kubectl get services -n easy-hotel                # Ver serviços"
echo "  kubectl logs -f deployment/kong -n easy-hotel     # Ver logs do Kong"
echo "  kubectl logs -f deployment/rooms -n easy-hotel    # Ver logs do Rooms"
echo "  kubectl logs -f deployment/reservations -n easy-hotel  # Ver logs do Reservations"
echo "  kubectl logs -f deployment/users -n easy-hotel    # Ver logs do Users"
echo "  kubectl logs -f deployment/payments -n easy-hotel # Ver logs do Payments"
echo "  kubectl logs -f deployment/notifications -n easy-hotel  # Ver logs do Notifications"
echo "  kubectl port-forward svc/kong-service 3000:8001 -n easy-hotel  # Port forward"
echo "  kubectl scale deployment/kong --replicas=3 -n easy-hotel  # Escalar" 