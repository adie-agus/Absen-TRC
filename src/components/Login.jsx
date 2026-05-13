import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

export default function Login({ onShowRegister }) {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Automatis NIK diubah menjadi email format: NIK@trcbpbd.com
      const email = `${nik.trim()}@trcbpbd.com`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login Email/Password belum diaktifkan di Firebase Console. Silakan hubungi admin.');
      } else {
        setError('NIK atau Password salah. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 shadow-inner bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-800 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">ABSENSI TRC<br />BPBD KP</h2>
          <p className="text-blue-100 mt-2 text-sm uppercase tracking-wider">Silakan Masuk</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start space-x-3 rounded-r-md">
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block ml-1">NIK</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <User size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                autoComplete="username"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                placeholder="Masukkan NIK"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-800/20 active:transform active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>MASUK</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100 flex flex-col space-y-4">
          <p className="text-slate-500 text-sm">
            Belum punya akun?{' '}
            <button 
              onClick={onShowRegister}
              className="text-blue-700 font-bold hover:underline"
            >
              Daftar di sini
            </button>
          </p>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-tight">Tim Reaksi Cepat BPBD Kabupaten Kulonprogo</p>
        </div>
      </div>
    </div>
  );
}
