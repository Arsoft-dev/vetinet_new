"use server";

import { transporter } from "@/lib/nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import AppointmentConfirmation from "@/components/emails/AppointmentConfirmation";
import AppointmentReminder from "@/components/emails/AppointmentReminder";
import MedicalDischarge from "@/components/emails/MedicalDischarge";
import PendingExamAlert from "@/components/emails/PendingExamAlert";
import PurchaseOrderEmail from "@/components/emails/PurchaseOrderEmail";
import CriticalStockAlert from "@/components/emails/CriticalStockAlert";
import React from "react";
import path from "path";

const FROM_EMAIL = process.env.SMTP_USER || "asistente_vetinet@amgostechnologies.com";
const FROM_NAME = "Asistente Vetinet";

/**
 * Función genérica para enviar correos usando Nodemailer y React Email
 */
async function sendEmail({ 
  to, 
  subject, 
  component, 
  attachments,
  text
}: { 
  to: string; 
  subject: string; 
  component: React.ReactElement;
  attachments?: any[];
  text?: string;
}) {
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
      text: text || undefined,
      attachments: attachments || undefined,
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

export async function sendPurchaseOrderEmail({
  email,
  orderNumber,
  supplierName,
  clinicName,
  items,
  totalAmount,
  notes,
  pdfBuffer,
}: {
  email: string;
  orderNumber: string;
  supplierName: string;
  clinicName: string;
  items: Array<{ name: string; quantity: number; unit: string; unitPrice: number }>;
  totalAmount: number;
  notes?: string;
  pdfBuffer?: Buffer;
}) {
  const attachments: any[] = [];

  // 1. Embeber el logotipo vía CID (evita imágenes rotas y reduce spam)
  try {
    const logoPath = path.join(process.cwd(), "public/veti_logo.png");
    attachments.push({
      filename: "veti_logo.png",
      path: logoPath,
      cid: "logo_vetinet",
    });
  } catch (err) {
    console.error("❌ Error al adjuntar logo CID:", err);
  }

  // 2. Adjuntar el PDF si fue provisto
  if (pdfBuffer) {
    attachments.push({
      filename: `Orden_Compra_${orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  // 3. Crear fallback de texto plano para reducir puntuación de spam
  const textFallback = 
    `VETINET ELITE — ORDEN DE COMPRA: ${orderNumber}\n\n` +
    `Estimado equipo de ${supplierName},\n\n` +
    `A través del presente correo electrónico, la clínica ${clinicName} le formaliza la orden de compra ${orderNumber} por un monto total estimado de $${totalAmount.toFixed(2)} USD.\n\n` +
    `Por favor, revise los detalles en el documento PDF adjunto a este mensaje y comuníquese con nosotros para coordinar la entrega y facturación formal.\n\n` +
    `Notas / Observaciones:\n${notes || "Ninguna."}\n\n` +
    `Saludos cordiales,\n` +
    `${clinicName}\n` +
    `Desarrollado y Gestionado por Vetinet Elite.`;

  return sendEmail({
    to: email,
    subject: `ORDEN DE COMPRA: ${orderNumber} - ${clinicName} 🛒`,
    text: textFallback,
    attachments,
    component: React.createElement(PurchaseOrderEmail, {
      orderNumber,
      supplierName,
      clinicName,
      items,
      totalAmount,
      notes,
    }),
  });
}

export async function sendCriticalStockAlertEmail({
  email,
  clinicName,
  items,
  pdfBuffer,
}: {
  email: string;
  clinicName: string;
  items: Array<{ name: string; currentStock: number; minStock: number; unit: string }>;
  pdfBuffer?: Buffer;
}) {
  const attachments: any[] = [];

  try {
    const logoPath = path.join(process.cwd(), "public/veti_logo.png");
    attachments.push({
      filename: "veti_logo.png",
      path: logoPath,
      cid: "logo_vetinet",
    });
  } catch (err) {
    console.error("❌ Error al adjuntar logo CID en alerta:", err);
  }

  if (pdfBuffer) {
    attachments.push({
      filename: `Reporte_Reposicion_${new Date().toISOString().slice(0, 10)}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  const textFallback = 
    `VETINET ELITE — ALERTA DE STOCK CRÍTICO\n\n` +
    `Hola equipo de ${clinicName},\n\n` +
    `El sistema ha detectado que los siguientes productos han caído por debajo de su límite de seguridad:\n` +
    items.map(item => `- ${item.name}: ${item.currentStock} ${item.unit} (Mínimo: ${item.minStock} ${item.unit})`).join("\n") +
    `\n\nPara evitar roturas de inventario, sugerimos generar una orden de compra.\n\n` +
    `Saludos cordiales,\nVetinet Elite.`;

  return sendEmail({
    to: email,
    subject: `⚠️ ALERTA DE STOCK CRÍTICO - ${clinicName}`,
    text: textFallback,
    attachments,
    component: React.createElement(CriticalStockAlert, {
      clinicName,
      items,
    }),
  });
}
