import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getAllPendingUsers, getAllUsers, approveUser, rejectUser, updateUserRole } from '../services/userManagement';
import { Badge } from './common/Atomic';
import CoachAssignmentModal from './CoachAssignmentModal';
import { DataRing } from '../services/CoreArchitecture';

interface AdminPanelProps {
    currentUser: User;
    onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBack }) => {
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ATHLETE' | 'STAFF' | 'ADMIN'>('PENDING');
    const [selectedAthleteForCoaches, setSelectedAthleteForCoaches] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const [pending, all] = await Promise.all([
                getAllPendingUsers(),
                getAllUsers()
            ]);
            setPendingUsers(pending);
            setAllUsers(all);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (uid: string, role: 'ATHLETE' | 'STAFF' | 'ADMIN') => {
        try {
            await approveUser(uid, role, currentUser.uid);
            await loadUsers();
        } catch (error) {
            alert('Error al aprobar usuario');
        }
    };

    const handleReject = async (uid: string) => {
        if (!confirm('¿Estás seguro de rechazar este usuario?')) return;
        try {
            await rejectUser(uid, currentUser.uid);
            await loadUsers();
        } catch (error) {
            alert('Error al rechazar usuario');
        }
    };

    const handleRoleChange = async (uid: string, newRole: 'ATHLETE' | 'STAFF' | 'ADMIN') => {
        if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
        try {
            await updateUserRole(uid, newRole, currentUser.uid);
            await loadUsers();
        } catch (error) {
            alert('Error al cambiar rol');
        }
    };

    const filteredUsers = allUsers.filter(user => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return user.status === 'PENDING';
        if (filter === 'APPROVED') return user.status === 'APPROVED';
        return user.role === filter;
    });

    const getRoleBadgeColor = (role: User['role']) => {
        switch (role) {
            case 'ADMIN': return 'bg-danger/20 text-danger border-danger/30';
            case 'STAFF': return 'bg-primary/20 text-primary border-primary/30';
            case 'ATHLETE': return 'bg-volt/20 text-volt border-volt/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    const getStatusBadgeColor = (status: User['status']) => {
        switch (status) {
            case 'APPROVED': return 'bg-success/20 text-success border-success/30';
            case 'PENDING': return 'bg-warning/20 text-warning border-warning/30';
            case 'REJECTED': return 'bg-danger/20 text-danger border-danger/30';
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-surface shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-danger">admin_panel_settings</span>
                                Panel de Administración
                            </h1>
                            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">
                                Gestión de Usuarios y Roles
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-2">
                            <p className="text-[10px] text-warning uppercase font-bold tracking-widest">Pendientes</p>
                            <p className="text-2xl font-black text-white">{pendingUsers.length}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Usuarios</p>
                            <p className="text-2xl font-black text-white">{allUsers.length}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {[
                        { key: 'PENDING', label: 'PENDIENTES' },
                        { key: 'ALL', label: 'TODOS' },
                        { key: 'ATHLETE', label: 'ATLETAS' },
                        { key: 'STAFF', label: 'STAFF' },
                        { key: 'ADMIN', label: 'ADMIN' },
                        { key: 'APPROVED', label: 'APROBADOS' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${filter === f.key
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-slate-500">Cargando usuarios...</div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="material-symbols-outlined text-slate-700 text-6xl mb-4">person_off</span>
                        <p className="text-slate-500 font-bold">No hay usuarios en esta categoría</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map(user => (
                            <div
                                key={user.uid}
                                className="glass-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-volt/20 flex items-center justify-center border border-white/10">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-white text-2xl">person</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-white font-bold text-sm">{user.displayName || user.email}</h3>
                                                <Badge className={`text-[8px] px-2 py-0.5 border ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role === 'ATHLETE' ? 'ATLETA' : user.role === 'STAFF' ? 'STAFF' : 'ADMIN'}
                                                </Badge>
                                                <Badge className={`text-[8px] px-2 py-0.5 border ${getStatusBadgeColor(user.status)}`}>
                                                    {user.status === 'APPROVED' ? 'APROBADO' : user.status === 'PENDING' ? 'PENDIENTE' : 'RECHAZADO'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                                            <p className="text-[10px] text-slate-600 mt-1">
                                                Registrado: {new Date(user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {user.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(user.uid, 'ATHLETE')}
                                                    className="px-3 py-1.5 bg-volt/20 text-volt border border-volt/30 rounded-lg text-xs font-bold hover:bg-volt hover:text-black transition-all"
                                                >
                                                    Atleta
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(user.uid, 'STAFF')}
                                                    className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                                >
                                                    Staff
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user.uid)}
                                                    className="px-3 py-1.5 bg-danger/20 text-danger border border-danger/30 rounded-lg text-xs font-bold hover:bg-danger hover:text-white transition-all"
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}

                                        {user.status === 'APPROVED' && user.uid !== currentUser.uid && (
                                            <>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary outline-none"
                                                >
                                                    <option value="ATHLETE">Atleta</option>
                                                    <option value="STAFF">Staff</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>

                                                {/* Coach Assignment Button for Athletes */}
                                                {user.role === 'ATHLETE' && (
                                                    <button
                                                        onClick={() => setSelectedAthleteForCoaches(user.uid)}
                                                        className="px-3 py-1.5 bg-volt/20 text-volt border border-volt/30 rounded-lg text-xs font-bold hover:bg-volt hover:text-black transition-all flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">group_add</span>
                                                        Entrenadores
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Coach Assignment Modal */}
            {selectedAthleteForCoaches && (() => {
                const athlete = DataRing.getAthlete(selectedAthleteForCoaches);
                return athlete ? (
                    <CoachAssignmentModal
                        athlete={athlete}
                        onClose={() => setSelectedAthleteForCoaches(null)}
                        onSave={() => {
                            setSelectedAthleteForCoaches(null);
                            loadUsers(); // Refresh to show updated assignments
                        }}
                    />
                ) : null;
            })()}
        </div>
    );
};

export default AdminPanel;
