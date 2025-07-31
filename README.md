# Easy Hotel - Sistema de Gerenciamento de Hotel

Sistema de microserviços para gerenciamento completo de hotel, desenvolvido com Node.js, Go e Rails.

## 🏗️ Arquitetura

### Microserviços

| Serviço | Tecnologia | Porta | Descrição |
|---------|------------|-------|-----------|
| API Gateway | Kong | 3000 | Ponto de entrada único, roteamento e autenticação |
| Reservas | Go | 3001 | Gerenciamento de reservas e check-in/check-out |
| Quartos | Rails | 3002 | Gerenciamento de quartos e disponibilidade |
| Usuários | TypeScript | 3003 | Autenticação, perfis e permissões |
| Pagamentos | Go | 3004 | Processamento de pagamentos e transações |
| Notificações | TypeScript | 3005 | Emails, SMS e notificações push |

### Banco de Dados

- **PostgreSQL** - Dados principais (banco separado por serviço)
  - `easy_hotel_users` - Serviço de usuários
  - `easy_hotel_rooms` - Serviço de quartos
  - `easy_hotel_reservations` - Serviço de reservas
  - `easy_hotel_payments` - Serviço de pagamentos
- **Redis** - Cache e sessões
- **MongoDB** - Logs e analytics
- **Kafka** - Eventos e mensageria

## 🔒 **Segurança e Secrets**

### ⚠️ **IMPORTANTE: Secrets e Configurações**

**NUNCA commite secrets reais no repositório!**

1. **Arquivo de Secrets**: `k8s/secrets/app-secrets.yaml` está no `.gitignore`
2. **Use o exemplo**: Copie `k8s/secrets/app-secrets.example.yaml` para `app-secrets.yaml`
3. **Substitua os valores**: Use `echo -n "seu_valor" | base64` para gerar base64
4. **Desenvolvimento local**: Use apenas valores de teste/desenvolvimento

### **Configuração de Secrets:**

```bash
# 1. Copiar o arquivo de exemplo
cp k8s/secrets/app-secrets.example.yaml k8s/secrets/app-secrets.yaml

# 2. Editar com seus valores reais
nano k8s/secrets/app-secrets.yaml

# 3. Gerar valores base64
echo -n "minha_senha_super_secreta" | base64
```

### **Variáveis de Ambiente Sensíveis:**
- `MERCADOPAGO_ACCESS_TOKEN` - Token do MercadoPago
- `JWT_SECRET` - Chave JWT para autenticação
- `POSTGRES_PASSWORD` - Senha do banco de dados
- `STRIPE_SECRET_KEY` - Chave do Stripe (se usar)

---

## 🚀 **Como executar:**

### **Comandos Skaffold Básicos:**
```bash
# Iniciar desenvolvimento (recomendado)
skaffold dev

# Parar e limpar tudo
skaffold delete

# Deploy único (sem watch)
skaffold run

# Build apenas
skaffold build

# Aplicar manifests
skaffold apply
```

### **Scripts Úteis (Opcionais):**
```bash
# Configurar Kong API Gateway
./scripts/kong-setup.sh

# Configurar Autenticação JWT no Kong
./scripts/kong-jwt-setup.sh

# Teste rápido dos serviços
./scripts/quick-test.sh

# Teste de arquitetura de eventos
./scripts/test-events.sh

# Gerar secrets seguros
./scripts/generate-secrets.sh

# Verificar segurança do repositório
./scripts/security-check.sh

# Configurar secrets do Rails
./scripts/setup-rails-secrets.sh

# Aplicar autoscaling (HPA)
./scripts/apply-hpa.sh
```

### **Acessos:**
- 🌐 **Kong API Gateway**: http://localhost:3000
- 📚 **Kong Admin API**: http://localhost:8000
- 🏨 **Rooms Service**: http://localhost:3002
- 📅 **Reservations Service**: http://localhost:3001
- 👥 **Users Service**: http://localhost:3003
- 💳 **Payments Service**: http://localhost:3004
- 📧 **Notifications Service**: http://localhost:3005

### **Verificação rápida (se tudo está funcionando):**
```bash
# 1. Verificar se todos os pods estão Running
kubectl get pods -n easy-hotel

# 2. Testar health checks
curl http://localhost:3003/health  # Users
curl http://localhost:3002/health  # Rooms
curl http://localhost:3001/health  # Reservations

# 3. Verificar se bancos existem
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "\l" | grep easy_hotel
```

### **Quando usar cada abordagem:**

**🟢 Skaffold Nativo (Recomendado para maioria):**
- ✅ Simples e direto
- ✅ Menos complexidade
- ✅ Comandos padrão
- ✅ Menos manutenção

