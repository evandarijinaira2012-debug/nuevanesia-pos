// src/pages/cetak-struk.js
import { useEffect, useState } from 'react';
import Struk from '../components/Struk'; // Dipastikan path mengarah ke src/components/Struk

const CetakStrukPage = () => {
  const [transaksiData, setTransaksiData] = useState(null);

  useEffect(() => {
    // 1. Ambil data dari localStorage
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) {
      setTransaksiData(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    // 2. Jika data sudah ada di state, pemicu cetak langsung berjalan
    if (transaksiData) {
      setTimeout(() => {
        window.print();
        // Opsional: hapus baris di bawah ini jika kamu tidak ingin tab menutup otomatis setelah print
        window.close(); 
      }, 500); // jeda 0.5 detik agar browser sempat merender tulisan struk
    }
  }, [transaksiData]);

  return (
    <>
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        /* Menyembunyikan elemen penampung utama saat tidak dicetak di beberapa browser */
        .print-container {
          display: flex;
          justify-content: center;
        }
      `}</style>
      <div className="print-container">
        {transaksiData ? <Struk transaksiData={transaksiData} /> : <div style={{ padding: '20px', color: 'black' }}>Memuat data struk...</div>}
      </div>
    </>
  );
};

export default CetakStrukPage;