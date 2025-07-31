import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const template = this.getEmailTemplate(emailData.template);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(emailData.data);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado para: ${emailData.to}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  private getEmailTemplate(templateName: string): string {
    const templates: { [key: string]: string } = {
      'reservation-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">{{hotelName}}</h2>
          <h3 style="color: #27ae60;">Reserva Confirmada</h3>
          <p>Olá {{guestName}},</p>
          <p>Sua reserva foi confirmada com sucesso!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número da Reserva:</strong> {{reservationId}}</p>
            <p><strong>Check-in:</strong> {{checkInDate}}</p>
            <p><strong>Check-out:</strong> {{checkOutDate}}</p>
          </div>
          <p>Obrigado por escolher o {{hotelName}}!</p>
        </div>
      `,
      'checkin-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">{{hotelName}}</h2>
          <h3 style="color: #27ae60;">Check-in Realizado</h3>
          <p>Olá {{guestName}},</p>
          <p>Seu check-in foi realizado com sucesso!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número da Reserva:</strong> {{reservationId}}</p>
            <p><strong>Quarto:</strong> {{roomNumber}}</p>
            <p><strong>Horário do Check-in:</strong> {{checkInTime}}</p>
          </div>
          <p>Tenha uma ótima estadia!</p>
        </div>
      `,
      'checkout-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">{{hotelName}}</h2>
          <h3 style="color: #27ae60;">Check-out Realizado</h3>
          <p>Olá {{guestName}},</p>
          <p>Seu check-out foi realizado com sucesso!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número da Reserva:</strong> {{reservationId}}</p>
            <p><strong>Valor Total:</strong> R$ {{totalAmount}}</p>
            <p><strong>Horário do Check-out:</strong> {{checkOutTime}}</p>
          </div>
          <p>Obrigado por escolher o {{hotelName}}!</p>
        </div>
      `,
      'payment-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">{{hotelName}}</h2>
          <h3 style="color: #27ae60;">Pagamento Processado</h3>
          <p>Olá {{guestName}},</p>
          <p>Seu pagamento foi processado com sucesso!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número da Reserva:</strong> {{reservationId}}</p>
            <p><strong>Valor:</strong> R$ {{amount}}</p>
            <p><strong>Método de Pagamento:</strong> {{paymentMethod}}</p>
            <p><strong>Data do Pagamento:</strong> {{paymentDate}}</p>
          </div>
          <p>Obrigado por escolher o {{hotelName}}!</p>
        </div>
      `,
    };

    return templates[templateName] || templates['reservation-confirmation'];
  }
}

export const sendEmail = async (emailData: EmailData): Promise<void> => {
  const emailService = new EmailService();
  await emailService.sendEmail(emailData);
}; 