**🟡 Scripts Customizados (Para casos específicos):**
- 🔧 Configuração automática do Kong
- 🧪 Testes integrados
- 📊 Monitoramento avançado
- 🎯 Autoscaling configurado

## 📁 **Estrutura do Projeto**

```
easy-hotel/
├── services/
│   ├── rooms/              # Ruby on Rails - Gestão de quartos
│   ├── reservations/       # Go - Sistema de reservas
│   ├── users/             # TypeScript - Gestão de usuários
│   ├── payments/          # Go - Processamento de pagamentos
│   └── notifications/     # TypeScript - Notificações
├── k8s/
│   ├── services/          # Manifests dos serviços
│   ├── databases/         # MongoDB, Redis, PostgreSQL
│   ├── storage/           # Persistent Volumes
│   ├── configmaps/        # Configurações
│   ├── secrets/           # Secrets
│   └── autoscaling/       # HPA
├── scripts/               # Scripts de automação
├── monitoring/            # Prometheus, Grafana
└── docs/                 # Documentação
```

## 🗄️ **Arquitetura de Bancos de Dados**

### **Estratégia de Bancos por Serviço**

Cada microserviço tem seu próprio banco PostgreSQL para garantir:

- **🔒 Isolamento**: Dados não se misturam entre serviços
- **📈 Escalabilidade**: Cada serviço pode evoluir independentemente
- **🛠️ Manutenção**: Mais fácil de gerenciar e debugar
- **🚀 Performance**: Sem conflitos de tabelas

### **Bancos Configurados**

| Serviço | Banco | Tecnologia | Descrição |
|---------|-------|------------|-----------|
| Users | `easy_hotel_users` | PostgreSQL | Autenticação e perfis |
| Rooms | `easy_hotel_rooms` | PostgreSQL | Gestão de quartos |
| Reservations | `easy_hotel_reservations` | PostgreSQL | Reservas e check-in/out |
| Payments | `easy_hotel_payments` | PostgreSQL | Transações financeiras |
| Notifications | MongoDB | MongoDB | Logs e analytics |

## 🔧 **Pré-requisitos**

### **Ferramentas necessárias:**
- Docker
- kubectl
- Skaffold
- Cluster Kubernetes (Minikube, Docker Desktop, etc.)

### **Instalação das ferramentas:**

**Docker:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER

# macOS
brew install --cask docker

# Windows
# Baixar Docker Desktop do site oficial
```

**kubectl:**
```bash
# Ubuntu/Debian
sudo apt install kubectl

# macOS
brew install kubectl

# Windows
# Baixar do site oficial ou usar chocolatey
```

**Skaffold:**
```bash
# Linux/macOS
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/

# Windows
# Baixar do GitHub releases
```

**Cluster Kubernetes:**
```bash
# Minikube (recomendado para desenvolvimento)
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube /usr/local/bin/
minikube start

# Docker Desktop (Windows/macOS)
# Habilitar Kubernetes nas configurações
```

### **Verificar instalação:**
```bash
# Verificar Docker
docker --version

# Verificar kubectl
kubectl version

# Verificar Skaffold
skaffold version

# Verificar cluster
kubectl cluster-info
```

## 🔧 **Configuração**

### **Primeira execução (Setup inicial):**

```bash
# 1. Clone o repositório
git clone <repository-url>
cd easy-hotel

# 2. Configurar variáveis de ambiente (opcional - para desenvolvimento local)
cp env.example .env
# Editar .env se necessário

# 3. Verificar se o cluster está rodando
kubectl cluster-info

# 4. Iniciar todos os serviços (primeira vez pode demorar)
skaffold dev

# 5. Aguardar todos os pods ficarem Running
kubectl get pods -n easy-hotel

# 6. Verificar se os bancos foram criados
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "\l" | grep easy_hotel
```

### **Desenvolvimento com Skaffold**

O projeto usa Skaffold para desenvolvimento, com bancos de dados no Kubernetes:

```bash
# Iniciar todos os serviços
skaffold dev

# Verificar status
kubectl get pods -n easy-hotel

