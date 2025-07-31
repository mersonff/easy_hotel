#!/bin/bash

echo "📈 Aplicando Horizontal Pod Autoscaler (HPA)"
echo "=============================================="

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não está instalado!"
    exit 1
fi

# Verificar se o namespace existe
if ! kubectl get namespace easy-hotel &> /dev/null; then
    echo "❌ Namespace 'easy-hotel' não existe!"
    echo "Execute primeiro: ./scripts/deploy-k8s.sh"
    exit 1
fi

echo "🔍 Verificando se o metrics-server está instalado..."
if ! kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo "⚠️  Metrics Server não encontrado!"
    echo "Instalando Metrics Server..."
    
    # Para Minikube
    if kubectl get nodes | grep -q "minikube"; then
        minikube addons enable metrics-server
    else
        # Para outros clusters
        kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    fi
    
    echo "⏳ Aguardando Metrics Server ficar pronto..."
    kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=300s
fi

echo ""
echo "📊 Aplicando HPA..."
kubectl apply -f k8s/autoscaling/

echo ""
echo "✅ HPA aplicado com sucesso!"
echo ""
echo "📋 Verificando HPA:"
kubectl get hpa -n easy-hotel

echo ""
echo "📊 Monitorando HPA:"
echo "kubectl get hpa -n easy-hotel -w"

echo ""
echo "📈 Comandos úteis:"
echo "  kubectl get hpa -n easy-hotel                    # Ver HPA"
echo "  kubectl describe hpa rooms-hpa -n easy-hotel  # Detalhes do HPA"
echo "  kubectl describe hpa reservations-hpa -n easy-hotel  # Detalhes do HPA"
echo "  kubectl describe hpa users-hpa -n easy-hotel  # Detalhes do HPA"
echo "  kubectl describe hpa payments-hpa -n easy-hotel  # Detalhes do HPA"
echo "  kubectl describe hpa notifications-hpa -n easy-hotel  # Detalhes do HPA"
echo "  kubectl top pods -n easy-hotel                   # Ver uso de recursos"
echo "  kubectl top nodes                                 # Ver uso dos nodes" 