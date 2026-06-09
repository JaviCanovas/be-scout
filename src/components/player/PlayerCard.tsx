'use client';

import { useState, useRef } from 'react';
import { Jugador } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { EloIndicator } from '@/components/ui/EloIndicator';
import { formatCurrency } from '@/lib/utils';
import { 
    Star, 
    FileText, 
    Upload, 
    Trash2, 
    ClipboardList, 
    Eye, 
    Camera,
    Loader2,
    Play
} from 'lucide-react';
import Link from 'next/link';

interface PlayerCardProps {
    player: Jugador;
    onToggleFollow: (id: string, currentlyFollowed: boolean) => void;
    onOpenNotes: (player: Jugador) => void;
    onUpdateRating: (id: string, rating: number) => Promise<void>;
    onUploadImage: (id: string, base64: string) => Promise<void>;
    onUploadPdf: (id: string, base64: string) => Promise<void>;
    onDeletePdf: (id: string) => Promise<void>;
    onUpdateVideoUrl: (id: string, url: string | null) => Promise<void>;
}

export function PlayerCard({
    player,
    onToggleFollow,
    onOpenNotes,
    onUpdateRating,
    onUploadImage,
    onUploadPdf,
    onDeletePdf,
    onUpdateVideoUrl
}: PlayerCardProps) {
    const [ratingLoading, setRatingLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    
    const [videoUrlInput, setVideoUrlInput] = useState('');
    const [showVideoModal, setShowVideoModal] = useState(false);
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no debe superar los 2MB.');
            return;
        }

        setImageLoading(true);
        try {
            const base64 = await fileToBase64(file);
            await onUploadImage(player.id_jugador, base64);
        } catch (error) {
            console.error('Error al subir imagen:', error);
            alert('Error al procesar la imagen.');
        } finally {
            setImageLoading(false);
        }
    };

    const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Por favor, selecciona un archivo PDF válido.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('El PDF no debe superar los 5MB.');
            return;
        }

        setPdfLoading(true);
        try {
            const base64 = await fileToBase64(file);
            await onUploadPdf(player.id_jugador, base64);
        } catch (error) {
            console.error('Error al subir PDF:', error);
            alert('Error al procesar el PDF.');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleRatingClick = async (star: number) => {
        if (ratingLoading) return;
        setRatingLoading(true);
        try {
            const newRating = player.valoracion_estrellas === star ? 0 : star; // Toggle off if clicked same
            await onUpdateRating(player.id_jugador, newRating);
        } catch (error) {
            console.error('Error al actualizar valoración:', error);
        } finally {
            setRatingLoading(false);
        }
    };

    const handleDeletePdfClick = async () => {
        if (pdfLoading) return;
        if (!confirm('¿Estás seguro de que quieres eliminar el informe PDF?')) return;
        
        setPdfLoading(true);
        try {
            await onDeletePdf(player.id_jugador);
        } catch (error) {
            console.error('Error al eliminar PDF:', error);
        } finally {
            setPdfLoading(false);
        }
    };

    // Helper to open PDF base64 in new window/tab
    const openPdf = () => {
        if (!player.informe_pdf_url) return;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(
                `<iframe src="${player.informe_pdf_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
            );
        }
    };

    const getYouTubeId = (url: string | null | undefined) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleSaveVideo = async () => {
        if (!videoUrlInput.trim()) return;
        setVideoLoading(true);
        try {
            await onUpdateVideoUrl(player.id_jugador, videoUrlInput.trim());
            setVideoUrlInput('');
        } catch (error) {
            console.error('Error al guardar video:', error);
        } finally {
            setVideoLoading(false);
        }
    };

    const handleDeleteVideo = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar el video de la videoteca?')) return;
        setVideoLoading(true);
        try {
            await onUpdateVideoUrl(player.id_jugador, null);
        } catch (error) {
            console.error('Error al eliminar video:', error);
        } finally {
            setVideoLoading(false);
        }
    };

    return (
        <div className="bg-[#1c2025] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col group relative">
            
            {/* Top Image & Overlays */}
            <div className="relative h-48 w-full bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800">
                <SafeImage 
                    src={player.imagen_url} 
                    fallbackType="player" 
                    alt={player.nombre_corto} 
                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c2025] via-transparent to-black/40 pointer-events-none" />

                {/* Follow star button top-left */}
                <button
                    onClick={() => onToggleFollow(player.id_jugador, !!player.es_seguido)}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center text-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                    title="Dejar de seguir"
                >
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                </button>

                {/* ELO badge top-right */}
                <div className="absolute top-3 right-3 shadow-md">
                    <EloIndicator elo={player.puntuacion_elo} size="sm" />
                </div>

                {/* Image upload trigger button overlay */}
                <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageLoading}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:pointer-events-none"
                    title="Subir foto del jugador"
                >
                    {imageLoading ? (
                        <Loader2 className="w-8 h-8 text-[var(--color-bescout-cyan)] animate-spin" />
                    ) : (
                        <>
                            <Camera className="w-8 h-8 text-zinc-300 mb-1" />
                            <span className="text-xs text-zinc-300 font-medium">Cambiar Foto</span>
                        </>
                    )}
                </button>
                <input 
                    type="file" 
                    ref={imageInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Content body */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                
                {/* Header info */}
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <Link href={`/player/${player.id_jugador}`} className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-white hover:text-[var(--color-bescout-cyan)] transition-colors truncate tracking-tight">
                                {player.nombre_completo}
                            </h3>
                            <p className="text-xs text-zinc-500 truncate">{player.nombre_corto}</p>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={player.posicion.toLowerCase() as any} dot>{player.posicion}</Badge>
                        <span className="text-xs text-zinc-400 font-semibold">{player.biometria.edad} años</span>
                        {player.es_sub23 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[var(--color-bescout-cyan)]/20 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/30 tracking-wide">
                                SUB-23
                            </span>
                        )}
                    </div>
                </div>

                {/* Club & Market details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/40">
                    <div>
                        <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">Club</span>
                        <span className="text-zinc-300 font-medium truncate block mt-0.5">{player.club_actual || '-'}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">Valor</span>
                        <span className="text-white font-bold block mt-0.5">{formatCurrency(player.contrato.valor_mercado)}</span>
                    </div>
                </div>

                {/* Star rating component */}
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Valoración:</span>
                    <div className="flex items-center gap-0.5">
                        {ratingLoading ? (
                            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin mr-2" />
                        ) : null}
                        {[1, 2, 3, 4, 5].map((star) => {
                            const active = (player.valoracion_estrellas ?? 0) >= star;
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingClick(star)}
                                    className="text-zinc-700 hover:text-yellow-500 hover:scale-120 transition-all cursor-pointer p-0.5 disabled:opacity-50"
                                    disabled={ratingLoading}
                                >
                                    <Star className={`w-4 h-4 ${active ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-800/60 my-1" />

                {/* File / PDF Report Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 uppercase tracking-wider">Informe PDF:</span>
                        {player.informe_pdf_url ? (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Adjunto
                            </span>
                        ) : (
                            <span className="text-zinc-600 font-medium">Sin adjunto</span>
                        )}
                    </div>

                    {player.informe_pdf_url ? (
                        <div className="flex items-center gap-1.5 w-full">
                            <button
                                onClick={openPdf}
                                className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-bescout-cyan)]/10 hover:bg-[var(--color-bescout-cyan)]/25 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/20 hover:border-[var(--color-bescout-cyan)]/35 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Informe
                            </button>
                            <button
                                onClick={handleDeletePdfClick}
                                disabled={pdfLoading}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                title="Eliminar informe PDF"
                            >
                                {pdfLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => pdfInputRef.current?.click()}
                                disabled={pdfLoading}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                                {pdfLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5" />
                                        Subir Informe PDF
                                    </>
                                )}
                            </button>
                            <input 
                                type="file" 
                                ref={pdfInputRef} 
                                onChange={handlePdfChange} 
                                accept="application/pdf" 
                                className="hidden" 
                            />
                        </div>
                    )}
                </div>

                {/* Videoteca Section */}
                <div className="border-t border-zinc-800/60 my-1 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 uppercase tracking-wider font-semibold">Videoteca:</span>
                        {player.video_url ? (
                            <span className="text-red-500 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Video
                            </span>
                        ) : (
                            <span className="text-zinc-650">Sin video</span>
                        )}
                    </div>

                    {player.video_url ? (
                        (() => {
                            const ytId = getYouTubeId(player.video_url);
                            return (
                                <div className="flex flex-col gap-2">
                                    {ytId ? (
                                        <div 
                                            onClick={() => setShowVideoModal(true)}
                                            className="relative w-full h-24 rounded-lg bg-zinc-950 border border-zinc-800/80 overflow-hidden group/video cursor-pointer"
                                            title="Reproducir video"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} 
                                                alt="YouTube Video Thumbnail"
                                                className="w-full h-full object-cover opacity-60 group-hover/video:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/45 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-red-650 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform duration-200">
                                                    <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <a 
                                            href={player.video_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-[var(--color-bescout-cyan)] hover:underline truncate block p-2 bg-zinc-950 rounded border border-zinc-900"
                                        >
                                            {player.video_url}
                                        </a>
                                    )}

                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setShowVideoModal(true)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer text-zinc-300 hover:text-white"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            Reproducir
                                        </button>
                                        <button
                                            onClick={handleDeleteVideo}
                                            disabled={videoLoading}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                            title="Eliminar enlace de video"
                                        >
                                            {videoLoading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                value={videoUrlInput}
                                onChange={(e) => setVideoUrlInput(e.target.value)}
                                placeholder="Pegar URL de YouTube"
                                className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                            />
                            <button
                                onClick={handleSaveVideo}
                                disabled={videoLoading || !videoUrlInput.trim()}
                                className="bg-zinc-900 hover:bg-zinc-800 text-[var(--color-bescout-cyan)] hover:text-white border border-zinc-850 hover:border-zinc-750 px-2.5 py-1 rounded transition-all cursor-pointer disabled:opacity-50 font-bold text-xs"
                                title="Guardar Video"
                            >
                                {videoLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    "Guardar"
                                )}
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Panel Actions (Notes) */}
            <div className="px-5 py-3.5 bg-zinc-900/60 border-t border-zinc-800/40 flex items-center justify-between">
                <button
                    onClick={() => onOpenNotes(player)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[var(--color-bescout-cyan)] transition-colors font-medium cursor-pointer"
                >
                    <ClipboardList className="w-4 h-4" />
                    Notas privadas
                    {player.notas_privadas && player.notas_privadas.length > 0 && (
                        <span className="bg-[var(--color-bescout-cyan)] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                            {player.notas_privadas.length}
                        </span>
                    )}
                </button>
                
                <Link
                    href={`/player/${player.id_jugador}`}
                    className="text-xs text-zinc-500 hover:text-white transition-colors font-semibold"
                >
                    Ficha completa &rarr;
                </Link>
            </div>

            {/* YouTube Video Modal Overlay */}
            {showVideoModal && (
                (() => {
                    const ytId = getYouTubeId(player.video_url);
                    if (!ytId) return null;
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
                            <div className="relative w-full max-w-3xl bg-[#1c2025] rounded-2xl border border-zinc-850 overflow-hidden shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                                    <h3 className="font-bold text-white tracking-tight">Videoteca: {player.nombre_corto}</h3>
                                    <button 
                                        onClick={() => setShowVideoModal(false)}
                                        className="text-zinc-400 hover:text-white font-bold text-xl cursor-pointer"
                                    >
                                        &times;
                                    </button>
                                </div>
                                {/* Video Iframe */}
                                <div className="relative pb-[56.25%] h-0">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute top-0 left-0 w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}

        </div>
    );
}
