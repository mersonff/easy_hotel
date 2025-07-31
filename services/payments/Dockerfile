FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar go.mod
COPY go.mod ./

# Baixar dependências
RUN go mod download

# Copiar código fonte
COPY . .

# Compilar a aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Imagem final
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copiar o binário compilado
COPY --from=builder /app/main .

# Expor porta
EXPOSE 3004

# Comando para executar a aplicação
CMD ["./main"] 