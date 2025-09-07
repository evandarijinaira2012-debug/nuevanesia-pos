import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Laporan() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTransaksi();
  }, [tanggalMulai, tanggalSelesai]);

  const fetchTransaksi = async () => {
    setLoading(true);
    let query = supabase
      .from('transaksi')
      .select(`
        *,
        pelanggan (
          nama,
          alamat,
          no_whatsapp,
          jaminan
        )
      `);

    if (tanggalMulai) {
      query = query.gte('created_at', tanggalMulai);
    }
    if (tanggalSelesai) {
      // Menambahkan 1 hari ke tanggal selesai untuk memastikan data pada tanggal tersebut ikut
      const tanggalSelesaiPlusSatu = new Date(tanggalSelesai);
      tanggalSelesaiPlusSatu.setDate(tanggalSelesaiPlusSatu.getDate() + 1);
      query = query.lt('created_at', tanggalSelesaiPlusSatu.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memuat data transaksi. Coba lagi.');
    } else {
      setTransaksi(data);
    }
    setLoading(false);
  };

  const hitungTotalSemuaTransaksi = () => {
    return transaksi.reduce((total, t) => total + t.total_biaya, 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-8">
      <Head>
        <title>Laporan Keuangan - Nuevanesia POS</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-teal-400">Laporan Keuangan</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          &larr; Kembali ke Kasir
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Filter Tanggal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchTransaksi}
              className="w-full p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-200">Ringkasan Total</h2>
          <span className="text-3xl font-bold text-teal-400">Rp{hitungTotalSemuaTransaksi().toLocaleString('id-ID')}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Memuat data...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : transaksi.length === 0 ? (
        <p className="text-center text-gray-400">Tidak ada transaksi ditemukan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Nama Pelanggan</th> {/* BARIS BARU */}
                <th className="p-3">Durasi</th>
                <th className="p-3">Pembayaran</th>
                <th className="p-3 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t) => (
                <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="p-3">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">{t.pelanggan?.nama || 'Nama tidak ditemukan'}</td> {/* BARIS BARU */}
                  <td className="p-3">{t.durasi_hari} malam</td>
                  <td className="p-3">{t.jenis_pembayaran}</td>
                  <td className="p-3 text-right font-semibold">Rp{t.total_biaya.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}