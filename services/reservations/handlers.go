package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Reservation representa uma reserva
type Reservation struct {
	ID           string    `json:"id"`
	GuestName    string    `json:"guest_name"`
	GuestEmail   string    `json:"guest_email"`
	GuestPhone   string    `json:"guest_phone"`
	RoomID       string    `json:"room_id"`
	CheckInDate  time.Time `json:"check_in_date"`
	CheckOutDate time.Time `json:"check_out_date"`
	Status       string    `json:"status"`
	TotalAmount  float64   `json:"total_amount"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// createReservation cria uma nova reserva
func createReservation(c *gin.Context) {
	var reservation Reservation
	if err := c.ShouldBindJSON(&reservation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simular criação da reserva
	reservation.ID = "res_" + strconv.FormatInt(time.Now().UnixNano(), 10)
	reservation.Status = "confirmed"
	reservation.CreatedAt = time.Now()
	reservation.UpdatedAt = time.Now()

	// Publicar evento de reserva criada
	if eventPublisher != nil {
		eventData := map[string]interface{}{
			"reservationId": reservation.ID,
			"guestName":     reservation.GuestName,
			"guestEmail":    reservation.GuestEmail,
			"guestPhone":    reservation.GuestPhone,
			"roomId":        reservation.RoomID,
			"checkInDate":   reservation.CheckInDate.Format("2006-01-02"),
			"checkOutDate":  reservation.CheckOutDate.Format("2006-01-02"),
			"totalAmount":   reservation.TotalAmount,
		}

		if err := eventPublisher.PublishReservationCreated(reservation.ID, eventData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao publicar evento"})
			return
		}
	}

	c.JSON(http.StatusCreated, reservation)
}

// getReservation obtém uma reserva por ID
func getReservation(c *gin.Context) {
	id := c.Param("id")

	// Simular busca da reserva
	reservation := Reservation{
		ID:          id,
		GuestName:   "João Silva",
		GuestEmail:  "joao@example.com",
		Status:      "confirmed",
		TotalAmount: 150.00,
		CreatedAt:   time.Now(),
	}

	c.JSON(http.StatusOK, reservation)
}

// updateReservation atualiza uma reserva
func updateReservation(c *gin.Context) {
	id := c.Param("id")
	var updateData Reservation
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simular atualização
	updateData.ID = id
	updateData.UpdatedAt = time.Now()

	// Publicar evento de reserva atualizada
	if eventPublisher != nil {
		eventData := map[string]interface{}{
			"reservationId": id,
			"guestName":     updateData.GuestName,
			"guestEmail":    updateData.GuestEmail,
			"status":        updateData.Status,
		}

		if err := eventPublisher.PublishReservationUpdated(id, eventData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao publicar evento"})
			return
		}
	}

	c.JSON(http.StatusOK, updateData)
}

// cancelReservation cancela uma reserva
func cancelReservation(c *gin.Context) {
	id := c.Param("id")

	// Simular cancelamento
	reservation := Reservation{
		ID:        id,
		Status:    "cancelled",
		UpdatedAt: time.Now(),
	}

	// Publicar evento de reserva cancelada
	if eventPublisher != nil {
		eventData := map[string]interface{}{
			"reservationId": id,
			"status":        "cancelled",
			"cancelledAt":   time.Now().Format("2006-01-02 15:04:05"),
		}

		if err := eventPublisher.PublishReservationCancelled(id, eventData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao publicar evento"})
			return
		}
	}

	c.JSON(http.StatusOK, reservation)
}

// checkIn realiza o check-in de uma reserva
func checkIn(c *gin.Context) {
	id := c.Param("id")

	// Simular check-in
	reservation := Reservation{
		ID:        id,
		Status:    "checked-in",
		UpdatedAt: time.Now(),
	}

	// Publicar evento de check-in
	if eventPublisher != nil {
		eventData := map[string]interface{}{
			"reservationId": id,
			"status":        "checked-in",
			"roomNumber":    "101",
			"checkInTime":   time.Now().Format("2006-01-02 15:04:05"),
		}

		if err := eventPublisher.PublishCheckIn(id, eventData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao publicar evento"})
			return
		}
	}

	c.JSON(http.StatusOK, reservation)
}

// checkOut realiza o check-out de uma reserva
func checkOut(c *gin.Context) {
	id := c.Param("id")

	// Simular check-out
	reservation := Reservation{
		ID:          id,
		Status:      "checked-out",
		TotalAmount: 300.00,
		UpdatedAt:   time.Now(),
	}

	// Publicar evento de check-out
	if eventPublisher != nil {
		eventData := map[string]interface{}{
			"reservationId": id,
			"status":        "checked-out",
			"totalAmount":   300.00,
			"checkOutTime":  time.Now().Format("2006-01-02 15:04:05"),
		}

		if err := eventPublisher.PublishCheckOut(id, eventData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao publicar evento"})
			return
		}
	}

	c.JSON(http.StatusOK, reservation)
}