# Acessar serviços
kubectl port-forward -n easy-hotel svc/users-service 3003:3003
```

### **Bancos de Dados**

Cada serviço tem seu próprio banco PostgreSQL no K8s:
- **Users**: `easy_hotel_users`
- **Rooms**: `easy_hotel_rooms`
- **Reservations**: `easy_hotel_reservations`
- **Payments**: `easy_hotel_payments`

### **Variáveis de Ambiente**

#### **Para Desenvolvimento com Skaffold (K8s):**

As variáveis são configuradas automaticamente via ConfigMaps e Secrets no Kubernetes. Não é necessário configurar arquivos `.env` localmente.

#### **Para Desenvolvimento Local (sem K8s):**

1. **Copiar arquivo de exemplo:**
```bash
cp env.example .env
```

2. **Configurar variáveis principais:**
```bash
# Banco de Dados Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=easy_hotel_users
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Serviços (se rodando localmente)
RESERVATIONS_SERVICE_URL=http://localhost:3001
ROOMS_SERVICE_URL=http://localhost:3002
USERS_SERVICE_URL=http://localhost:3003
PAYMENTS_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3005
```

#### **Para Testes:**

Cada serviço tem seu próprio arquivo `.env.test`:
```bash
# services/users/.env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/easy_hotel_users_test?schema=public"
JWT_SECRET=test-jwt-secret
NODE_ENV=test
```

#### **Variáveis por Serviço:**

| Serviço | Banco | Variáveis Principais |
|---------|-------|---------------------|
| Users | `easy_hotel_users` | `DATABASE_URL`, `JWT_SECRET` |
| Rooms | `easy_hotel_rooms` | `DATABASE_URL`, `RAILS_ENV` |
| Reservations | `easy_hotel_reservations` | `DATABASE_URL`, `KAFKA_BROKERS` |
| Payments | `easy_hotel_payments` | `DATABASE_URL`, `STRIPE_SECRET_KEY` |
| Notifications | MongoDB | `MONGODB_URL`, `SMTP_*`, `TWILIO_*` |

#### **Desenvolvimento Individual de Serviços:**

**Users Service:**
```bash
cd services/users
cp env.example .env
# Editar .env com configurações locais
npm install
npm run dev
```

**Rooms Service:**
```bash
cd services/rooms
cp env.example .env
# Editar .env com configurações locais
bundle install
rails server
```

**Reservations Service:**
```bash
cd services/reservations
cp env.example .env
# Editar .env com configurações locais
go mod tidy
go run main.go
```

## 🔐 **Autenticação Entre Serviços**

### **Estratégias Implementadas:**

**1. JWT com Kong API Gateway (Recomendado)**
- Autenticação centralizada no gateway
- Proteção automática de endpoints
- Performance otimizada

**2. API Keys para Service-to-Service**
- Comunicação direta entre serviços
- Controle granular de permissões
- Middleware de autenticação implementado

**Como usar:**
```bash
# 1. Configurar autenticação JWT
./scripts/kong-jwt-setup.sh

# 2. Fazer login
curl -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 3. Usar token retornado
curl -X GET http://localhost:3000/api/reservations \
  -H "Authorization: Bearer <token>"
```

**Documentação completa:** [docs/authentication-strategy.md](docs/authentication-strategy.md)

## 🔐 **Gerenciamento de Secrets**

### **⚠️ Problema dos Secrets Hardcoded**

O arquivo `k8s/secrets/app-secrets.yaml` **NÃO deve conter secrets reais**. Os valores hardcoded são um risco de segurança.

### **✅ Solução Implementada:**

**1. Gerar Secrets Seguros:**
```bash
# Gerar secrets únicos e seguros
./scripts/generate-secrets.sh
```

**2. Verificar Segurança:**
```bash
# Verificar se há secrets expostos
./scripts/security-check.sh
```

**3. Para Produção:**
- Use HashiCorp Vault, AWS Secrets Manager, ou similar
- Configure External Secrets Operator
- Rotacione secrets regularmente

### **📁 Arquivos de Secrets:**

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `k8s/secrets/app-secrets.yaml` | Template com placeholders | ✅ Seguro |
| `k8s/secrets/production-secrets.example.yaml` | Exemplo para produção | ✅ Seguro |
| `.env.local` | Secrets locais (não commitado) | ✅ Seguro |
| `services/rooms/config/master.key` | Chave mestra do Rails (local) | ✅ Seguro |
| `services/rooms/config/credentials.yml.enc` | Credenciais criptografadas | ✅ Seguro |

### **🔧 Como Funciona:**

1. **Desenvolvimento**: `./scripts/generate-secrets.sh` cria secrets únicos
2. **Local**: Secrets ficam em `.env.local` (não commitado)
3. **Kubernetes**: Secrets são aplicados via kubectl
4. **Produção**: Use gerenciador de secrets externo

## 📚 **Documentação da API**

### **Endpoints principais:**

**Reservations Service:**
- `GET /health` - Health check
- `POST /reservations` - Criar reserva
- `GET /reservations` - Listar reservas
- `POST /reservations/{id}/check-in` - Check-in
- `POST /reservations/{id}/check-out` - Check-out

**Users Service:**
- `GET /health` - Health check
- `POST /users` - Criar usuário
- `GET /users` - Listar usuários
- `POST /auth/login` - Login

**Rooms Service:**
- `GET /health` - Health check
- `GET /rooms` - Listar quartos
- `POST /rooms` - Criar quarto
- `GET /rooms/{id}` - Detalhes do quarto

### **Exemplos de uso:**

**1. Health checks (testar se serviços estão funcionando):**
```bash
# Users service
curl http://localhost:3003/health

