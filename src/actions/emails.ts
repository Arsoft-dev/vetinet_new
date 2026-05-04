"use server";

import { transporter } from "@/lib/nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import AppointmentConfirmation from "@/components/emails/AppointmentConfirmation";
import AppointmentReminder from "@/components/emails/AppointmentReminder";
import MedicalDischarge from "@/components/emails/MedicalDischarge";
import PendingExamAlert from "@/components/emails/PendingExamAlert";
import React from "react";

const FROM_EMAIL = process.env.SMTP_USER || "asistente_vetinet@amgostechnologies.com";
const FROM_NAME = "Asistente Vetinet";

/**
 * Función genérica para enviar correos usando Nodemailer y React Email
 */
async function sendEmail({ to, subject, component }: { to: string; subject: string; component: React.ReactElement }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ Configuración SMTP faltante en .env.local");
    return { success: false, error: "SMTP_CONFIG_MISSING" };
  }

  try {
    const html = await render(component);

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error enviando correo (${subject}):`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail({
  email,
  ownerName,
  petName,
  clinicName,
}: {
  email: string;
  ownerName: string;
  petName: string;
  clinicName: string;
}) {
  return sendEmail({
    to: email,
    subject: `¡Bienvenido a ${clinicName}! 🐾`,
    component: React.createElement(WelcomeEmail, { ownerName, petName, clinicName }),
  });
}

export async function sendAppointmentEmail({
  email,
  ownerName,
  petName,
  clinicName,
  appointmentDate,
  serviceName,
}: {
  email: string;
  ownerName: string;
  petName: string;
  clinicName: string;
  appointmentDate: Date;
  serviceName: string;
}) {
  return sendEmail({
    to: email,
    subject: `Cita Confirmada: ${petName} en ${clinicName} 🗓️`,
    component: React.createElement(AppointmentConfirmation, { 
      ownerName, 
      petName, 
      clinicName, 
      appointmentDate, 
      serviceName 
    }),
  });
}

export async function sendAppointmentReminder({
  email,
  ownerName,
  petName,
  clinicName,
  appointmentDate,
}: {
  email: string;
  ownerName: string;
  petName: string;
  clinicName: string;
  appointmentDate: Date;
}) {
  return sendEmail({
    to: email,
    subject: `⏰ Recordatorio: Cita de ${petName} en 1 hora`,
    component: React.createElement(AppointmentReminder, { 
      ownerName, 
      petName, 
      clinicName, 
      appointmentDate 
    }),
  });
}

export async function sendDischargeEmail({
  email,
  ownerName,
  petName,
  clinicName,
  dischargeNotes,
}: {
  email: string;
  ownerName: string;
  petName: string;
  clinicName: string;
  dischargeNotes: string;
}) {
  return sendEmail({
    to: email,
    subject: `🏠 ¡Hora de ir a casa! Alta de ${petName} en ${clinicName}`,
    component: React.createElement(MedicalDischarge, { 
      ownerName, 
      petName, 
      clinicName, 
      dischargeNotes 
    }),
  });
}

export async function sendExamAlertEmail({
  email,
  ownerName,
  petName,
  clinicName,
  examType,
}: {
  email: string;
  ownerName: string;
  petName: string;
  clinicName: string;
  examType: string;
}) {
  return sendEmail({
    to: email,
    subject: `⚠️ Importante: Examen de ${petName} pendiente`,
    component: React.createElement(PendingExamAlert, { 
      ownerName, 
      petName, 
      clinicName, 
      examType 
    }),
  });
}
