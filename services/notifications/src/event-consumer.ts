import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { sendEmail } from './email-service';
import { sendSMS } from './sms-service';

interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  source: string;
}

export class EventConsumer {
  private consumer: Consumer;
  private kafka: Kafka;

  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['kafka-service:9092'];
    
    this.kafka = new Kafka({
      clientId: 'notifications-service',
      brokers: brokers,
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'notifications-group',
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async start(): Promise<void> {
    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        await this.consumer.connect();
        console.log('✅ Conectado ao Kafka como consumidor');

        // Inscrever nos tópicos de eventos
        await this.consumer.subscribe({ 
          topic: 'hotel.reservations.created',
          fromBeginning: false 
        });
        
        console.log('✅ Inscrito no tópico hotel.reservations.created');

        // Processar mensagens
        await this.consumer.run({
          eachMessage: async (payload: EachMessagePayload) => {
            console.log(`🎯 Mensagem recebida do tópico: ${payload.topic}, partition: ${payload.partition}, offset: ${payload.message.offset}`);
            await this.handleEvent(payload);
          },
        });

        console.log('🎧 Consumidor de eventos iniciado');
        return; // Sucesso, sair do loop
      } catch (error) {
        retries++;
        console.error(`❌ Erro ao iniciar consumidor (tentativa ${retries}/${maxRetries}):`, error);
        
        if (retries < maxRetries) {
          console.log(`⏳ Aguardando 5 segundos antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error('❌ Máximo de tentativas atingido. Consumer não iniciado.');
          throw error;
        }
      }
    }
  }

  private async handleEvent(payload: EachMessagePayload): Promise<void> {
    try {
      const { topic, message } = payload;
      console.log(`🔍 Processando mensagem do tópico: ${topic}`);
      console.log(`📄 Conteúdo da mensagem:`, message.value?.toString());
      
      const event: Event = JSON.parse(message.value?.toString() || '{}');

      console.log(`📨 Evento recebido: ${event.type} do tópico ${topic}`);

      switch (event.type) {
        case 'reservation.created':
          await this.handleReservationCreated(event);
          break;
        case 'reservation.checked-in':
          await this.handleCheckIn(event);
          break;
        case 'reservation.checked-out':
          await this.handleCheckOut(event);
          break;
        case 'payment.processed':
          await this.handlePaymentProcessed(event);
          break;
        default:
          console.log(`⚠️ Tipo de evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar evento:', error);
    }
  }

  private async handleReservationCreated(event: Event): Promise<void> {
    const { reservationId, guestEmail, guestName, checkInDate, checkOutDate } = event.data;

    console.log(`📧 [TESTE] Simulando envio de email para: ${guestEmail}`);
    console.log(`📱 [TESTE] Simulando envio de SMS para: ${event.data.guestPhone}`);
    console.log(`✅ [TESTE] Notificações processadas para reserva ${reservationId}`);

    // TODO: Implementar envio real de emails e SMS quando necessário
    // await sendEmail({...});
    // await sendSMS({...});
  }

  private async handleCheckIn(event: Event): Promise<void> {
    const { reservationId, guestEmail, guestName, roomNumber } = event.data;

    console.log(`📧 [TESTE] Simulando email de check-in para: ${guestEmail}`);
    console.log(`✅ [TESTE] Notificação de check-in processada para reserva ${reservationId}`);

    // TODO: Implementar envio real de emails quando necessário
    // await sendEmail({...});
  }

  private async handleCheckOut(event: Event): Promise<void> {
    const { reservationId, guestEmail, guestName, totalAmount } = event.data;

    console.log(`📧 [TESTE] Simulando email de check-out para: ${guestEmail}`);
    console.log(`✅ [TESTE] Notificação de check-out processada para reserva ${reservationId}`);

    // TODO: Implementar envio real de emails quando necessário
    // await sendEmail({...});
  }

  private async handlePaymentProcessed(event: Event): Promise<void> {
    const { reservationId, guestEmail, guestName, amount, paymentMethod } = event.data;

    console.log(`📧 [TESTE] Simulando email de pagamento para: ${guestEmail}`);
    console.log(`✅ [TESTE] Notificação de pagamento processada para reserva ${reservationId}`);

    // TODO: Implementar envio real de emails quando necessário
    // await sendEmail({...});
  }

  async stop(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log('🛑 Consumidor de eventos parado');
    } catch (error) {
      console.error('❌ Erro ao parar consumidor:', error);
    }
  }
} 