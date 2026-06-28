// src/pages/cetak-struk.js
import { useEffect, useState } from 'react';
import Struk, { generateTextStruk } from '../components/Struk';

export default function CetakStrukPage() {
  const [transaksiData, setTransaksiData] = useState(null);
  
  // Lebar standar kertas thermal (48 karakter cocok untuk printer 58mm/80mm umum)
  const LEBAR_PRINTER = 48; 

  useEffect(() => {
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) setTransaksiData(JSON.parse(data));
  }, []);

  const handleCetakRawBT = () => {
    if (!transaksiData) return;

    // 1. Panggil pembuat teks murni dari Struk.js
    const teksStrukMentah = generateTextStruk(transaksiData, LEBAR_PRINTER);

    // 2. Encode teks agar aman dilempar melewati URL sistem Android
    const teksEncoded = encodeURIComponent(teksStrukMentah);

    // 3. Tembak langsung ke aplikasi RawBT menggunakan parameter khusus S.text
    window.location.href = `intent:#Intent;scheme=rawbt;package=ru.a2020.rawbtprinter;S.text=${teksEncoded};end`;
  };

  return (
    <div style={{ background: '#111827', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Kotak Navigasi Cetak */}
      <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', width: '320px', textAlign: 'center', marginBottom: '20px', border: '1px solid #374151' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#f3f4f6' }}>Cetak Struk POS Nuevanesia</h4>
        
        <button 
          onClick={handleCetakRawBT} 
          disabled={!transaksiData} 
          style={{ background: '#0d9488', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}
        >
          CETAK INSTAN (RAWBT)
        </button>
        
        <button 
          onClick={() => window.close()} 
          style={{ background: '#4b5563', color: 'white', border: 'none', padding: '8px', width: '100%', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          Tutup Halaman
        </button>
      </div>

      {/* PERBAIKAN DI SINI: Menambahkan prop lebarMaksimal agar sinkron dengan Struk.js */}
      {transaksiData ? (
        <Struk transaksiData={transaksiData} lebarMaksimal={LEBAR_PRINTER} />
      ) : (
        <p style={{ color: '#9ca3af' }}>Memuat data transaksi...</p>
      )}

    </div>
  );
}