import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, User, Lock, AlertCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onShowRegister }) {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = `${nik.trim()}@trcbpbd.com`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login Email/Password belum diaktifkan di Firebase Console.');
      } else {
        setError('NIK atau Password salah. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 shadow-inner bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">
        <AnimatePresence>
          {showResetModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
                <Info size={32} />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Reset Kata Sandi</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Untuk menjaga keamanan data personil, reset kata sandi dilakukan secara manual melalui Bagian Administrasi / IT BPBD Kabupaten Kulon Progo.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full mb-8 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instruksi:</p>
                <p className="text-slate-700 text-sm font-bold">
                  Silakan hubungi Admin atau Petugas Piket dengan membawa NIK untuk pembaharuan akses.
                </p>
              </div>

              <button 
                onClick={() => setShowResetModal(false)}
                className="w-full bg-orange-600 text-white font-black py-4 rounded-xl active:scale-95 transition-all shadow-lg shadow-orange-600/20"
              >
                KEMBALI KE LOGIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-orange-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L50 0 L100 100 Z" fill="white" />
            </svg>
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 rotate-3 transition-transform hover:rotate-0">
               <LogIn className="text-white w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">
            Absensi TRC<br />BPBD KULON PROGO
          </h2>
          <div className="mt-4 inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Silakan Masuk</p>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start space-x-3 rounded-r-md">
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">NIK Personal</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600">
                <User size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                autoComplete="username"
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none text-slate-800 font-bold placeholder-slate-300"
                placeholder="000XXX000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Kata Sandi</label>
              <button 
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[10px] font-bold text-orange-600 hover:underline"
              >
                LUPA?
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none text-slate-800 font-bold placeholder-slate-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-orange-600/30 active:transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="tracking-widest">MASUK</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="p-8 bg-slate-50 text-center border-t border-slate-100 flex flex-col space-y-4">
          <p className="text-slate-500 text-xs font-bold">
            Belum punya akun?{' '}
            <button 
              onClick={onShowRegister}
              className="text-orange-600 font-black hover:underline underline-offset-4"
            >
              DAFTAR SEKARANG
            </button>
          </p>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Tim Reaksi Cepat (TRC)<br />Kabupaten Kulon Progo<br />Dikembangkan oleh Adi Agus Prihartanto,S.Kom
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
