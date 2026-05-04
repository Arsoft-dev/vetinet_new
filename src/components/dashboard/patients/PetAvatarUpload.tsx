"use client";

import { Camera, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";

interface PetAvatarUploadProps {
    currentUrl?: string | null;
    species: string;
}

export function PetAvatarUpload({ currentUrl, species }: PetAvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        }
    };

    const defaultEmoji = species === "Gato" ? "🐱" : "🐶";

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer group"
                onClick={() => inputRef.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-4xl">{defaultEmoji}</span>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                </div>
            </div>

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-bold text-primary hover:underline"
            >
                Cambiar Foto
            </button>

            <input
                ref={inputRef}
                type="file"
                name="avatarFile"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
