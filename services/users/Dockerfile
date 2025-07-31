# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Gerar Prisma Client
RUN npx prisma generate

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para o Prisma
RUN apk add --no-cache openssl

# Instalar dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar arquivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copiar e tornar executável o script de inicialização
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Expor porta
EXPOSE 3003

# Usar o script de inicialização
ENTRYPOINT ["./start.sh"]
CMD ["npm", "run", "start:with-migrate"] 