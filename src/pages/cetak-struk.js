import { useEffect, useState } from 'react';
import Struk from '../components/Struk';

const CetakStrukPage = () => {
  const [transaksiData, setTransaksiData] = useState(null);

  useEffect(() => {
    // Saat halaman ini dimuat, kita ambil data yang sudah kita simpan di memori browser sebelumnya.
    const data = localStorage.getItem('transaksiDataUntukCetak');
    if (data) {
      setTransaksiData(JSON.parse(data));
      
      // Setelah data ada, kita perintahkan browser untuk mencetak.
      // Kita beri sedikit jeda agar semua elemen siap sebelum dicetak.
      window.onload = () => {
        window.print();
        setTimeout(() => {
          window.close(); // Setelah dicetak, tutup tab ini secara otomatis
        }, 500); 
      };
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        @page {
          size: 80mm auto; /* Atur ukuran halaman cetak */
          margin: 0; /* Hapus margin agar cetakan pas di kertas */
        }
        body {
          margin: 0;
          padding: 0;
          background: white; /* Pastikan latar belakang putih */
        }
      `}</style>
      <div className="print-container">
        {transaksiData ? <Struk transaksiData={transaksiData} /> : <div>Memuat data struk...</div>}
      </div>
    </>
  );
};

export default CetakStrukPage;