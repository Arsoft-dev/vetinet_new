import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import fs from "fs";
import path from "path";

/**
 * Genera un Buffer de PDF para una Orden de Compra dada.
 * Diseñado para igualar visualmente el formato de impresión web del navegador.
 */
export function generatePurchaseOrderPDF(order: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            // Inicializar documento A4 (595.28 x 841.89 puntos)
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const buffers: Buffer[] = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on("error", (err) => reject(err));

            // --- ENCABEZADO ---
            // 1. Logo
            const logoPath = path.join(process.cwd(), "public/icono.png");
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 48, { width: 40 });
                doc.font("Helvetica-Bold")
                   .fontSize(6)
                   .fillColor("#059669")
                   .text("VETINET", 50, 91, { width: 40, align: "center" });
            }

            // 2. Datos de la Clínica
            const clinicName = order.clinic?.name || "Clínica Veterinaria";
            const clinicAddress = order.clinic?.address || "Dirección Fiscal de la Clínica";
            const clinicRif = order.clinic?.rif ? `RIF: ${order.clinic.rif}` : "RIF: J-00000000-0";
            const clinicPhone = order.clinic?.phone ? `Tel: ${order.clinic.phone}` : "";

            doc.font("Helvetica-Bold")
               .fontSize(13)
               .fillColor("#0f172a")
               .text(clinicName.toUpperCase(), 105, 50, { width: 220 });

            doc.font("Helvetica")
               .fontSize(8.5)
               .fillColor("#475569")
               .text(clinicAddress, 105, 66, { width: 220 })
               .text(`${clinicRif} • ${clinicPhone}`, 105, 78, { width: 220 });

            // 3. Datos de la Orden (Lado Derecho)
            doc.font("Helvetica-Bold")
               .fontSize(11)
               .fillColor("#0f172a")
               .text("ORDEN DE COMPRA", 330, 50, { align: "right", width: 215 });
            
            doc.fontSize(11)
               .fillColor("#2563eb")
               .text(order.order_number || "", 330, 66, { align: "right", width: 215 });

            const statusLabels: Record<string, string> = {
                'pending': 'Borrador / Pendiente',
                'ordered': 'Ordenada / Enviada',
                'received': 'Recibida',
                'canceled': 'Cancelada'
            };
            const statusLabel = statusLabels[order.status] || order.status;
            doc.font("Helvetica")
               .fontSize(8.5)
               .fillColor("#475569")
               .text(`Estado: ${statusLabel.toUpperCase()}`, 330, 80, { align: "right", width: 215 });

            const formattedDate = format(new Date(order.created_at), "dd/MM/yyyy h:mm a", { locale: es });
            doc.text(`Fecha Emisión: ${formattedDate}`, 330, 92, { align: "right", width: 215 });

            // Línea divisoria superior
            doc.moveTo(50, 112)
               .lineTo(545, 112)
               .strokeColor("#e2e8f0")
               .lineWidth(1)
               .stroke();

            // --- TARJETAS DE INFORMACIÓN (Y = 125) ---
            const infoY = 125;
            const boxHeight = 115;

            // Tarjeta Izquierda: Proveedor
            doc.roundedRect(50, infoY, 238, boxHeight, 12)
               .strokeColor("#e2e8f0")
               .lineWidth(1)
               .stroke();

            doc.font("Helvetica-Bold")
               .fontSize(8)
               .fillColor("#64748b")
               .text("DATOS DEL PROVEEDOR", 62, infoY + 12);

            const supplierName = order.supplier?.name || "";
            const supplierTax = order.supplier?.tax_id || "";
            const supplierContact = order.supplier?.contact_person || "";
            const supplierPhone = order.supplier?.phone || "";
            const supplierEmail = order.supplier?.email || "";
            const supplierAddress = order.supplier?.address || "";

            let textY = infoY + 28;
            const drawLabelValue = (label: string, value: string, x: number, y: number) => {
                doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text(label, x, y);
                const labelWidth = doc.widthOfString(label);
                doc.font("Helvetica").fontSize(8.5).fillColor("#0f172a").text(value, x + labelWidth + 4, y, { width: 220 - labelWidth - 4 });
            };

            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text("Nombre: ", 62, textY);
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(supplierName.toUpperCase(), 105, textY, { width: 170 });
            
            drawLabelValue("RIF/ID:", supplierTax, 62, textY + 12);
            drawLabelValue("Contacto:", supplierContact, 62, textY + 24);
            drawLabelValue("Teléfono:", supplierPhone, 62, textY + 36);
            drawLabelValue("Email:", supplierEmail, 62, textY + 48);
            drawLabelValue("Dir:", supplierAddress, 62, textY + 60);

            // Tarjeta Derecha: Destino
            doc.roundedRect(300, infoY, 245, boxHeight, 12)
               .strokeColor("#e2e8f0")
               .lineWidth(1)
               .stroke();

            doc.font("Helvetica-Bold")
               .fontSize(8)
               .fillColor("#64748b")
               .text("UBICACIÓN DE DESTINO", 312, infoY + 12);

            const warehouseName = order.warehouse?.name || "ALMACÉN PRINCIPAL";
            const issuerName = order.issuer?.full_name || "Usuario Demo";
            
            // Reutilizamos la dirección física general (para el despacho del proveedor)
            const deliveryAddress = order.clinic?.address || "Dirección Fiscal de la Clínica";

            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text("Almacén: ", 312, infoY + 28);
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(warehouseName.toUpperCase(), 360, infoY + 28, { width: 170 });

            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text("Dirección: ", 312, infoY + 40);
            doc.font("Helvetica").fontSize(8.5).fillColor("#000000").text(deliveryAddress, 360, infoY + 40, { width: 170 });

            // Emisor en la parte inferior de la caja
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569").text("Emitido Por: ", 312, infoY + 88);
            doc.font("Helvetica").fontSize(8.5).fillColor("#0f172a").text(issuerName, 372, infoY + 88, { width: 160 });

            if (order.received_at) {
                const formattedRecDate = format(new Date(order.received_at), "dd/MM/yyyy", { locale: es });
                doc.font("Helvetica-Bold")
                   .fontSize(8.5)
                   .fillColor("#10b981")
                   .text(`✓ Recibido: ${formattedRecDate}`, 312, infoY + 55);
            }

            // --- TABLA DE ITEMS (Y = 260) ---
            const tableY = 260;

            // Encabezados de Tabla exactos a la versión impresa
            doc.font("Helvetica-Bold")
               .fontSize(8)
               .fillColor("#475569");
            
            doc.text("CÓDIGO", 50, tableY, { width: 60 });
            doc.text("PRODUCTO", 115, tableY, { width: 150 });
            doc.text("CANT. SOLICITADA", 270, tableY, { width: 85, align: "center" });
            doc.text("CANT. RECIBIDA", 360, tableY, { width: 75, align: "center" });
            doc.text("P. UNITARIO", 440, tableY, { width: 60, align: "right" });
            doc.text("TOTAL", 505, tableY, { width: 40, align: "right" });

            // Línea divisoria bajo el encabezado
            doc.moveTo(50, tableY + 22)
               .lineTo(545, tableY + 22)
               .strokeColor("#000000")
               .lineWidth(1.5)
               .stroke();

            // Renderizar filas de ítems
            let currentY = tableY + 30;
            const itemRowHeight = 26;

            const formatCurrency = (val: number) => {
                return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const items = order.items || [];
            items.forEach((item: any) => {
                // Agregar página si sobrepasa el límite
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;

                    // Dibujar encabezados en la nueva página
                    doc.font("Helvetica-Bold")
                       .fontSize(8)
                       .fillColor("#475569");
                    
                    doc.text("CÓDIGO", 50, currentY, { width: 60 });
                    doc.text("PRODUCTO", 115, currentY, { width: 150 });
                    doc.text("CANT. SOLICITADA", 270, currentY, { width: 85, align: "center" });
                    doc.text("CANT. RECIBIDA", 360, currentY, { width: 75, align: "center" });
                    doc.text("P. UNITARIO", 440, currentY, { width: 60, align: "right" });
                    doc.text("TOTAL", 505, currentY, { width: 40, align: "right" });

                    doc.moveTo(50, currentY + 22)
                       .lineTo(545, currentY + 22)
                       .strokeColor("#000000")
                       .lineWidth(1.5)
                       .stroke();

                    currentY += 30;
                }

                const barcode = item.product?.barcode || "S/B";
                const name = item.product?.name || "Producto sin nombre";
                const unit = item.product?.unit || "und";
                const qtyRequested = Number(item.quantity) || 0;
                const qtyReceived = Number(item.received_quantity) || 0;
                const unitPrice = Number(item.unit_price) || 0;
                const itemTotal = qtyRequested * unitPrice;

                doc.font("Helvetica")
                   .fontSize(8.5)
                   .fillColor("#64748b")
                   .text(barcode, 50, currentY, { width: 60, ellipsis: true });

                doc.font("Helvetica-Bold")
                   .fillColor("#0f172a")
                   .text(name, 115, currentY, { width: 145, height: 16, ellipsis: true });

                // Cant. Solicitada
                doc.font("Helvetica")
                   .fillColor("#0f172a")
                   .text(`${qtyRequested} ${unit}`, 270, currentY, { width: 85, align: "center" });

                // Cant. Recibida
                const receivedText = order.status === "received" ? `${qtyReceived} ${unit}` : "-";
                doc.text(receivedText, 360, currentY, { width: 75, align: "center" });

                // P. Unitario
                doc.text(formatCurrency(unitPrice), 440, currentY, { width: 60, align: "right" });

                // Total item
                doc.font("Helvetica-Bold")
                   .fillColor("#2563eb")
                   .text(formatCurrency(itemTotal), 505, currentY, { width: 40, align: "right" });

                // Línea divisoria bajo cada ítem
                doc.moveTo(50, currentY + 18)
                   .lineTo(545, currentY + 18)
                   .strokeColor("#cbd5e1")
                   .lineWidth(0.5)
                   .stroke();

                currentY += itemRowHeight;
            });

            // --- BLOQUE DE TOTALES ---
            currentY += 10;
            
            // Línea superior discontinua de totales
            doc.moveTo(350, currentY)
               .lineTo(545, currentY)
               .strokeColor("#cbd5e1")
               .lineWidth(1)
               .dash(4, { space: 2 })
               .stroke();

            currentY += 15;

            doc.font("Helvetica-Bold")
               .fontSize(9.5)
               .fillColor("#0f172a")
               .text("TOTAL ESTIMADO:", 300, currentY, { width: 140, align: "right" });

            const totalAmount = Number(order.total_amount_usd) || 0;
            doc.fontSize(11.5)
               .fillColor("#10b981")
               .text(formatCurrency(totalAmount), 445, currentY - 1, { width: 100, align: "right" });

            currentY += 35;

            // Quitar línea discontinua de dibujo para futuros trazos
            doc.undash();

            // --- OBSERVACIONES ---
            if (order.notes) {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }

                doc.font("Helvetica-Bold")
                   .fontSize(8.5)
                   .fillColor("#64748b")
                   .text("INSTRUCCIONES ESPECIALES Y OBSERVACIONES", 50, currentY);

                doc.font("Helvetica-Oblique")
                   .fontSize(8.5)
                   .fillColor("#475569")
                   .text(order.notes, 50, currentY + 14, { width: 495, lineGap: 3 });
            }

            // --- PIE DE PÁGINA ---
            doc.font("Helvetica")
               .fontSize(8)
               .fillColor("#94a3b8")
               .text("Este documento es una orden de compra mercantil formal emitida por nuestra institución.", 50, 755, { align: "center", width: 495 })
               .text("Desarrollado y Gestionado por Vetinet Elite.", 50, 768, { align: "center", width: 495 });

            // Finalizar PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera un Buffer de PDF para el reporte de Reposición Inteligente (Alerta de Stock).
 */
