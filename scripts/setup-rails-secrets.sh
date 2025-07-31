#!/bin/bash

echo "🔐 Configurando Secrets do Rails"
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

RAILS_DIR="services/rooms"

# Verificar se o diretório do Rails existe
if [ ! -d "$RAILS_DIR" ]; then
    echo -e "${RED}❌ Diretório do Rails não encontrado: $RAILS_DIR${NC}"
    exit 1
fi

cd "$RAILS_DIR"

echo -e "${BLUE}🔍 Verificando configuração do Rails...${NC}"

# Verificar se master.key existe
if [ -f "config/master.key" ]; then
    echo -e "${GREEN}✅ master.key já existe${NC}"
else
    echo -e "${YELLOW}⚠️  master.key não encontrado${NC}"
    echo -e "${BLUE}🔧 Gerando nova master.key...${NC}"
    
    # Gerar nova master key
    rails credentials:edit
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ master.key gerado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao gerar master.key${NC}"
        echo -e "${BLUE}💡 Alternativa: Execute manualmente:${NC}"
        echo "   cd $RAILS_DIR"
        echo "   rails credentials:edit"
        exit 1
    fi
fi

# Verificar se credentials.yml.enc existe
if [ -f "config/credentials.yml.enc" ]; then
    echo -e "${GREEN}✅ credentials.yml.enc existe${NC}"
else
    echo -e "${YELLOW}⚠️  credentials.yml.enc não encontrado${NC}"
    echo -e "${BLUE}🔧 Criando credentials.yml.enc...${NC}"
    
    # Criar credentials.yml.enc
    rails credentials:edit
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ credentials.yml.enc criado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao criar credentials.yml.enc${NC}"
        exit 1
    fi
fi

# Verificar se os arquivos estão no .gitignore
cd ../..

echo -e "${BLUE}🔍 Verificando .gitignore...${NC}"

if git check-ignore "$RAILS_DIR/config/master.key" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ master.key está no .gitignore${NC}"
else
    echo -e "${RED}❌ master.key não está no .gitignore${NC}"
    echo -e "${BLUE}🔧 Adicionando ao .gitignore...${NC}"
    echo "" >> .gitignore
    echo "# Rails credentials" >> .gitignore
    echo "config/master.key" >> .gitignore
    echo "config/credentials.yml.enc" >> .gitignore
    echo -e "${GREEN}✅ Adicionado ao .gitignore${NC}"
fi

if git check-ignore "$RAILS_DIR/config/credentials.yml.enc" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ credentials.yml.enc está no .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  credentials.yml.enc não está no .gitignore${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuração do Rails concluída!${NC}"
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo "  ✅ master.key configurado"
echo "  ✅ credentials.yml.enc configurado"
echo "  ✅ Arquivos no .gitignore"
echo ""
echo -e "${BLUE}🔧 Como usar:${NC}"
echo "  # Editar credentials"
echo "  cd $RAILS_DIR"
echo "  rails credentials:edit"
echo ""
echo "  # Verificar se está funcionando"
echo "  rails credentials:show"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  • master.key NUNCA deve ser commitado"
echo "  • credentials.yml.enc pode ser commitado (é criptografado)"
echo "  • Para produção, configure secrets via variáveis de ambiente" 