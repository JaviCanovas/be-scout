'use client';

import { useState } from 'react';
import { X, Save, Clock, Trash2 } from 'lucide-react';
import { NotaPrivada } from '@/types';

interface PlayerNotesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    playerName: string;
    notes: NotaPrivada[];
    onSaveNote: (content: string) => void;
    onDeleteNote: (id: string) => void;
}

export function PlayerNotesPanel({ isOpen, onClose, playerName, notes, onSaveNote, onDeleteNote }: PlayerNotesPanelProps) {
    const [newNote, setNewNote] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newNote.trim()) return;
        onSaveNote(newNote.trim());
        setNewNote('');
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md h-full bg-[#1c2025] border-l border-zinc-800 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-white">Notas Privadas</h2>
                        <p className="text-sm text-zinc-400">{playerName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {notes.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10">
                            No hay notas para este jugador.
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(note.fecha).toLocaleString('es-ES', { 
                                            day: '2-digit', month: '2-digit', year: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </div>
                                    <button 
                                        onClick={() => onDeleteNote(note.id)}
                                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar nota"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{note.contenido}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Editor */}
                <div className="p-6 border-t border-zinc-800 bg-[#1c2025]">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Escribe una nueva nota sobre el jugador..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-bescout-cyan)] resize-none min-h-[100px]"
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSave}
                            disabled={!newNote.trim()}
                            className="flex items-center gap-2 bg-[var(--color-bescout-cyan)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-bescout-cyan)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Nota
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
