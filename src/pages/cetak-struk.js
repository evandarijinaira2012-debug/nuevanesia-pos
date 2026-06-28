// src/pages/cetak-struk.js
import { useEffect, useState } from 'react';
import Struk, { generateTextStruk } from '../components/Struk';

export default function CetakStrukPage() {
  const [transaksiData, setTransaksiData] = useState(null);
  const [statusBluetooth, setStatusBluetooth] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Tentukan lebar kertas printer thermal kamu (80mm = 48, atau 58mm = 32)
  const LEBAR_PRINTER = 48; 

  useEffect(() => {
    const data = localStorage.getItem('transaksiDataUntukStruk');
    if (data) setTransaksiData(JSON.parse(data));
  }, []);

  const handleCetakBluetooth = async () => {
    if (!transaksiData) return;
    setLoading(true);
    setStatusBluetooth('Mencari printer...');

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb', '000018f0-0000-1000-8000-00805f9b34fb'] 
      });

      setStatusBluetooth('Menghubungkan...');
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      let txCharacteristic = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            txCharacteristic = char;
            break;
          }
        }
        if (txCharacteristic) break;
      }

      if (!txCharacteristic) throw new Error('Printer tidak mendukung fitur cetak ini.');

      setStatusBluetooth('Mencetak...');
      
      // Ambil teks langsung dari Struk.js tanpa menulis ulang di sini!
      const teksStrukMentah = generateTextStruk(transaksiData, LEBAR_PRINTER);
      
      const encoder = new TextEncoder();
      const bytes = encoder.encode(teksStrukMentah);
      const chunkSize = 20;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        await txCharacteristic.writeValue(bytes.slice(i, i + chunkSize));
      }

      setStatusBluetooth('Cetak Berhasil!');
      device.gatt.disconnect();
    } catch (err) {
      setStatusBluetooth(`Gagal: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111827', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', width: '320px', textAlign: 'center', marginBottom: '20px', border: '1px solid #374151' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>Printer Bluetooth Thermal</h4>
        {statusBluetooth && <p style={{ color: '#fbbf24', fontSize: '13px', margin: '5px 0' }}>{statusBluetooth}</p>}
        <button onClick={handleCetakBluetooth} disabled={loading || !transaksiData} style={{ background: '#0d9488', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
          {loading ? 'Memproses...' : 'KONEKSI & CETAK'}
        </button>
        <button onClick={() => window.close()} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '6px', width: '100%', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Tutup</button>
      </div>

      {/* Tampilkan preview murni dari teks yang sama */}
      {transaksiData ? <Struk transaksiData={transaksiData} lebarMaksimal={LEBAR_PRINTER} /> : <p>Memuat data...</p>}
    </div>
  );
}