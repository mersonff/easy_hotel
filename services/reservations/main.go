package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var eventPublisher *EventPublisher

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	// Inicializar publisher de eventos
	var err error
	eventPublisher, err = NewEventPublisher()
	if err != nil {
		log.Printf("⚠️ Erro ao inicializar publisher de eventos: %v", err)
	} else {
		log.Println("✅ Publisher de eventos inicializado")
		defer eventPublisher.Close()
	}

	// Configurar Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "OK",
			"service":   "Reservations Service",
			"version":   "1.0.0",
			"timestamp": "2024-01-01T00:00:00Z",
		})
	})

	// Rotas básicas
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Easy Hotel - Reservations Service",
			"version": "1.0.0",
		})
	})

	// Rotas de reservas
	r.POST("/reservations", createReservation)
	r.GET("/reservations/:id", getReservation)
	r.PUT("/reservations/:id", updateReservation)
	r.DELETE("/reservations/:id", cancelReservation)
	r.POST("/reservations/:id/check-in", checkIn)
	r.POST("/reservations/:id/check-out", checkOut)

	// Obter porta do ambiente
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("🚀 Serviço de Reservas rodando na porta %s", port)
	log.Printf("🏥 Health check: http://localhost:%s/health", port)

	// Iniciar servidor
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}
