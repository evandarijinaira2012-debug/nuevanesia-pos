import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Laporan() {
  const [transaksi, setTransaksi] = useState([]);
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
    async function fetchTransaksi() {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          pelanggan (
            nama,
            no_whatsapp
          )
        `)
        .order('created_at', { ascending: false }); // Baris penting untuk mengurutkan

      if (error) {
        console.error('Error fetching transaksi:', error);
      } else {
        setTransaksi(data);
      }
      setLoading(false);
    }

    if (session) {
      fetchTransaksi();
    }
  }, [session]);

  if (!session) {
    return null;
  }

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 lg:p-8">
      <Head>
        <title>Laporan Keuangan</title>
      </Head>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-teal-400">Laporan Transaksi Harian</h1>
        <button
          onClick={handleBack}
          className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
        >
          &larr; Kembali
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-400">Memuat laporan...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg p-4">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  No. WA
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Durasi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Biaya
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Metode Bayar
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transaksi.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-400">Belum ada transaksi hari ini.</td>
                </tr>
              ) : (
                transaksi.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {t.pelanggan?.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {t.pelanggan?.no_whatsapp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {t.durasi_hari} malam
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-400">
                      Rp{t.total_biaya.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {t.jenis_pembayaran}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}