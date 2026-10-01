import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true para puerto 465 con SSL/TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // Timeout de 10s para evitar solicitudes colgadas
    });
  }

  // Se ejecuta al iniciar la aplicación en Render para verificar la conexión SMTP
  onModuleInit() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        'Credenciales SMTP no configuradas en las variables de entorno.',
      );
      return;
    }

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          'Error al verificar la conexión SMTP con Gmail:',
          error,
        );
      } else {
        this.logger.log(
          'Servidor SMTP de Gmail verificado y listo para enviar correos.',
        );
      }
    });
  }

  async enviarCredenciales(
    correo: string,
    passwordTemporal: string,
    nombre: string,
  ) {
    this.logger.log(`Iniciando intento de envío de correo a: ${correo}`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        `Simulando envío a ${correo} (Credenciales SMTP no configuradas). Pass: ${passwordTemporal}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"ExaControl UMSS" <${process.env.SMTP_USER}>`,
        to: correo,
        subject: 'Tus credenciales de acceso a ExaControl',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #003b5c;">¡Bienvenido a ExaControl, ${nombre}!</h2>
            <p>Se te ha creado una cuenta en el sistema de control de ingresos a exámenes.</p>
            <p>Tus credenciales de acceso son las siguientes:</p>
            <ul>
              <li><strong>Usuario:</strong> ${correo}</li>
              <li><strong>Contraseña temporal:</strong> ${passwordTemporal}</li>
            </ul>
            <p><em>Por seguridad, el sistema te solicitará cambiar esta contraseña en tu primer inicio de sesión.</em></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        `,
      });

      this.logger.log(
        `Correo enviado con éxito a ${correo}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Error enviando correo a ${correo}:`, error);
      // No lanzamos la excepción para evitar revertir la transacción o bloquear la creación del usuario en BD
    }
  }
}
