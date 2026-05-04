"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "No, Volver",
    isDestructive = false,
    isLoading = false
}: ConfirmationModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const Content = (
        <div className="p-8 text-center bg-white dark:bg-slate-900">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                isDestructive 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 shadow-red-500/10' 
                    : 'bg-primary/10 dark:bg-primary/20 text-primary shadow-primary/10'
            }`}>
                {isDestructive ? <Trash2 size={40} /> : <AlertTriangle size={40} />}
            </div>

            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 italic uppercase tracking-tight leading-none">
                {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                {description}
            </p>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95
                        ${isDestructive
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                            : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                        }`}
                >
                    {isLoading ? 'Procesando...' : confirmText}
                </button>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            {Content}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[120]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[130] focus:outline-none max-h-[96vh] border-t border-slate-200 dark:border-slate-800">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                    <Drawer.Title className="sr-only">{title}</Drawer.Title>
                    <Drawer.Description className="sr-only">{description}</Drawer.Description>
                    <div className="flex-1 overflow-y-auto pb-4">
                        {Content}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
