import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Clock, MapPin, CheckCircle, ArrowRightLeft, Calendar, X, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import History from './History';
import ExportMenu from './ExportMenu';

const MASUK_QUOTES = [
  "Semangat kerjanya! Ingat, cicilan tidak akan lunas kalau cuma rebahan.",
  "Pagi yang cerah untuk jiwa yang butuh rupiah. Yok gas!",
  "Kerja keraslah sampai tetanggamu mengira kamu pelihara tuyul.",
  "Berangkat dengan doa, pulang dengan lega. Jangan lupa sarapan!",
  "Jangan pernah menyerah. Karena yang menyerah cuma pasrah, yang pasrah biasanya kalah.",
  "Bangun! Kasurmu tidak akan memberimu uang, kecuali kamu jualan kasur.",
  "Selamat pagi pejuang rupiah! Ingat, bosmu mau beli mobil baru, jadi kerjalah yang rajin.",
  "Presensi dulu, ngantuknya ditaruh di laci saja.",
  "Mata sepet, dompet mepet, yok berangkat!",
  "Kerja itu ibadah, tapi kalau gajian itu anugerah yang sangat indah.",
  "Senyum dong! Meskipun hati menangis melihat sisa saldo di pagi hari.",
  "Ingat tujuan awal: Kerja cari uang, bukan cari jodoh yang sudah jadi milik orang.",
  "Rejeki itu kayak antrian, kalau nggak sabar ya nggak bakalan dapet.",
  "Masuk pagi, pulang sore, badan capek, dompet... ah sudahlah.",
  "Jadilah pegawai teladan, minimal teladan dalam hal absen tepat waktu."
];

const PULANG_QUOTES = [
  "Selamat pulang! Rehat dulu, besok kita cari masalah (kerjaan) lagi.",
  "Hati-hati di jalan. Kasur sudah merindukanmu lebih dari mantan.",
  "Selamat istirahat. Otak butuh recharge, dompet butuh isi ulang.",
  "Pulanglah with pride, meskipun saldo ATM sisa lima ribu saja.",
  "Jangan lupa bahagia. Kalau lupa, ya coba diingat-ingat lagi pas mandi.",
  "Hore pulang! Cepat kabur sebelum bos ingat ada kerjaan tambahan.",
  "Selamat kembali ke peradaban. Jangan lupa mandi, bau matahari itu nyata.",
  "Misi selesai! Sekarang waktunya jadi beban keluarga di rumah.",
  "Istirahatlah, besok masih ada cicilan yang menunggumu dengan setia.",
  "Terima kasih sudah bertahan hari ini. Anda layak mendapatkan paket mie instan.",
  "Pulanglah! Anak istrimu rindu, atau minimal kasurmu rindu berat.",
  "Jangan pikirkan kerjaan di jalan, nanti malah nyeruduk tukang bakso.",
  "Otw kasur! Kecepatan penuh, mode hemat energi diaktifkan.",
  "Hari ini luar biasa, tapi kasur tetaplah juara dunia.",
  "Selamat bobo lucu. Besok jangan telat lagi ya!"
];

