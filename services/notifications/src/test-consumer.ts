import { EventConsumer } from './event-consumer';

async function testConsumer() {
  console.log('🧪 Testando consumer de eventos...');
  
  try {
    const consumer = new EventConsumer();
    await consumer.start();
    console.log('✅ Consumer iniciado com sucesso!');
    
    // Manter vivo por alguns segundos
    setTimeout(async () => {
      await consumer.stop();
      console.log('🛑 Consumer parado');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Erro ao testar consumer:', error);
  }
}

testConsumer(); 