#!/bin/bash

echo "🔍 Verificando Segurança do Repositório"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ISSUES=0
WARNINGS=0

echo -e "${BLUE}🔍 Verificando secrets expostos...${NC}"

# 1. Verificar se há secrets hardcoded no app-secrets.yaml
if grep -q "cG9zdGdyZXM=" k8s/secrets/app-secrets.yaml 2>/dev/null; then
    echo -e "${RED}❌ SECRETS HARDCODED: k8s/secrets/app-secrets.yaml contém valores hardcoded${NC}"
    echo "   Execute: ./scripts/generate-secrets.sh para gerar secrets seguros"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ k8s/secrets/app-secrets.yaml está usando placeholders${NC}"
fi

# 2. Verificar se há arquivos .env com secrets
if [ -f ".env" ]; then
    if grep -q "password\|secret\|key" .env; then
        echo -e "${YELLOW}⚠️  AVISO: .env contém possíveis secrets${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ .env não contém secrets óbvios${NC}"
    fi
else
    echo -e "${GREEN}✅ .env não existe${NC}"
fi

# 3. Verificar se há .env.local (deve estar no .gitignore)
if [ -f ".env.local" ]; then
    if git check-ignore .env.local >/dev/null 2>&1; then
        echo -e "${GREEN}✅ .env.local está no .gitignore${NC}"
    else
        echo -e "${RED}❌ CRÍTICO: .env.local não está no .gitignore${NC}"
        echo "   Adicione .env.local ao .gitignore imediatamente!"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${BLUE}ℹ️  .env.local não existe (normal se não foi gerado)${NC}"
fi

# 4. Verificar se há secrets no histórico do Git
echo -e "${BLUE}🔍 Verificando histórico do Git...${NC}"

# Verificar por padrões de secrets no histórico
SECRETS_IN_HISTORY=$(git log --all --full-history --pretty=format: --name-only | grep -E "\.(env|secret|key|pem|crt)$" | sort | uniq)

if [ -n "$SECRETS_IN_HISTORY" ]; then
    echo -e "${RED}❌ CRÍTICO: Possíveis arquivos de secrets no histórico do Git:${NC}"
    echo "$SECRETS_IN_HISTORY" | while read -r file; do
        echo "   - $file"
    done
    echo "   Considere usar git filter-branch ou BFG para remover"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ Nenhum arquivo de secret óbvio no histórico${NC}"
fi

# 5. Verificar por strings que parecem secrets
echo -e "${BLUE}🔍 Verificando por strings suspeitas...${NC}"

# Padrões comuns de secrets
PATTERNS=(
    "password.*=.*[a-zA-Z0-9]"
    "secret.*=.*[a-zA-Z0-9]"
    "key.*=.*[a-zA-Z0-9]"
    "token.*=.*[a-zA-Z0-9]"
    "sk_test_"
    "sk_live_"
    "pk_test_"
    "pk_live_"
)

for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(grep -r --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build "$pattern" . 2>/dev/null | grep -v "example\|test\|mock" || true)
    
    if [ -n "$MATCHES" ]; then
        echo -e "${YELLOW}⚠️  Possíveis secrets encontrados com padrão '$pattern':${NC}"
        echo "$MATCHES" | head -5 | while read -r line; do
            echo "   - $line"
        done
        if [ "$(echo "$MATCHES" | wc -l)" -gt 5 ]; then
            echo "   ... e mais $(($(echo "$MATCHES" | wc -l) - 5)) linhas"
        fi
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 6. Verificar se .gitignore está configurado corretamente
echo -e "${BLUE}🔍 Verificando .gitignore...${NC}"

REQUIRED_IGNORES=(
    ".env.local"
    "*.local"
    "secrets/"
    "*.secret"
    "*.key"
)

for ignore in "${REQUIRED_IGNORES[@]}"; do
    if grep -q "$ignore" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ .gitignore contém: $ignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .gitignore não contém: $ignore${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 7. Verificar se há arquivos sensíveis no repositório
echo -e "${BLUE}🔍 Verificando arquivos sensíveis...${NC}"

SENSITIVE_FILES=$(find . -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "*.p12" -o -name "*.pfx" -o -name "*.secret" 2>/dev/null | grep -v .git)

# Filtrar arquivos que estão no .gitignore (são aceitáveis)
IGNORED_SENSITIVE_FILES=""
NON_IGNORED_SENSITIVE_FILES=""

if [ -n "$SENSITIVE_FILES" ]; then
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            # Verificar se está no .gitignore (se estivermos em um repo Git)
            if git rev-parse --git-dir >/dev/null 2>&1 && git check-ignore "$file" >/dev/null 2>&1; then
                IGNORED_SENSITIVE_FILES="$IGNORED_SENSITIVE_FILES$file"$'\n'
            # Se não estamos em um repo Git, verificar se o arquivo está listado no .gitignore
            elif [ -f ".gitignore" ] && grep -q "$(basename "$file")" .gitignore; then
                IGNORED_SENSITIVE_FILES="$IGNORED_SENSITIVE_FILES$file"$'\n'
            else
                NON_IGNORED_SENSITIVE_FILES="$NON_IGNORED_SENSITIVE_FILES$file"$'\n'
            fi
        fi
    done <<< "$SENSITIVE_FILES"
fi

if [ -n "$NON_IGNORED_SENSITIVE_FILES" ]; then
    echo -e "${RED}❌ CRÍTICO: Arquivos sensíveis não ignorados encontrados:${NC}"
    echo "$NON_IGNORED_SENSITIVE_FILES" | while read -r file; do
        if [ -n "$file" ]; then
            echo "   - $file"
        fi
    done
    echo "   Remova estes arquivos ou adicione ao .gitignore"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ Nenhum arquivo sensível não ignorado encontrado${NC}"
fi

if [ -n "$IGNORED_SENSITIVE_FILES" ]; then
    echo -e "${BLUE}ℹ️  Arquivos sensíveis ignorados (aceitáveis):${NC}"
    echo "$IGNORED_SENSITIVE_FILES" | while read -r file; do
        if [ -n "$file" ]; then
            echo "   - $file (ignorado pelo .gitignore)"
        fi
    done
fi

# Resumo
echo ""
echo -e "${BLUE}📊 Resumo da Verificação de Segurança:${NC}"

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Excelente! Nenhum problema de segurança encontrado${NC}"
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avisos encontrados (não críticos)${NC}"
else
    echo -e "${RED}❌ $ISSUES problemas críticos encontrados${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avisos adicionais${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔧 Ações Recomendadas:${NC}"

if [ $ISSUES -gt 0 ]; then
    echo "  1. Execute: ./scripts/generate-secrets.sh"
    echo "  2. Remova arquivos sensíveis do repositório"
    echo "  3. Atualize .gitignore se necessário"
    echo "  4. Considere usar git filter-branch para limpar histórico"
fi

echo "  5. Para produção, configure um gerenciador de secrets"
echo "  6. Execute este script regularmente: ./scripts/security-check.sh"

echo ""
echo -e "${BLUE}📚 Recursos de Segurança:${NC}"
echo "  • HashiCorp Vault: https://www.vaultproject.io/"
echo "  • AWS Secrets Manager: https://aws.amazon.com/secrets-manager/"
echo "  • External Secrets Operator: https://external-secrets.io/"
echo "  • GitGuardian: https://www.gitguardian.com/"

exit $ISSUES 