export default function Dashboard({ user }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', quote: '', type: '' });

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch or create user profile
  useEffect(() => {
    // Connection check moved to a simpler check if needed
  }, [user]);

  // Fetch today's record
  const fetchTodayRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docId = `${user.uid}_${today}`;
      const docRef = doc(db, 'absensi', docId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        setTodayRecord({ id: snap.id, ...snap.data() });
      } else {
        setTodayRecord(null);
      }
    } catch (error) {
      console.error("Firestore Error Fetching Record:", JSON.stringify({
        error: error.message,
        operation: 'get',
        path: `absensi/${user.uid}_${new Date().toISOString().split('T')[0]}`,
        userId: user.uid
      }));
      setTodayRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [user.uid]);

  const handleAbsenMasuk = async () => {
    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const docId = `${user.uid}_${today}`;
      const newRecord = {
        userId: user.uid,
        date: today,
        masuk: new Date().toISOString(),
        pulang: null,
        status: 'hadir',
        timestamp: serverTimestamp()
      };
      await setDoc(doc(db, 'absensi', docId), newRecord);
      
      const randomQuote = MASUK_QUOTES[Math.floor(Math.random() * MASUK_QUOTES.length)];
      setModalData({ title: 'Presensi Masuk Berhasil!', quote: randomQuote, type: 'masuk' });
      setShowModal(true);
      
      await fetchTodayRecord();
    } catch (error) {
      console.error("Error clocking in:", error);
      alert("Gagal absen masuk. Pastikan NIK Anda sudah terdaftar atau coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbsenPulang = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      const attendanceRef = doc(db, 'absensi', todayRecord.id);
      await updateDoc(attendanceRef, {
        pulang: new Date().toISOString(),
        status: 'pulang'
      });
      
      const randomQuote = PULANG_QUOTES[Math.floor(Math.random() * PULANG_QUOTES.length)];
      setModalData({ title: 'Presensi Pulang Berhasil!', quote: randomQuote, type: 'pulang' });
      setShowModal(true);

      await fetchTodayRecord();
    } catch (error) {
      console.error("Error clocking out:", error);
      alert("Gagal absen pulang. Silakan coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-pulse text-slate-400">Memuat data...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex items-end justify-between px-2">
        <div>
          <p className="text-slate-500 text-sm font-medium">Selamat Datang,</p>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.displayName || 'Anggota TRC'}</h2>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
          todayRecord ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {todayRecord ? 'Sudah Absen' : 'Belum Absen'}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                modalData.type === 'masuk' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {modalData.type === 'masuk' ? <CheckCircle size={40} /> : <Smile size={40} />}
              </div>
              
              <h3 className={`text-xl font-black mb-4 ${
                modalData.type === 'masuk' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {modalData.title}
              </h3>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <p className="text-slate-700 font-medium italic leading-relaxed text-sm">
                  "{modalData.quote}"
                </p>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg ${
                  modalData.type === 'masuk' ? 'bg-green-600 shadow-green-600/20' : 'bg-blue-600 shadow-blue-600/20'
                }`}
              >
                OK!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Real-time Clock Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="p-3 bg-blue-50 rounded-2xl mb-4">
          <Clock className="text-blue-600 w-8 h-8" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{formatTime(currentTime)}</h2>
        <p className="text-slate-500 font-medium mt-2">{formatDate(currentTime)}</p>
      </div>

      {/* Attendance Status & Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2 mb-6">
          <CheckCircle className="text-green-500 w-5 h-5" />
          <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Status Hari Ini</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Absen Masuk</p>
            <p className="text-xl font-black text-slate-700">
              {todayRecord?.masuk ? new Date(todayRecord.masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Absen Pulang</p>
            <p className="text-xl font-black text-slate-700">
              {todayRecord?.pulang ? new Date(todayRecord.pulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAbsenMasuk}
            disabled={!!todayRecord || actionLoading}
            className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl font-bold transition-all active:scale-95 ${
              todayRecord 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
            }`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span>ABSEN MASUK</span>
          </button>

          <button
            onClick={handleAbsenPulang}
            disabled={!todayRecord || !!todayRecord.pulang || actionLoading}
            className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl font-bold transition-all active:scale-95 ${
              (!todayRecord || todayRecord.pulang)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20'
            }`}
          >
            <ArrowRightLeft className="w-5 h-5 rotate-180" />
            <span>ABSEN PULANG</span>
          </button>
        </div>
      </div>

      {/* History Component */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="text-blue-500 w-5 h-5" />
            <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Riwayat 60 Hari Terakhir</h3>
          </div>
          <ExportMenu userId={user.uid} userName={user.displayName || 'Anggota TRC'} />
        </div>
        <History userId={user.uid} refreshTrigger={todayRecord} />
      </div>
    </div>
  );
}
