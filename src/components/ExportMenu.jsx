import React, { useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Download, FileText, FileImage, FileCode, X, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

export default function ExportMenu({ userId, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null); // 'pdf', 'word', 'jpg' or null

  const fetchHistoryInRange = async () => {
    if (!startDate || !endDate) {
      alert('Silakan pilih rentang tanggal.');
      return null;
    }

    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'absensi'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return records;
    } catch (error) {
      console.error("Error fetching data for export:", error);
      alert("Gagal mengambil data. Pastikan rentang tanggal benar.");
      return null;
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusText = (record) => {
    if (!record.masuk) return '-';

    const masukDate = new Date(record.masuk);
    const targetMasuk = new Date(record.masuk);
    targetMasuk.setHours(8, 0, 0, 0);

    let lateMinutes = 0;
    if (masukDate > targetMasuk) {
      lateMinutes = Math.floor((masukDate - targetMasuk) / (1000 * 60));
    }

    let statusText = lateMinutes > 0 ? `Terlambat ${lateMinutes} mnt` : 'Tepat Waktu';

    if (record.pulang) {
      const pulangDate = new Date(record.pulang);
      const targetPulang = new Date(record.masuk);
      targetPulang.setHours(20, 0, 0, 0);
      
      const finalTargetPulang = new Date(targetPulang.getTime() + lateMinutes * 60000);

      if (pulangDate < finalTargetPulang) {
        statusText += ' & Pulang Awal';
      } else {
        statusText += ' & Selesai';
      }
    }

    return statusText;
  };

  const exportPDF = async (data) => {
    console.log("Starting PDF Export...");
    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(18);
    doc.text('RIWAYAT ABSENSI TRC BPBD KP', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Nama: ${userName}`, 14, 25);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 32);

    const tableData = data.map(record => [
      formatDate(record.date),
      formatDateTime(record.masuk),
      formatDateTime(record.pulang),
      getStatusText(record)
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Tanggal', 'Masuk', 'Pulang', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    });

    console.log("Saving PDF File...");
    doc.save(`Absensi_${userName}_${startDate}_${endDate}.pdf`);
  };

  const exportWord = async (data) => {
    const tableRows = data.map(record => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(formatDate(record.date))] }),
          new TableCell({ children: [new Paragraph(formatDateTime(record.masuk))] }),
          new TableCell({ children: [new Paragraph(formatDateTime(record.pulang))] }),
          new TableCell({ children: [new Paragraph(getStatusText(record))] }),
        ],
      });
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "RIWAYAT ABSENSI TRC BPBD KP",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `Nama: ${userName}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Periode: ${startDate} s/d ${endDate}`, bold: true }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Tanggal", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Masuk", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Pulang", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Status", bold: true })] }),
                ],
              }),
              ...tableRows,
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Absensi_${userName}_${startDate}_${endDate}.docx`);
  };

  const exportJPG = async (data) => {
    // We'll create a temporary hidden container to render the data as a table then capture it
    const tempDiv = document.createElement('div');
    tempDiv.style.padding = '40px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.width = '800px';
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '-10000px';
    
    let html = `
      <div style="font-family: Arial, sans-serif; color: #333 text-align: center;">
        <h1 style="text-align: center; margin-bottom: 5px;">RIWAYAT ABSENSI TRC BPBD KP</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">Periode: ${startDate} s/d ${endDate}</p>
        
        <div style="margin-bottom: 20px;">
          <strong>Nama:</strong> ${userName}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #334155; color: white;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Tanggal</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Masuk</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Pulang</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(record => {
      html += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(record.date)}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatDateTime(record.masuk)}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatDateTime(record.pulang)}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${getStatusText(record)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: right; color: #999; font-size: 12px;">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </div>
    `;

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      // Use fixed scale for performance, otherwise high-DPI screens make this very slow
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // Good balance between quality and speed
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Slightly lower quality for much faster encoding
      const link = document.createElement('a');
      link.download = `Absensi_${userName}_${startDate}_${endDate}.jpg`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("JPG Export Error:", err);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleDownload = async (format) => {
    if (exportingFormat) return;
    
    setExportingFormat(format);
    const data = await fetchHistoryInRange();
    
    if (data && data.length > 0) {
      try {
        if (format === 'pdf') await exportPDF(data);
        if (format === 'word') await exportWord(data);
        if (format === 'jpg') await exportJPG(data);
      } catch (err) {
        console.error("Export error:", err);
        alert("Gagal melakukan export file.");
      }
    } else if (data) {
      alert("Tidak ada data absensi dalam rentang tanggal tersebut.");
    }
    setExportingFormat(null);
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/10"
      >
        <Download size={18} />
        <span>DOWNLOAD RIWAYAT</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Eksport Laporan</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest text-left">Tanggal Mulai</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest text-left">Tanggal Selesai</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={!!exportingFormat}
                  onClick={() => handleDownload('pdf')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors group disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-600 text-white p-2 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <span className="font-bold">{exportingFormat === 'pdf' ? 'Sedang memproses...' : 'Eksport PDF'}</span>
                  </div>
                  {exportingFormat === 'pdf' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>

                <button
                  disabled={!!exportingFormat}
                  onClick={() => handleDownload('word')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                      <FileCode size={20} />
                    </div>
                    <span className="font-bold">{exportingFormat === 'word' ? 'Sedang memproses...' : 'Eksport WORD'}</span>
                  </div>
                  {exportingFormat === 'word' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>

                <button
                  disabled={!!exportingFormat}
                  onClick={() => handleDownload('jpg')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors group disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-600 text-white p-2 rounded-lg">
                      <FileImage size={20} />
                    </div>
                    <span className="font-bold">{exportingFormat === 'jpg' ? 'Sedang memproses...' : 'Eksport JPG'}</span>
                  </div>
                  {exportingFormat === 'jpg' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
