// pages/cetak-struk.js

import { useEffect, useState } from 'react';
import Struk from '../components/Struk';

const CetakStrukPage = () => {
  const [transaksiData, setTransaksiData] = useState(null);

  useEffect(() => {
    // Ambil data dari localStorage.
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) {
      // Jika data ditemukan, simpan ke dalam state.
      setTransaksiData(JSON.parse(data));
    }
  }, []);

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
      `}</style>
      <div className="print-container">
        {transaksiData ? <Struk transaksiData={transaksiData} /> : <div>Memuat data struk...</div>}
      </div>
    </>
  );
};

export default CetakStrukPage;