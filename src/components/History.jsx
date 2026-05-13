import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function History({ userId, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'absensi'),
          where('userId', '==', userId),
          limit(60)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort in memory instead of Firestore index
        docs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        setHistory(docs);
      } catch (error) {
        console.error("Firestore Error Fetching History:", JSON.stringify({
          error: error.message,
          operation: 'list',
          path: 'absensi',
          userId: userId
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, refreshTrigger]);

  if (loading) return <div className="text-center py-4 text-slate-400 text-sm">Memuat riwayat...</div>;

  if (history.length === 0) return (
    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      <p className="text-slate-400 text-sm">Belum ada riwayat absensi</p>
    </div>
  );

  const getStatusLabel = (item) => {
    if (!item.masuk) return '-';

    const masukDate = new Date(item.masuk);
    const targetMasuk = new Date(item.masuk);
    targetMasuk.setHours(8, 0, 0, 0);

    let lateMinutes = 0;
    if (masukDate > targetMasuk) {
      lateMinutes = Math.floor((masukDate - targetMasuk) / (1000 * 60));
    }

    let statusText = lateMinutes > 0 ? `Terlambat ${lateMinutes} mnt` : 'Tepat Waktu';

    if (item.pulang) {
      const pulangDate = new Date(item.pulang);
      const targetPulang = new Date(item.masuk); // Base target on the same day's masuk date
      targetPulang.setHours(20, 0, 0, 0);
      
      // Add compensation time for lateness
      const finalTargetPulang = new Date(targetPulang.getTime() + lateMinutes * 60000);

      if (pulangDate < finalTargetPulang) {
        statusText += ' & Pulang Awal';
      } else {
        statusText += ' & Selesai';
      }
    }

    return statusText;
  };

  const getStatusColor = (item) => {
    if (!item.masuk) return 'bg-slate-50 text-slate-400';
    
    const masukDate = new Date(item.masuk);
    const targetMasuk = new Date(item.masuk);
    targetMasuk.setHours(8, 0, 0, 0);
    
    if (masukDate > targetMasuk) return 'bg-amber-50 text-amber-600';
    if (item.pulang) return 'bg-green-50 text-green-600';
    return 'bg-blue-50 text-blue-600';
  };

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Masuk</th>
            <th className="px-4 py-3">Pulang</th>
            <th className="px-4 py-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {history.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 font-bold text-slate-700">
                {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-4 py-4 text-slate-600">
                {item.masuk ? new Date(item.masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </td>
              <td className="px-4 py-4 text-slate-600">
                {item.pulang ? new Date(item.pulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </td>
              <td className="px-4 py-4 text-right">
                <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${getStatusColor(item)}`}>
                  {getStatusLabel(item)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
