#!/bin/bash

echo "🔄 Testando Persistência de Secrets"
echo "=================================="

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

echo -e "${BLUE}🔍 Verificando secrets atuais...${NC}"

# Capturar secrets atuais
CURRENT_RESERVATIONS_KEY=$(kubectl get secret app-secrets -n easy-hotel -o jsonpath='{.data.RESERVATIONS_API_KEY}' 2>/dev/null | base64 -d)
CURRENT_JWT_SECRET=$(kubectl get secret app-secrets -n easy-hotel -o jsonpath='{.data.JWT_SECRET}' 2>/dev/null | base64 -d)

if [ -n "$CURRENT_RESERVATIONS_KEY" ]; then
    echo -e "${GREEN}✅ Secrets encontrados:${NC}"
    echo "  🔑 Reservations API Key: ${CURRENT_RESERVATIONS_KEY:0:20}..."
    echo "  🔐 JWT Secret: ${CURRENT_JWT_SECRET:0:20}..."
else
    echo -e "${YELLOW}⚠️  Nenhum secret encontrado${NC}"
    echo "Execute primeiro: ./scripts/generate-secrets.sh"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Comportamento ao parar/reiniciar:${NC}"
echo ""
echo -e "${GREEN}✅ O que PERMANECE:${NC}"
echo "  • Secrets no Kubernetes (app-secrets)"
echo "  • ConfigMaps"
echo "  • Persistent Volumes"
echo "  • Namespace easy-hotel"
echo ""
echo -e "${RED}❌ O que é REMOVIDO:${NC}"
echo "  • Pods dos serviços"
echo "  • Deployments"
echo "  • Services"
echo "  • Ingress"
echo ""
echo -e "${YELLOW}⚠️  O que PRECISA FAZER:${NC}"
echo "  • Reiniciar pods para carregar secrets"
echo "  • Verificar se serviços estão funcionando"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo ""
echo "1. Parar projeto:"
echo "   skaffold delete"
echo ""
echo "2. Reiniciar projeto:"
echo "   skaffold dev"
echo ""
echo "3. Verificar se secrets persistiram:"
echo "   kubectl get secret app-secrets -n easy-hotel"
echo ""
echo "4. Reiniciar pods para carregar secrets:"
echo "   kubectl rollout restart deployment -n easy-hotel"
echo ""
echo "5. Verificar se serviços estão funcionando:"
echo "   kubectl get pods -n easy-hotel"
echo ""
echo -e "${BLUE}🧪 Teste prático:${NC}"
echo ""
echo "Para testar se os secrets persistem:"
echo "1. Anote o valor atual: ${CURRENT_RESERVATIONS_KEY:0:20}..."
echo "2. Execute: skaffold delete"
echo "3. Execute: skaffold dev"
echo "4. Verifique se o valor é o mesmo"
echo ""
echo -e "${YELLOW}💡 Dica:${NC}"
echo "Se quiser secrets diferentes, execute:"
echo "   ./scripts/generate-secrets.sh"
echo "   kubectl rollout restart deployment -n easy-hotel" 