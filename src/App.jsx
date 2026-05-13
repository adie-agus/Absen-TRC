/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AnimatePresence mode="wait">
        {!user ? (
          showRegister ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Register onBackToLogin={() => setShowRegister(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Login onShowRegister={() => setShowRegister(true)} />
            </motion.div>
          )
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <header className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-lg md:text-xl">ABSENSI TRC BPBD KP</h1>
                  <p className="text-xs opacity-80">{user.displayName || user.email?.split('@')[0]}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                  aria-label="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </header>
            <main className="max-w-4xl mx-auto p-4 md:p-6">
              <Dashboard user={user} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

