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
} from "@react-email/components";
import * as React from "react";

interface PurchaseOrderEmailProps {
  orderNumber: string;
  supplierName: string;
  clinicName: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  totalAmount: number;
  notes?: string;
}

export const PurchaseOrderEmail = ({
  orderNumber = "OC-000000",
  supplierName = "Proveedor",
  clinicName = "Vetinet Elite",
  items = [],
  totalAmount = 0,
  notes = "",
}: PurchaseOrderEmailProps) => (
  <Html>
    <Head />
    <Preview>Orden de Compra {orderNumber} - {clinicName}</Preview>
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
                Gestión Veterinaria de Élite
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px] bg-white">
              <Heading className="text-[#0f172a] text-[20px] font-bold mb-[12px] p-0 tracking-tight text-center">
                ORDEN DE COMPRA
              </Heading>
              <Text className="text-blue-600 text-[18px] font-black text-center mb-[24px] m-0">
                {orderNumber}
              </Text>
              
              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[16px] m-0">
                Estimado equipo de <strong>{supplierName}</strong>,
              </Text>

              <Text className="text-[#475569] text-[14px] leading-[24px] mb-[24px]">
                A través del presente correo electrónico, la clínica <strong>{clinicName}</strong> le formaliza la siguiente orden de compra para el suministro de productos médicos e inventario:
              </Text>

              <Hr className="border-[#e5e7eb] my-[24px]" />

              <Heading className="text-[#0f172a] text-[14px] font-bold mb-[12px] uppercase tracking-wider">
                Detalle de Productos Solicitados
              </Heading>

              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] font-bold border-b border-[#e5e7eb]">
                    <th className="p-[10px] text-left">Producto</th>
                    <th className="p-[10px] text-center">Cantidad</th>
                    <th className="p-[10px] text-right">Precio Unit.</th>
                    <th className="p-[10px] text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#f1f5f9] text-[#334155]">
                      <td className="p-[10px] font-bold">{item.name}</td>
                      <td className="p-[10px] text-center">{item.quantity} {item.unit}</td>
                      <td className="p-[10px] text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-[10px] text-right font-bold text-blue-600">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8fafc] font-bold text-[#0f172a]">
                    <td colSpan={3} className="p-[12px] text-right uppercase text-[10px] text-[#64748b]">Monto Total Estimado (USD)</td>
                    <td className="p-[12px] text-right text-[14px] text-emerald-600">${totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {notes && (
                <>
                  <Hr className="border-[#e5e7eb] my-[24px]" />
                  <Heading className="text-[#0f172a] text-[12px] font-bold mb-[8px] uppercase tracking-wider">
                    Notas y Observaciones
                  </Heading>
                  <Text className="text-[#475569] text-[12px] leading-[18px] bg-[#f8fafc] p-[12px] rounded-lg italic border border-[#e5e7eb] m-0">
                    {notes}
                  </Text>
                </>
              )}

              <Hr className="border-[#e5e7eb] my-[24px]" />

              <Text className="text-[#64748b] text-[11px] leading-[18px] text-center m-0">
                Por favor, proceda a procesar este pedido y comuníquese con nosotros a la brevedad para coordinar la entrega y facturación formal.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-[#0f172a] py-[24px] px-[32px] text-center">
              <Text className="text-white text-[16px] font-black tracking-widest mb-[8px] m-0">
                VETINET ELITE
              </Text>
              <Text className="text-[#64748b] text-[10px] leading-[16px] m-0">
                Este es un documento emitido electrónicamente por el sistema Vetinet de {clinicName}.<br/>
                © 2026 {clinicName}
              </Text>
            </Section>

          </Container>
        </div>
      </Body>
    </Tailwind>
  </Html>
);

export default PurchaseOrderEmail;
