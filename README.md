# Easy Hotel - Sistema de Gerenciamento de Hotel

Sistema de microserviços para gerenciamento completo de hotel, desenvolvido com Node.js, Go e Rails.

## 🚀 Execução Rápida

### Pré-requisitos
- Docker
- kubectl
- Skaffold
- Cluster Kubernetes (Minikube, Docker Desktop, etc.)

### Instalação das Ferramentas

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

### Verificar Instalação
```bash
docker --version
kubectl version
skaffold version
kubectl cluster-info
```

## 🏃‍♂️ Como Executar

### 1. Clone e Configure
```bash
git clone <repository-url>
cd easy-hotel
```

### 2. Inicie o Projeto
```bash
# Iniciar todos os serviços (primeira vez pode demorar)
skaffold dev
```

### 3. Verifique se Está Funcionando
```bash
# Verificar se todos os pods estão Running
kubectl get pods -n easy-hotel

# Testar health checks
curl http://localhost:3003/health  # Users
curl http://localhost:3002/health  # Rooms
curl http://localhost:3001/health  # Reservations
```

### 4. Acessos dos Serviços
- 🌐 **Kong API Gateway**: http://localhost:3000
- 📚 **Kong Admin API**: http://localhost:8000
- 🏨 **Rooms Service**: http://localhost:3002
- 📅 **Reservations Service**: http://localhost:3001
- 👥 **Users Service**: http://localhost:3003
- 💳 **Payments Service**: http://localhost:3004
- 📧 **Notifications Service**: http://localhost:3005

## 🧪 Como Executar Testes

### Testes Rápidos
```bash
# Teste geral dos serviços
./scripts/quick-test.sh

# Teste de eventos
./scripts/test-events.sh
```

### Testes por Serviço

**Users Service (TypeScript):**
```bash
cd services/users
npm install
npm test
```

**Rooms Service (Rails):**
```bash
cd services/rooms
bundle install
bundle exec rspec
```

**Reservations Service (Go):**
```bash
cd services/reservations
go mod tidy
go test ./...
```

**Payments Service (Go):**
```bash
cd services/payments
go mod tidy
go test ./...
```

**Notifications Service (TypeScript):**
```bash
cd services/notifications
npm install
npm test
```

### Testes Manuais
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Criar usuário
curl -X POST http://localhost:3003/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "123456",
    "role": "GUEST"
  }'

# Login
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "123456"
  }'

# Criar reserva
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

# Listar quartos
curl -X GET http://localhost:3002/rooms
```

## 🛠️ Comandos Úteis

### Skaffold
```bash
skaffold dev          # Iniciar desenvolvimento
skaffold delete       # Parar e limpar tudo
skaffold run          # Deploy único
skaffold build        # Build apenas
skaffold apply        # Aplicar manifests
```

### Kubernetes
```bash
# Ver pods
kubectl get pods -n easy-hotel

# Ver logs
kubectl logs -f deployment/reservations -n easy-hotel

# Port forward
kubectl port-forward -n easy-hotel svc/users-service 3003:3003

# Ver recursos
kubectl top pods -n easy-hotel
```

### Scripts Disponíveis
```bash
./scripts/kong-setup.sh           # Configurar Kong API Gateway
./scripts/kong-jwt-setup.sh       # Configurar Autenticação JWT
./scripts/quick-test.sh           # Teste rápido dos serviços
./scripts/test-events.sh          # Teste de arquitetura de eventos
./scripts/generate-secrets.sh     # Gerar secrets seguros
./scripts/security-check.sh       # Verificar segurança
./scripts/setup-rails-secrets.sh  # Configurar secrets do Rails
./scripts/apply-hpa.sh           # Aplicar autoscaling
```

## 🏗️ Arquitetura

### Microserviços
| Serviço | Tecnologia | Porta | Descrição |
|---------|------------|-------|-----------|
| API Gateway | Kong | 3000 | Ponto de entrada único |
| Reservas | Go | 3001 | Gerenciamento de reservas |
| Quartos | Rails | 3002 | Gerenciamento de quartos |
| Usuários | TypeScript | 3003 | Autenticação e perfis |
| Pagamentos | Go | 3004 | Processamento de pagamentos |
| Notificações | TypeScript | 3005 | Emails e notificações |

### Bancos de Dados
- **PostgreSQL** - Dados principais (banco separado por serviço)
- **Redis** - Cache e sessões
- **MongoDB** - Logs e analytics
- **Kafka** - Eventos e mensageria

## 🚨 Troubleshooting

### Problemas Comuns

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

**Limpeza completa:**
```bash
skaffold delete
kubectl delete namespace easy-hotel --force --grace-period=0
```

## 📁 Estrutura do Projeto

```
easy-hotel/
├── services/
│   ├── rooms/              # Ruby on Rails - Gestão de quartos
│   ├── reservations/       # Go - Sistema de reservas
│   ├── users/             # TypeScript - Gestão de usuários
│   ├── payments/          # Go - Processamento de pagamentos
│   └── notifications/     # TypeScript - Notificações
├── k8s/                   # Manifests Kubernetes
├── scripts/               # Scripts de automação
├── monitoring/            # Prometheus, Grafana
└── docs/                 # Documentação
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 