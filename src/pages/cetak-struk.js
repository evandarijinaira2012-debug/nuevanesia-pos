// src/pages/cetak-struk.js
import { useEffect, useState } from 'react';
import Struk, { generateTextStruk } from '../components/Struk';

export default function CetakStrukPage() {
  const [transaksiData, setTransaksiData] = useState(null);
  
  // Tentukan lebar kertas printer thermal kamu (80mm = 48, atau 58mm = 32)
  const LEBAR_PRINTER = 48; 

  useEffect(() => {
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) setTransaksiData(JSON.parse(data));
  }, []);

  const handleCetakAndroLaiYin = () => {
    if (!transaksiData) return;

    // 1. Ambil teks murni dari pabrik teks Struk.js kamu
    const teksStrukMentah = generateTextStruk(transaksiData, LEBAR_PRINTER);

    // 2. Bersihkan karakter kode kontrol biner (\x1B dll) agar teks murni tidak rusak saat diterima aplikasi Android
    const teksBersih = teksStrukMentah.replace(/[\x1B\x40\x61\x01\x00]/g, '');

    // 3. Encode teks agar aman dikirim sebagai parameter URL
    const teksEncoded = encodeURIComponent(teksBersih);

    // 4. Lemparkan teks murni ke aplikasi ESC/POS Print Service (AndroLaiYin) secara instan
    window.location.href = `intent:#Intent;scheme=text;type=text/plain;S.android.intent.extra.TEXT=${teksEncoded};end`;
  };

  return (
    <div style={{ background: '#111827', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Kotak Navigasi Cetak */}
      <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', width: '320px', textAlign: 'center', marginBottom: '20px', border: '1px solid #374151' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#f3f4f6' }}>Cetak Cetak Struk POS</h4>
        
        <button 
          onClick={handleCetakAndroLaiYin} 
          disabled={!transaksiData} 
          style={{ background: '#0d9488', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}
        >
          CETAK INSTAN (ANDROLAIYIN)
        </button>
        
        <button 
          onClick={() => window.close()} 
          style={{ background: '#4b5563', color: 'white', border: 'none', padding: '8px', width: '100%', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          Tutup Halaman
        </button>
      </div>

      {/* Preview Tampilan Struk di Layar */}
      {transaksiData ? (
        <Struk transaksiData={transaksiData} lebarMaksimal={LEBAR_PRINTER} />
      ) : (
        <p style={{ color: '#9ca3af' }}>Memuat data transaksi...</p>
      )}

    </div>
  );
}