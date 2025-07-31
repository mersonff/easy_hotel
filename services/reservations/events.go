package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Shopify/sarama"
)

// Event representa um evento do sistema
type Event struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
	Source    string                 `json:"source"`
}

// EventPublisher publica eventos para Kafka
type EventPublisher struct {
	producer sarama.SyncProducer
}

// NewEventPublisher cria um novo publisher de eventos
func NewEventPublisher() (*EventPublisher, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true

	brokers := []string{os.Getenv("KAFKA_BROKERS")}
	if brokers[0] == "" {
		brokers = []string{"kafka-service:9092"}
	}

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar producer: %v", err)
	}

	return &EventPublisher{producer: producer}, nil
}

// PublishEvent publica um evento para um tópico
func (ep *EventPublisher) PublishEvent(topic string, eventType string, data map[string]interface{}) error {
	event := Event{
		ID:        generateEventID(),
		Type:      eventType,
		Timestamp: time.Now(),
		Data:      data,
		Source:    "reservations-service",
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("erro ao serializar evento: %v", err)
	}

	msg := &sarama.ProducerMessage{
		Topic: topic,
		Value: sarama.StringEncoder(eventJSON),
		Key:   sarama.StringEncoder(event.ID),
	}

	partition, offset, err := ep.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("erro ao enviar evento: %v", err)
	}

	log.Printf("✅ Evento publicado: %s -> tópico: %s, partition: %d, offset: %d", eventType, topic, partition, offset)
	return nil
}

// PublishReservationCreated publica evento de reserva criada
func (ep *EventPublisher) PublishReservationCreated(reservationID string, data map[string]interface{}) error {
	return ep.PublishEvent("hotel.reservations.created", "reservation.created", data)
}

// PublishReservationUpdated publica evento de reserva atualizada
func (ep *EventPublisher) PublishReservationUpdated(reservationID string, data map[string]interface{}) error {
	return ep.PublishEvent("hotel.reservations.updated", "reservation.updated", data)
}

// PublishReservationCancelled publica evento de reserva cancelada
func (ep *EventPublisher) PublishReservationCancelled(reservationID string, data map[string]interface{}) error {
	return ep.PublishEvent("hotel.reservations.cancelled", "reservation.cancelled", data)
}

// PublishCheckIn publica evento de check-in
func (ep *EventPublisher) PublishCheckIn(reservationID string, data map[string]interface{}) error {
	return ep.PublishEvent("hotel.reservations.checked-in", "reservation.checked-in", data)
}

// PublishCheckOut publica evento de check-out
func (ep *EventPublisher) PublishCheckOut(reservationID string, data map[string]interface{}) error {
	return ep.PublishEvent("hotel.reservations.checked-out", "reservation.checked-out", data)
}

// Close fecha o producer
func (ep *EventPublisher) Close() error {
	return ep.producer.Close()
}

// generateEventID gera um ID único para o evento
func generateEventID() string {
	return fmt.Sprintf("evt_%d", time.Now().UnixNano())
}
