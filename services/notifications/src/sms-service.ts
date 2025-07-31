import twilio from 'twilio';

interface SMSData {
  to: string;
  message: string;
}

export class SMSService {
  private client!: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials não configuradas');
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(smsData: SMSData): Promise<void> {
    try {
      if (!this.client) {
        console.warn('⚠️ Cliente Twilio não inicializado');
        return;
      }

      const message = await this.client.messages.create({
        body: smsData.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: smsData.to
      });

      console.log(`✅ SMS enviado para: ${smsData.to} (SID: ${message.sid})`);
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      throw error;
    }
  }
}

export const sendSMS = async (smsData: SMSData): Promise<void> => {
  const smsService = new SMSService();
  await smsService.sendSMS(smsData);
}; 