import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
    onScan: (barcode: string) => void;
    enabled?: boolean;
}

/**
 * Hook personalizado para detectar pulsaciones rápidas provenientes de un lector físico
 * de códigos de barras (pistola escáner) en el navegador.
 */
export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScannerOptions) {
    const bufferRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            
            // Detectar si el foco está en un input de texto convencional
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
            
            // Permitir captura si el elemento tiene la directiva data-barcode-capture
            const isBarcodeCaptureInput = target.getAttribute && target.getAttribute("data-barcode-capture") === "true";

            // Si es un input ordinario (como notas de auditoría o buscador), silenciamos la lectura global
            if (isInput && !isBarcodeCaptureInput) {
                return;
            }

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // La tecla Enter finaliza la ráfaga de caracteres de la lectora
            if (e.key === "Enter") {
                const finalBarcode = bufferRef.current.trim();
                
                // Un código de barras válido suele tener al menos 4 caracteres
                if (finalBarcode.length >= 4) {
                    e.preventDefault();
                    e.stopPropagation();
                    onScan(finalBarcode);
                }
                bufferRef.current = "";
                return;
            }

            // Ignorar teclas de control especiales
            if (e.key.length > 1) {
                return;
            }

            // Umbral de velocidad: si pasan más de 50ms entre caracteres, consideramos que es tecleo manual
            // y limpiamos el acumulador de ráfagas
            if (timeDiff > 50 && bufferRef.current.length > 0) {
                bufferRef.current = "";
            }

            bufferRef.current += e.key;
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onScan, enabled]);
}
