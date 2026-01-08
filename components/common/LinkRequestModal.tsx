import React, { useState } from 'react';
import { DataRing } from '../../services/CoreArchitecture';

interface LinkRequestModalProps {
    onClose: () => void;
    currentUserId: string;
    currentUserRole: 'STAFF' | 'ATHLETE';
}

const LinkRequestModal: React.FC<LinkRequestModalProps> = ({ onClose, currentUserId, currentUserRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);

    // Mock Search Function (Replace with Firebase Callable Function 'searchUsers')
    const handleSearch = async () => {
        if (!searchTerm.includes('@') && searchTerm.length < 3) return;
        setSearching(true);

        // Simulate network delay
        setTimeout(() => {
            // Mock results based on search term
            // In production, this would call cloud function `searchUsers({ query: searchTerm })`
            const mockDb = [
                { uid: 'mock1', email: 'athlete@elite.com', name: 'Juan Pérez', role: 'ATHLETE' },
                { uid: 'mock2', email: 'coach@elite.com', name: 'Coach Carlos', role: 'STAFF' },
                { uid: 'mock3', email: 'physio@elite.com', name: 'Dra. Ana', role: 'STAFF' }
            ];

            const results = mockDb.filter(u =>
                u.email.includes(searchTerm) || u.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Filter out self
            setSearchResults(results.filter(u => u.uid !== currentUserId));
            setSearching(false);
        }, 800);
    };

    const sendRequest = async (targetUser: any) => {
        setSending(true);
        try {
            await DataRing.ingestData('UI_MODAL', 'LINK_REQUEST', {
                action: 'SEND_LINK_REQUEST',
                request: {
                    id: crypto.randomUUID(),
                    fromUserId: currentUserId,
                    fromEmail: 'current@user.com', // Should be fetched from auth context
                    fromName: 'Yo',               // Should be fetched from auth context
                    fromRole: currentUserRole === 'STAFF' ? 'COACH' : 'ATHLETE',
                    toUserId: targetUser.uid,
                    toEmail: targetUser.email,
                    direction: currentUserRole === 'STAFF' ? 'COACH_TO_ATHLETE' : 'ATHLETE_TO_COACH',
                    status: 'PENDING',
                    timestamp: new Date().toISOString()
                }
            });
            alert(`Solicitud enviada a ${targetUser.name}`);
            setSearchResults(prev => prev.filter(p => p.uid !== targetUser.uid)); // Remove from list
        } catch (error) {
            console.error(error);
            alert('Error al enviar solicitud');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white uppercase italic">
                        {currentUserRole === 'STAFF' ? 'Invitar Atleta' : 'Conectar con Coach'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <span className="absolute left-3 top-3 text-slate-500 material-symbols-outlined">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por email o nombre..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-volt/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="absolute right-2 top-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-all"
                        >
                            {searching ? '...' : 'Buscar'}
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {searchResults.length === 0 && !searching && searchTerm && (
                            <p className="text-center text-slate-500 py-4">No se encontraron usuarios.</p>
                        )}

                        {searchResults.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                        <span className="text-white font-bold">{user.name[0]}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{user.name}</h3>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                        <span className="text-[10px] uppercase tracking-wider text-volt">{user.role}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => sendRequest(user)}
                                    disabled={sending}
                                    className="size-8 rounded-full bg-volt text-black flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkRequestModal;
