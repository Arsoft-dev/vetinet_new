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
  Hr,
  Button,
} from "@react-email/components";
import * as React from "react";

interface CriticalStockAlertProps {
  clinicName: string;
  items: Array<{
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }>;
  dashboardUrl?: string;
}

export const CriticalStockAlert = ({
  clinicName = "Vetinet Elite",
  items = [],
  dashboardUrl = "https://app.vetinet.com/dashboard/inventory/suppliers/purchase-orders",
}: CriticalStockAlertProps) => (
  <Html>
    <Head />
    <Preview>Alerta de Stock Crítico - {clinicName}</Preview>
    <Tailwind>
      <Body className="bg-[#f3f4f6] font-sans m-0 p-0">
        <div className="bg-[#f3f4f6] py-[40px] px-[20px]">
          <Container className="bg-white border border-[#e5e7eb] rounded-lg mx-auto w-full max-w-[600px] overflow-hidden shadow-sm">
            
            {/* Header */}
            <Section className="bg-[#0f172a] py-[24px] text-center">
              <Img
                src="cid:logo_vetinet"
                width="120"
                height="auto"
                alt="Vetinet Logo"
                className="mx-auto mb-2"
              />
              <Text className="text-[#94a3b8] text-[10px] leading-[18px] m-0 uppercase tracking-widest font-semibold">
                Gestión Logística de Élite
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px] bg-white text-center">
              <Heading className="text-[#0f172a] text-[20px] font-bold mb-[8px] p-0 tracking-tight">
                ⚠️ ALERTA DE STOCK CRÍTICO
              </Heading>
              
              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[24px] m-0">
                Hola equipo de <strong>{clinicName}</strong>,<br/>
                El sistema de monitoreo automático de Vetinet ha detectado que los siguientes productos han caído por debajo de su límite de seguridad:
              </Text>

              <Hr className="border-[#e5e7eb] my-[24px]" />

              <table className="w-full text-left border-collapse text-[12px] mb-[24px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] font-bold border-b border-[#e5e7eb]">
                    <th className="p-[10px] text-left">Producto</th>
                    <th className="p-[10px] text-center">Stock Actual</th>
                    <th className="p-[10px] text-center">Nivel Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#f1f5f9] text-[#334155]">
                      <td className="p-[10px] font-bold">{item.name}</td>
                      <td className="p-[10px] text-center font-bold text-red-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="p-[10px] text-center text-[#64748b]">
                        {item.minStock} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                href={dashboardUrl}
                className="bg-blue-600 text-white font-bold px-[24px] py-[12px] rounded-lg tracking-wide text-[14px]"
              >
                Generar Orden de Compra
              </Button>

              <Hr className="border-[#e5e7eb] my-[24px]" />

              <Text className="text-[#64748b] text-[11px] leading-[18px] text-center m-0">
                Esta es una alerta automática generada por el módulo de inteligencia logística. Para evitar roturas de inventario, te sugerimos contactar a tus proveedores a la brevedad.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-[#0f172a] py-[24px] px-[32px] text-center">
              <Text className="text-white text-[16px] font-black tracking-widest mb-[8px] m-0">
                VETINET ELITE
              </Text>
              <Text className="text-[#64748b] text-[10px] leading-[16px] m-0">
                Este mensaje es automático. Por favor, no respondas a este correo.<br/>
                © 2026 {clinicName}
              </Text>
            </Section>

          </Container>
        </div>
      </Body>
    </Tailwind>
  </Html>
);

export default CriticalStockAlert;
