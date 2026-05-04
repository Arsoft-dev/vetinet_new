import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST || "mail.amgostechnologies.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const transporter = nodemailer.createTransport(smtpConfig);

// Verificar la conexión al iniciar (solo en desarrollo o logs)
if (process.env.NODE_ENV === "development") {
  transporter.verify((error, success) => {
    if (error) {
      console.warn("⚠️ Error en la configuración SMTP:", error.message);
    } else {
      console.log("✅ Servidor de correo listo para enviar");
    }
  });
}
