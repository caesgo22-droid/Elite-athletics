import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUser, getUser } from '../services/userManagement';

interface LoginProps {
    onBack: () => void;
    onSuccess: (uid: string) => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'ATHLETE' | 'STAFF' | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let userCredential;
            if (isSignUp) {
                // For signup, require role selection
                if (!selectedRole) {
                    setError('Por favor selecciona tu rol (Atleta o Staff)');
                    setLoading(false);
                    return;
                }
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }

            // Check if user exists in Firestore
            let user = await getUser(userCredential.user.uid);

            if (!user) {
                // New user, create in Firestore with selected role
                const role = selectedRole || 'ATHLETE'; // Default to ATHLETE if not set
                user = await createUser(
                    userCredential.user.uid,
                    userCredential.user.email!,
                    role,
                    userCredential.user.displayName || undefined,
                    userCredential.user.photoURL || undefined
                );
            }

            onSuccess(userCredential.user.uid);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/unauthorized-domain') {
                setError('Este dominio no está autorizado en Firebase. Por favor, añade "elite-athletics.vercel.app" a los dominios autorizados en la consola de Firebase.');
            } else {
                setError(err.message || 'Error en la autenticación');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Check if user exists in Firestore
            let user = await getUser(result.user.uid);

            if (!user) {
                // New user from Google, default to ATHLETE role
                user = await createUser(
                    result.user.uid,
                    result.user.email!,
                    'ATHLETE', // Google login defaults to ATHLETE
                    result.user.displayName || undefined,
                    result.user.photoURL || undefined
                );
            }

            onSuccess(result.user.uid);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/configuration-not-found') {
                setError('Google Login no está activado en Firebase. Por favor, actívalo en la consola de Firebase.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('Este dominio no está autorizado en Firebase. Añade "elite-athletics.vercel.app" en Authentication > Settings > Authorized domains.');
            } else {
                setError(err.message || 'Error con Google Login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen content-center bg-[#050505] relative overflow-hidden font-sans p-6">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D1F349]/10 blur-[100px] rounded-full opacity-20"></div>


            <div className="max-w-md mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className="size-24 rounded-2xl flex items-center justify-center shadow-glow-primary bg-primary">
                            <span className="material-symbols-outlined text-black text-4xl font-black">
                                lock
                            </span>
                        </div>
                    </div>

                    <div className="text-center mt-12 mb-8">
                        <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">
                            Acceso <span className="text-primary">Elite</span>
                        </h1>
                        <p className="text-slate-400 text-xs mt-1 font-medium font-mono uppercase tracking-wider">
                            {isSignUp ? 'Crea tu cuenta de alto rendimiento' : 'Bienvenido de nuevo al Nivel 5'}
                        </p>
                    </div>

                    {/* Role Selection for Sign Up */}
                    {isSignUp && !selectedRole && (
                        <div className="space-y-4">
                            <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-wider mb-6">
                                ¿Cómo quieres registrarte?
                            </p>

                            <button
                                type="button"
                                onClick={() => setSelectedRole('ATHLETE')}
                                className="w-full py-6 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all group"
                            >
                                <div className="flex items-center justify-between px-6">
                                    <div className="text-left">
                                        <div className="text-white font-black text-lg uppercase tracking-tight">Atleta</div>
                                        <div className="text-slate-400 text-xs mt-1">Acceso inmediato a tu dashboard</div>
                                    </div>
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">
                                        directions_run
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedRole('STAFF')}
                                className="w-full py-6 rounded-xl border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="flex items-center justify-between px-6">
                                    <div className="text-left">
                                        <div className="text-white font-black text-lg uppercase tracking-tight">Staff / Entrenador</div>
                                        <div className="text-slate-400 text-xs mt-1">Requiere aprobación de admin</div>
                                    </div>
                                    <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">
                                        sports
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Email/Password Form - Show for login or after role selection */}
                    {(!isSignUp || selectedRole) && (
                        <>
                            {isSignUp && selectedRole && (
                                <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">
                                                {selectedRole === 'ATHLETE' ? 'directions_run' : 'sports'}
                                            </span>
                                            <div>
                                                <div className="text-white font-bold text-sm">
                                                    {selectedRole === 'ATHLETE' ? 'Atleta' : 'Staff / Entrenador'}
                                                </div>
                                                <div className="text-slate-400 text-xs">
                                                    {selectedRole === 'ATHLETE' ? 'Acceso inmediato' : 'Requiere aprobación'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole(null)}
                                            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="atleta@elite.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-slate-700"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-slate-700"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold p-3 rounded-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                >
                                    {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Sincronizar')}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-600"><span className="bg-[#0a0a0a] px-3">O también</span></div>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar con Google
                            </button>

                            <p className="text-center mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setSelectedRole(null);
                                        setError('');
                                    }}
                                    className="ml-2 underline transition-colors text-primary hover:text-white"
                                >
                                    {isSignUp ? 'Entrar' : 'Registrarse'}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
