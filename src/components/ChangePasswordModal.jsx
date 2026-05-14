import React, { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ShieldCheck, X, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // We need to re-authenticate for sensitive operations
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('Password lama salah.');
      } else {
        setError('Gagal memperbarui password. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <KeyRound size={20} />
            </div>
            <h2 className="font-black uppercase tracking-tight">Ganti Password</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Berhasil Diperbarui!</h3>
              <p className="text-slate-500 text-sm">Password Anda telah berhasil diganti.</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start space-x-3 rounded-r-xl">
                  <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Lama</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-orange-600">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none text-slate-800 font-bold placeholder-slate-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-orange-600">
                    <ShieldCheck size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none text-slate-800 font-bold placeholder-slate-200"
                    placeholder="Minimal 6 Karakter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-orange-600">
                    <ShieldCheck size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none text-slate-800 font-bold placeholder-slate-200"
                    placeholder="Ulangi Password Baru"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-600/20 active:transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="tracking-widest">PERBARUI PASSWORD</span>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
