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

interface MedicalDischargeProps {
  ownerName: string;
  petName: string;
  clinicName: string;
  dischargeNotes: string;
}

export const MedicalDischarge = ({
  ownerName = "Dueño",
  petName = "mascota",
  clinicName = "Vetinet",
  dischargeNotes = "Su mascota está lista para volver a casa.",
}: MedicalDischargeProps) => (
  <Html>
    <Head />
    <Preview>Alta Médica: {petName} va a casa</Preview>
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
                ¡{petName} va a casa!
              </Heading>
              
              <Text className="text-[#475569] text-[15px] font-medium mb-[24px] m-0">
                Hola {ownerName},
              </Text>

              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[32px]">
                Nos hace muy felices informarte que <strong>{petName}</strong> ha recibido su alta médica en nuestras instalaciones.
              </Text>

              <Heading className="text-[#0f172a] text-[18px] font-bold mb-[12px] p-0">
                Indicaciones de Recuperación
              </Heading>
              
              <Text className="text-[#475569] text-[14px] leading-[26px] mb-[32px] whitespace-pre-wrap italic bg-[#f8fafc] p-[20px] rounded-lg border border-[#e5e7eb] text-left">
                "{dischargeNotes}"
              </Text>

              <Text className="text-[#64748b] text-[14px] leading-[22px] m-0">
                Ha sido un honor cuidar de {petName}. Recuerda seguir estas indicaciones cuidadosamente para asegurar una recuperación total.
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

export default MedicalDischarge;
