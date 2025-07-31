package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	// Inicializar banco de dados
	if err := InitDatabase(); err != nil {
		log.Fatal("Erro ao inicializar banco de dados:", err)
	}

	// Inicializar handlers
	InitHandlers()

	// Configurar Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Configurar CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "OK",
			"service":   "Payments Service",
			"version":   "1.0.0",
			"timestamp": "2024-01-01T00:00:00Z",
		})
	})

	// Informações do serviço
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Easy Hotel - Payments Service",
			"version": "1.0.0",
			"endpoints": gin.H{
				"create_payment":           "POST /payments",
				"process_payment":          "POST /payments/:id/process",
				"get_payment":              "GET /payments/:id",
				"get_user_payments":        "GET /payments/user/:user_id",
				"get_reservation_payments": "GET /payments/reservation/:reservation_id",
				"refund_payment":           "POST /payments/:id/refund",
				"mercadopago_config":       "GET /mercadopago/config",
				"webhook":                  "POST /webhook",
			},
		})
	})

	// Configuração do MercadoPago
	r.GET("/mercadopago/config", GetMercadoPagoConfigHandler)

	// Rotas de pagamentos
	payments := r.Group("/payments")
	{
		payments.POST("", CreatePaymentHandler)                                       // Criar pagamento
		payments.POST("/:id/process", ProcessPaymentHandler)                          // Processar pagamento
		payments.GET("/:id", GetPaymentHandler)                                       // Buscar pagamento
		payments.GET("/user/:user_id", GetPaymentsByUserHandler)                      // Pagamentos do usuário
		payments.GET("/reservation/:reservation_id", GetPaymentsByReservationHandler) // Pagamentos da reserva
		payments.POST("/:id/refund", RefundPaymentHandler)                            // Reembolso
	}

	// Webhook do MercadoPago
	r.POST("/webhook", WebhookHandler)

	// Obter porta do ambiente
	port := os.Getenv("PORT")
	if port == "" {
		port = "3004"
	}

	log.Printf("🚀 Serviço de Pagamentos rodando na porta %s", port)
	log.Printf("🏥 Health check: http://localhost:%s/health", port)
	log.Printf("📚 Documentação: http://localhost:%s/", port)

	// Iniciar servidor
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}
