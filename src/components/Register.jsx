import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserPlus, User, Lock, AlertCircle, ArrowLeft, BadgeCheck } from 'lucide-react';

export default function Register({ onBackToLogin }) {
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (nik.length < 5) {
      setError('NIK harus minimal 5 digit.');
      return;
    }
    if (name.length < 3) {
      setError('Nama harus minimal 3 karakter.');
      return;
    }
    if (password.length < 6) {
      setError('Password harus minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const email = `${nik.trim()}@trcbpbd.com`;
      
      // 1. Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Set Display Name in Auth
      await updateProfile(user, { displayName: name });

      // 3. Create Firestore Profile Document & NIK Lookup atomically
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        nik: nik.trim(),
        name: name.trim(),
        role: 'Staff TRC',
        createdAt: serverTimestamp()
      });

      const nikLookupRef = doc(db, 'nik_lookup', nik.trim());
      batch.set(nikLookupRef, {
        uid: user.uid
      });

      await batch.commit();

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('NIK ini sudah terdaftar.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Registrasi Email/Password belum diaktifkan di Firebase Console.');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-800 p-6 text-center relative">
          <button 
            onClick={onBackToLogin}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <UserPlus className="text-white w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Daftar Akun Baru</h2>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start space-x-3 rounded-r-md">
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">NIK (ID Anggota)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                <BadgeCheck size={18} />
              </div>
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 transition-all font-medium"
                placeholder="Contoh: 12345678"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 transition-all font-medium"
                placeholder="Nama sesuai SK"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 transition-all font-medium"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-800/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>DAFTAR SEKARANG</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-slate-500 text-sm">
            Sudah punya akun?{' '}
            <button 
              onClick={onBackToLogin}
              className="text-blue-700 font-bold hover:underline"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
