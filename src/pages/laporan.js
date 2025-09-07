import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';

export default function Laporan() {
  const [laporan, setLaporan] = useState(null);
  const [transaksiHarian, setTransaksiHarian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.push('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          router.push('/login');
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);
  
  useEffect(() => {
    if (session) {
      fetchLaporan();
    }
  }, [session]);

  const fetchLaporan = async () => {
    const { data: transaksiData, error: transaksiError } = await supabase
      .from('transaksi')
      .select('*, pelanggan(nama, alamat, no_whatsapp, jaminan)');

    if (transaksiError) {
      console.error('Error fetching laporan:', transaksiError);
      setLoading(false);
      return;
    }

    const laporanHarian = {};
    const laporanBulanan = {};
    const laporanTahunan = {};
    const transaksiHarianDetail = [];

    transaksiData.forEach(transaksi => {
      const tanggalMulai = moment(transaksi.tanggal_mulai);
      const hari = tanggalMulai.format('YYYY-MM-DD');
      const bulan = tanggalMulai.format('YYYY-MM');
      const tahun = tanggalMulai.format('YYYY');

      if (!laporanHarian[hari]) laporanHarian[hari] = 0;
      laporanHarian[hari] += transaksi.total_biaya;

      if (!laporanBulanan[bulan]) laporanBulanan[bulan] = 0;
      laporanBulanan[bulan] += transaksi.total_biaya;

      if (!laporanTahunan[tahun]) laporanTahunan[tahun] = 0;
      laporanTahunan[tahun] += transaksi.total_biaya;
      
      transaksiHarianDetail.push(transaksi);
    });

    setLaporan({
      harian: laporanHarian,
      bulanan: laporanBulanan,
      tahunan: laporanTahunan,
    });
    
    // Mengurutkan transaksi dari terbaru ke terlama
    const transaksiTerurut = transaksiHarianDetail.sort((a, b) => moment(b.tanggal_mulai).valueOf() - moment(a.tanggal_mulai).valueOf());
    setTransaksiHarian(transaksiTerurut);
    
    setLoading(false);
  };

  const formatRupiah = (angka) => {
    return `Rp${angka.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-10 w-10 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Head>
        <title>Laporan Keuangan</title>
      </Head>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-teal-400">Laporan Keuangan</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Kembali ke POS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card Pendapatan Harian */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Harian</h2>
          {Object.keys(laporan.harian).length > 0 ? (
            <ul className="space-y-3">
              {Object.keys(laporan.harian).map(hari => (
                <li key={hari} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <span className="text-lg text-gray-300">{moment(hari, 'YYYY-MM-DD').format('DD MMMM YYYY')}</span>
                  <span className="text-xl font-bold text-green-400">{formatRupiah(laporan.harian[hari])}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">Belum ada data transaksi.</p>
          )}
        </div>

        {/* Card Pendapatan Bulanan */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Bulanan</h2>
          {Object.keys(laporan.bulanan).length > 0 ? (
            <ul className="space-y-3">
              {Object.keys(laporan.bulanan).map(bulan => (
                <li key={bulan} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <span className="text-lg text-gray-300">{moment(bulan, 'YYYY-MM').format('MMMM YYYY')}</span>
                  <span className="text-xl font-bold text-green-400">{formatRupiah(laporan.bulanan[bulan])}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">Belum ada data transaksi.</p>
          )}
        </div>

        {/* Card Pendapatan Tahunan */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Tahunan</h2>
          {Object.keys(laporan.tahunan).length > 0 ? (
            <ul className="space-y-3">
              {Object.keys(laporan.tahunan).map(tahun => (
                <li key={tahun} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <span className="text-lg text-gray-300">{tahun}</span>
                  <span className="text-xl font-bold text-green-400">{formatRupiah(laporan.tahunan[tahun])}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">Belum ada data transaksi.</p>
          )}
        </div>
      </div>
      
      {/* Kolom Laporan Harian Detail */}
      <div className="mt-12 bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-gray-200">Detail Transaksi Harian</h2>
        {transaksiHarian.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4">Tanggal Transaksi</th>
                  <th className="p-4">Nama Pelanggan</th>
                  <th className="p-4">Metode Pembayaran</th>
                  <th className="p-4">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {transaksiHarian.map(t => (
                  <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                    <td className="p-4">{moment(t.tanggal_mulai).format('DD MMMM YYYY')}</td>
                    <td className="p-4">{t.pelanggan?.nama || 'Nama tidak ditemukan'}</td>
                    <td className="p-4">{t.jenis_pembayaran}</td>
                    <td className="p-4 font-semibold text-green-400">{formatRupiah(t.total_biaya)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center">Tidak ada data transaksi harian.</p>
        )}
      </div>
    </div>
  );
}