# Rooms service  
curl http://localhost:3002/health

# Reservations service
curl http://localhost:3001/health
```

**2. Criar usuário:**
```bash
curl -X POST http://localhost:3003/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "123456",
    "role": "GUEST"
  }'
```

**3. Login:**
```bash
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "123456"
  }'
```

**4. Criar reserva:**
```bash
curl -X POST http://localhost:3001/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "guest_name": "João Silva",
    "guest_email": "joao@example.com",
    "room_id": "room_101",
    "check_in_date": "2024-02-01T14:00:00Z",
    "check_out_date": "2024-02-03T12:00:00Z",
    "total_amount": 300.00
  }'
```

**5. Listar quartos:**
```bash
curl -X GET http://localhost:3002/rooms
```

## 🧪 **Testes**

### **Configuração de Testes**

Cada serviço tem configuração de testes isolada:

```bash
# Configurar banco de teste (Users service)
cd services/users
./setup-test-db.sh

# Executar testes
npm test                    # Watch mode
npm run test:run           # Uma vez
npm run test:coverage      # Com cobertura
```

### **Testes rápidos:**
```bash
# Teste geral dos serviços
./scripts/quick-test.sh

# Teste de eventos
./scripts/test-events.sh

# Teste de Kubernetes
./scripts/test-k8s.sh
```

### **Testes manuais:**
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Criar reserva
curl -X POST http://localhost:3001/reservations \
  -H "Content-Type: application/json" \
  -d '{"guest_name":"João","room_id":"room_101"}'
```

### **Banco de Teste**

- **Isolado**: Cada serviço usa banco de teste separado
- **Automático**: Prisma cria banco automaticamente
- **Limpo**: Dados são limpos entre testes

## 📊 **Monitoramento**

### **Logs:**
```bash
# Ver logs de um serviço
kubectl logs -f deployment/reservations -n easy-hotel

# Ver logs de todos os pods
kubectl logs -f --all-containers=true -l app=reservations -n easy-hotel
```

### **Métricas:**
```bash
# Ver uso de recursos
kubectl top pods -n easy-hotel

# Ver HPA
kubectl get hpa -n easy-hotel
```

### **Prometheus/Grafana:**
```bash
# Configuração disponível em monitoring/prometheus.yml
# Para instalar: kubectl apply -f monitoring/
```

## 🚨 **Troubleshooting**

### **Problemas comuns:**

**Namespace não é removido:**
```bash
kubectl delete namespace easy-hotel --force --grace-period=0
```

**Pods não iniciam:**
```bash
kubectl describe pod <pod-name> -n easy-hotel
kubectl logs <pod-name> -n easy-hotel
```

**Port forward não funciona:**
```bash
kubectl port-forward svc/reservations-service 3001:3001 -n easy-hotel
```

**Banco de dados não conecta:**
```bash
# Verificar se bancos existem
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "\l" | grep easy_hotel

# Criar bancos se necessário
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "CREATE DATABASE easy_hotel_users;"
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "CREATE DATABASE easy_hotel_rooms;"
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "CREATE DATABASE easy_hotel_reservations;"
kubectl exec -n easy-hotel deployment/postgres -- psql -U postgres -c "CREATE DATABASE easy_hotel_payments;"
```

**Porta já está em uso:**
```bash
# Verificar se há port-forward rodando
ps aux | grep port-forward

# Matar processo se necessário
pkill -f port-forward

# Ou usar porta diferente
kubectl port-forward -n easy-hotel svc/users-service 3004:3003
```

**Variáveis de ambiente não carregam:**
```bash
# Verificar se arquivo .env existe
ls -la .env

# Verificar se variáveis estão sendo carregadas
echo $DATABASE_URL

# Para desenvolvimento local, garantir que .env está na raiz
cp env.example .env
```

**Limpeza completa:**
```bash
skaffold delete
kubectl delete namespace easy-hotel --force --grace-period=0
```

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 