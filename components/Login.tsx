import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface LoginProps {
    role: 'ATHLETE' | 'STAFF';
    onBack: () => void;
    onSuccess: (uid: string) => void;
}

const Login: React.FC<LoginProps> = ({ role, onBack, onSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let userCredential;
            if (isSignUp) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
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
                <button
                    onClick={onBack}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Volver
                </button>

                <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className={`size-24 rounded-2xl flex items-center justify-center shadow-glow-${role === 'ATHLETE' ? 'volt' : 'primary'} ${role === 'ATHLETE' ? 'bg-[#D1F349]' : 'bg-primary'}`}>
                            <span className="material-symbols-outlined text-black text-4xl font-black">
                                {role === 'ATHLETE' ? 'sprint' : 'engineering'}
                            </span>
                        </div>
                    </div>

                    <div className="text-center mt-12 mb-8">
                        <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">
                            Acceso <span className={role === 'ATHLETE' ? 'text-[#D1F349]' : 'text-primary'}>{role}</span>
                        </h1>
                        <p className="text-slate-400 text-xs mt-1 font-medium font-mono uppercase tracking-wider">
                            {isSignUp ? 'Crea tu cuenta de alto rendimiento' : 'Bienvenido de nuevo al Nivel 5'}
                        </p>
                    </div>

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
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 ${role === 'ATHLETE'
                                ? 'bg-[#D1F349] text-black hover:bg-[#c4e444] shadow-[#D1F349]/20'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                                }`}
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
                        className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4" alt="Google" />
                        Continuar con Google
                    </button>

                    <p className="text-center mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className={`ml-2 underline transition-colors ${role === 'ATHLETE' ? 'text-[#D1F349] hover:text-white' : 'text-primary hover:text-white'}`}
                        >
                            {isSignUp ? 'Entrar' : 'Registrarse'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
