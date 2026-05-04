import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface PendingExamAlertProps {
  ownerName: string;
  petName: string;
  clinicName: string;
  examType: string;
}

export const PendingExamAlert = ({
  ownerName = "Dueño",
  petName = "mascota",
  clinicName = "Vetinet",
  examType = "Análisis de Sangre",
}: PendingExamAlertProps) => (
  <Html>
    <Head />
    <Preview>Importante: Examen de {petName} pendiente</Preview>
    <Tailwind>
      <Body className="bg-[#f3f4f6] font-sans m-0 p-0">
        <div className="bg-[#f3f4f6] py-[60px] px-[20px]">
          <Container className="bg-white border border-[#e5e7eb] rounded-lg mx-auto w-full max-w-[460px] overflow-hidden shadow-sm">
            
            {/* Header */}
            <Section className="bg-white py-[40px] text-center">
              <Img
                src="https://ewxaywsqvmbubtypmcin.supabase.co/storage/v1/object/public/branding/veti_logo.png"
                width="140"
                height="auto"
                alt="Vetinet Logo"
                className="mx-auto"
              />
            </Section>

            {/* Content */}
            <Section className="px-[40px] pb-[40px] text-center bg-white">
              
              <Heading className="text-[#0f172a] text-[26px] font-bold mb-[24px] p-0 tracking-tight">
                Recordatorio Médico
              </Heading>
              
              <Text className="text-[#475569] text-[15px] font-medium mb-[24px] m-0">
                Hola {ownerName},
              </Text>

              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[32px]">
                Queremos informarte que aún no hemos recibido los resultados del examen de <strong>{examType}</strong> para <strong>{petName}</strong>.
              </Text>

              <Heading className="text-[#0f172a] text-[18px] font-bold mb-[12px] p-0">
                Estado: Pendiente
              </Heading>
              
              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[32px]">
                La realización de este examen es crucial para un diagnóstico preciso y el correcto seguimiento del tratamiento.
              </Text>

              <Text className="text-[#64748b] text-[14px] leading-[22px] m-0">
                Si ya lo realizaste, por favor envíanos los resultados. Si aún no lo has hecho, contáctanos para coordinar la toma de muestra.
              </Text>

            </Section>

            {/* Footer */}
            <Section className="bg-[#0f172a] py-[32px] px-[40px] text-center">
              <Text className="text-white text-[18px] font-black tracking-widest mb-[12px] m-0">
                VETINET
              </Text>
              <Text className="text-[#94a3b8] text-[10px] leading-[18px] mb-[20px] m-0 uppercase tracking-widest font-semibold">
                Gestión Veterinaria de Élite
              </Text>
              <Text className="text-[#64748b] text-[10px] leading-[16px] m-0">
                Este es un correo automático. Por favor no respondas.<br/>
                © 2026 {clinicName}
              </Text>
            </Section>

          </Container>
        </div>
      </Body>
    </Tailwind>
  </Html>
);

export default PendingExamAlert;
