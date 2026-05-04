"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";
import { Plus, X, Calendar as CalendarIcon, Clock, User, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createAppointment, updateAppointment, deleteAppointment } from "@/actions/appointments";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface CalendarViewProps {
    initialEvents: any[];
    pets: any[];
}

export function CalendarView({ initialEvents, pets }: CalendarViewProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<{ start: string; end: string } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Map DB events to FullCalendar format
    const events = initialEvents.map(app => {
        let bgColor = '#e0f2fe'; // Light Blue (Scheduled)
        let borderColor = '#0ea5e9'; // Scientific Blue
        let textColor = '#0369a1'; // Dark Blue
        
        if (app.status === 'completed') {
            bgColor = '#dcfce7'; // Light Green
            borderColor = '#22c55e';
            textColor = '#15803d';
        } else if (app.status === 'cancelled') {
            bgColor = '#fee2e2'; // Light Red
            borderColor = '#ef4444';
            textColor = '#b91c1c';
        } else if (new Date(app.start_time) < new Date() && app.status === 'scheduled') {
            bgColor = '#fef3c7'; // Light Amber
            borderColor = '#f59e0b';
            textColor = '#b45309';
        }

        return {
            id: app.id,
            title: `${app.pet?.name || "Sin Mascota"} - ${app.reason}`,
            start: app.start_time,
            end: app.end_time,
            extendedProps: {
                petId: app.pet_id,
                reason: app.reason,
                notes: app.notes,
                status: app.status
            },
            backgroundColor: bgColor,
            borderColor: borderColor,
            textColor: textColor,
            display: 'block',
            classNames: [`status-${app.status}`, 'border-l-4 shadow-sm']
        };
    });

    const handleDateSelect = (selectInfo: any) => {
        setSelectedDate({
            start: selectInfo.startStr,
            end: selectInfo.endStr
        });
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        setSelectedEvent({
            id: clickInfo.event.id,
            title: clickInfo.event.title,
            start: clickInfo.event.startStr,
            end: clickInfo.event.endStr,
            ...clickInfo.event.extendedProps
        });
        setIsModalOpen(true);
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!selectedEvent) return;
        startTransition(async () => {
            try {
                await updateAppointment(selectedEvent.id, { status: newStatus });
                toast.success(`Cita marcada como ${newStatus === 'completed' ? 'completada' : 'cancelada'}`);
                setIsModalOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleEventDrop = async (dropInfo: any) => {
        const { event } = dropInfo;
        try {
            await updateAppointment(event.id, {
                start_time: event.startStr,
                end_time: event.endStr
            });
            toast.success("Cita reprogramada");
        } catch (error: any) {
            dropInfo.revert();
            toast.error("Error al mover cita: " + error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const petId = formData.get("petId");
        const reason = formData.get("reason");
        const notes = formData.get("notes");
        const appointmentTime = formData.get("time") as string;

        // Base date (without time)
        let baseDateStr = selectedDate?.start || selectedEvent?.start;
        if (baseDateStr && baseDateStr.includes("T")) {
            baseDateStr = baseDateStr.split("T")[0];
        }

        if (!baseDateStr || !appointmentTime) {
            toast.error("Por favor selecciona fecha y hora");
            return;
        }

        // Construct Start and End ISO strings
        const startDateTime = new Date(`${baseDateStr}T${appointmentTime}`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

        const data = {
            pet_id: petId,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            reason,
            notes,
        };

        startTransition(async () => {
            try {
                if (selectedEvent) {
                    await updateAppointment(selectedEvent.id, {
                        ...data,
                        status: selectedEvent.status
                    });
                    toast.success("Cita actualizada");
                } else {
                    await createAppointment(data);
                    toast.success("Cita programada con éxito");
                }
                setIsModalOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        
        startTransition(async () => {
            try {
                await deleteAppointment(selectedEvent.id);
                toast.success("Cita eliminada");
                setShowDeleteConfirm(false);
                setIsModalOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    // Helper to extract time from ISO
    const getTimeFromISO = (isoString?: string) => {
        if (!isoString) return "08:00";
        if (!isoString.includes("T")) return "08:00";
        const date = new Date(isoString);
        return date.toTimeString().slice(0, 5);
    };

    return (
        <div className="h-full relative font-sans">
            <style jsx global>{`
                .fc { 
                    --fc-border-color: #f1f5f9; 
                    --fc-button-bg-color: #3b82f6; 
                    --fc-button-border-color: #3b82f6; 
                    --fc-button-hover-bg-color: #2563eb; 
                    --fc-today-bg-color: transparent;
                }
                .dark .fc {
                    --fc-border-color: #1e293b;
                    --fc-page-bg-color: #020617;
                    --fc-neutral-bg-color: #0f172a;
                    --fc-list-event-hover-bg-color: #1e293b;
                }
                .fc .fc-toolbar-title { font-size: 1.5rem; font-weight: 900; color: #1e293b; letter-spacing: -0.04em; font-style: italic; text-transform: uppercase; }
                .dark .fc .fc-toolbar-title { color: #f8fafc !important; }
                
                .fc .fc-button { border-radius: 16px; font-weight: 800; text-transform: uppercase; padding: 0.8rem 1.4rem; border: none; font-size: 0.75rem; letter-spacing: 0.05em; transition: all 0.3s; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.1); }
                .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #0f172a; color: white; }
                .dark .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #3b82f6; color: white; }
                
                .fc .fc-col-header-cell-cushion { font-size: 0.7rem; font-weight: 900; color: #64748b; padding: 15px; text-transform: uppercase; letter-spacing: 0.1em; }
                .dark .fc .fc-col-header-cell-cushion { color: #94a3b8 !important; }
                
                .fc-daygrid-event { border-radius: 8px; padding: 6px 10px; font-size: 0.75rem; border: none !important; margin: 2px 4px; font-weight: 800; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .fc-daygrid-event:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 16px -4px rgba(0,0,0,0.2); filter: brightness(1.05); }
                
                .dark .fc-daygrid-day-number { color: #94a3b8 !important; }
                .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number { 
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white !important; 
                    border-radius: 10px; 
                    padding: 6px 10px !important; 
                    margin: 6px;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
                }
                
                .fc-list-event { border-radius: 16px; overflow: hidden; margin-bottom: 8px; border: none !important; transition: all 0.2s; }
                .fc-list-event:hover { transform: translateX(4px); }
                .dark .fc-list-event-title { color: #f1f5f9 !important; }
                .dark .fc-list-day-text, .dark .fc-list-day-side-text { color: #94a3b8 !important; }
                .dark .fc-list-day { background-color: #0f172a !important; color: #f8fafc !important; }

                /* Custom Scrollbar for Calendar */
                .fc-scroller::-webkit-scrollbar { width: 6px; }
                .fc-scroller::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .fc-scroller::-webkit-scrollbar-thumb { background: #334155; }

                @media (max-width: 768px) {
                    .fc .fc-toolbar { 
                        flex-direction: column; 
                        gap: 12px; 
                        align-items: center;
                    }
                    .fc .fc-toolbar-title { 
                        order: -1; 
                        font-size: 1.1rem; 
                        width: 100%;
                        text-align: center;
                    }
                    .fc .fc-button { 
                        padding: 0.6rem 0.8rem; 
                        font-size: 0.6rem; 
                        border-radius: 12px;
                    }
                    .fc .fc-header-toolbar {
                        margin-bottom: 1rem !important;
                    }
                }
            `}</style>
            
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth"
                }}
                locale={esLocale}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={4}
                weekends={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                height="100%"
            />

            <AnimatePresence>
                {isModalOpen && (
                    <AppointmentFormModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)}
                        selectedDate={selectedDate}
                        selectedEvent={selectedEvent}
                        pets={pets}
                        isPending={isPending}
                        handleSubmit={handleSubmit}
                        handleStatusUpdate={handleStatusUpdate}
                        handleDelete={handleDeleteClick}
                        isDesktop={isDesktop}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="¿Eliminar Cita?"
                description="Se cancelará y borrará la cita de la agenda permanentemente. Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                isDestructive={true}
                isLoading={isPending}
            />
        </div>
    );
}

function AppointmentFormModal({ 
    isOpen, 
    onClose, 
    selectedDate, 
    selectedEvent, 
    pets, 
    isPending, 
    handleSubmit, 
    handleStatusUpdate, 
    handleDelete,
    isDesktop 
}: any) {
    const getTimeFromISO = (isoString?: string) => {
        if (!isoString) return "08:00";
        if (!isoString.includes("T")) return "08:00";
        const date = new Date(isoString);
        return date.toTimeString().slice(0, 5);
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 md:p-10 md:pt-0 space-y-6 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-6 md:space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Mascota / Paciente</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <User size={20} />
                            </div>
                            <select name="petId" defaultValue={selectedEvent?.petId || ""} required className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none">
                                <option value="">Selecciona...</option>
                                {pets.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Hora Programada</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <Clock size={20} />
                            </div>
                            <input 
                                type="time" 
                                name="time" 
                                defaultValue={getTimeFromISO(selectedEvent?.start)} 
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Motivo</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <CalendarIcon size={20} />
                            </div>
                            <input name="reason" defaultValue={selectedEvent?.reason || ""} placeholder="Ej. Control Médico" required className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Notas y Observaciones</label>
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary transition-colors">
                            <MessageSquare size={20} />
                        </div>
                        <textarea name="notes" defaultValue={selectedEvent?.notes || ""} placeholder="Instrucciones especiales..." className="w-full h-full min-h-[150px] md:min-h-[200px] pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] font-medium text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-4 md:pt-6 shrink-0">
                <div className="flex gap-3 flex-1 order-2 md:order-1">
                    {selectedEvent && selectedEvent.status === 'scheduled' && (
                        <>
                            {new Date(selectedEvent.start) <= new Date() ? (
                                <>
                                    <button 
                                        type="button" 
                                        onClick={() => handleStatusUpdate('completed')}
                                        className="flex-1 py-4 md:py-5 bg-emerald-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                                    >
                                        Asistió
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        className="flex-1 py-4 md:py-5 bg-rose-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
                                    >
                                        Faltó
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex items-center justify-center p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] text-center font-black text-slate-400 uppercase tracking-widest italic">
                                    Esperando Fecha
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex gap-3 md:min-w-[320px] order-1 md:order-2">
                    {selectedEvent && (
                        <button type="button" onClick={handleDelete} className="p-4 md:p-5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-[1.2rem] md:rounded-[1.5rem] hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all">
                            <Trash2 size={24} />
                        </button>
                    )}
                    <button type="submit" disabled={isPending} className="flex-1 py-4 md:py-5 bg-primary text-white rounded-[1.2rem] md:rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                        {isPending ? "Procesando..." : selectedEvent ? "Actualizar" : "Confirmar"}
                    </button>
                </div>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-border/10 dark:border-slate-800 transition-colors">
                    <div className="p-10 pb-6 flex items-center justify-between shrink-0">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase leading-none">{selectedEvent ? "Detalles Cita" : "Nueva Cita"}</h3>
                            {selectedEvent && (
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 mt-2 border ${
                                    selectedEvent.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                                    selectedEvent.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                        selectedEvent.status === 'completed' ? 'bg-emerald-500' : 
                                        selectedEvent.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />
                                    {selectedEvent.status === 'scheduled' ? 'Confirmada' : selectedEvent.status}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[1.5rem] transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
                    </div>
                    {FormContent}
                </motion.div>
            </div>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                    <div className="px-6 pb-2">
                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">
                            {selectedEvent ? "Detalles Cita" : "Nueva Cita"}
                        </Drawer.Title>
                        <Drawer.Description className="sr-only">
                            Formulario para {selectedEvent ? "editar o ver los detalles de" : "registrar"} una cita médica.
                        </Drawer.Description>
                    </div>
                    <div className="flex-1 overflow-y-auto pb-6">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
