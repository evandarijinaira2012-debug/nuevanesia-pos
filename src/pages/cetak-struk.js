// pages/cetak-struk.js

import { useEffect, useState } from 'react';
import Struk from '../components/Struk';
import StrukLaundry from '../components/StrukLaundry';
import StrukPenjualan from '../components/StrukPenjualan';

const CetakStrukPage = () => {
  const [dataStruk, setDataStruk] = useState(null);

  useEffect(() => {
    // Ambil data dari localStorage.
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) {
      setDataStruk(JSON.parse(data));
    }
  }, []);

  if (!dataStruk) {
    return <div>Memuat data struk...</div>;
  }

  // Cek jenis transaksi dari data yang dikirim oleh CheckoutLaundry atau CheckoutPenjualan
  const jenisTransaksi = dataStruk?.transaksiData?.jenis_transaksi;

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
        {/* LOGIKA PINTU AIR */}
        {jenisTransaksi === 'Laundry' ? (
          <StrukLaundry data={dataStruk} />
        ) : jenisTransaksi === 'Penjualan' ? (
          <StrukPenjualan data={dataStruk} />
        ) : (
          // Jika tidak ada jenis_transaksi, berarti ini struk Sewa yang lama
          <Struk transaksiData={dataStruk} />
        )}
      </div>
    </>
  );
};

export default CetakStrukPage;