export function generateStockAlertPDF(clinicName: string, items: Array<{ name: string; currentStock: number; minStock: number; unit: string }>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const buffers: Buffer[] = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            // --- ENCABEZADO ---
            const logoPath = path.join(process.cwd(), "public/icono.png");
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 45 });
                doc.font("Helvetica-Bold")
                   .fontSize(6.5)
                   .fillColor("#059669")
                   .text("VETINET", 50, 93, { width: 45, align: "center" });
            }

            doc.font("Helvetica-Bold")
               .fontSize(14)
               .fillColor("#0f172a")
               .text(clinicName.toUpperCase(), 110, 52, { width: 220 });

            doc.font("Helvetica")
               .fontSize(9)
               .fillColor("#64748b")
               .text("Reporte Automático de Inteligencia Logística", 110, 70, { width: 220 });

            doc.font("Helvetica-Bold")
               .fontSize(12)
               .fillColor("#dc2626")
               .text("REPORTE DE STOCK CRÍTICO", 330, 52, { align: "right", width: 215 });

            const formattedDate = format(new Date(), "dd/MM/yyyy h:mm a", { locale: es });
            doc.font("Helvetica")
               .fontSize(8.5)
               .fillColor("#475569")
               .text(`Generado: ${formattedDate}`, 330, 70, { align: "right", width: 215 });

            doc.moveTo(50, 115).lineTo(545, 115).strokeColor("#e2e8f0").lineWidth(1).stroke();

            // --- INTRODUCCIÓN ---
            doc.font("Helvetica")
               .fontSize(10)
               .fillColor("#0f172a")
               .text("El sistema de monitoreo continuo ha detectado que los siguientes productos han caído por debajo de su límite de seguridad o stock mínimo definido. Se sugiere iniciar el proceso de reposición a la brevedad.", 50, 135, { width: 495, lineGap: 3 });

            // --- TABLA DE ITEMS ---
            const tableY = 190;
            doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569");
            doc.text("PRODUCTO", 50, tableY, { width: 250 });
            doc.text("STOCK ACTUAL", 310, tableY, { width: 100, align: "center" });
            doc.text("STOCK MÍNIMO", 420, tableY, { width: 125, align: "center" });

            doc.moveTo(50, tableY + 20).lineTo(545, tableY + 20).strokeColor("#000000").lineWidth(1.5).stroke();

            let currentY = tableY + 30;
            items.forEach((item) => {
                // Prevenir salto de página dejando margen de seguridad en la parte inferior
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                    doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569");
                    doc.text("PRODUCTO", 50, currentY, { width: 250 });
                    doc.text("STOCK ACTUAL", 310, currentY, { width: 100, align: "center" });
                    doc.text("STOCK MÍNIMO", 420, currentY, { width: 125, align: "center" });
                    doc.moveTo(50, currentY + 20).lineTo(545, currentY + 20).strokeColor("#000000").lineWidth(1.5).stroke();
                    currentY += 30;
                }

                doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text(item.name, 50, currentY, { width: 250, ellipsis: true });
                doc.font("Helvetica-Bold").fillColor("#dc2626").text(`${item.currentStock} ${item.unit}`, 310, currentY, { width: 100, align: "center" });
                doc.font("Helvetica").fillColor("#64748b").text(`${item.minStock} ${item.unit}`, 420, currentY, { width: 125, align: "center" });

                doc.moveTo(50, currentY + 18).lineTo(545, currentY + 18).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
                currentY += 26;
            });

            // --- PIE DE PÁGINA ---
            // Y=770 evita que se pase del margen inferior y genere una página extra en blanco
            doc.font("Helvetica").fontSize(8).fillColor("#94a3b8")
               .text("Desarrollado y Gestionado por Vetinet Elite.", 50, 770, { align: "center", width: 495 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
