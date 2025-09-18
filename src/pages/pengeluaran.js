import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';

const IconExport = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);

export default function Pengeluaran() {
  const [pengeluaranData, setPengeluaranData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [formData, setFormData] = useState({
    tanggal: moment().format('YYYY-MM-DD'),
    jumlah: '',
    jenis_pengeluaran: '',
    deskripsi: ''
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ field: 'tanggal', direction: 'desc' });
  const router = useRouter();

  const [totalPemasukanBulanIni, setTotalPemasukanBulanIni] = useState(0);
  const [pendapatanBersihBulanIni, setPendapatanBersihBulanIni] = useState(0);
  const [totalPengeluaranBulanIni, setTotalPengeluaranBulanIni] = useState(0);

  const fetchPengeluaran = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Error fetching pengeluaran:', error);
      setPengeluaranData([]);
    } else {
      setPengeluaranData(data);
      const pengeluaranBulanIni = data
        .filter(item => moment(item.tanggal).format('YYYY-MM') === moment().format('YYYY-MM'))
        .reduce((total, item) => total + parseFloat(item.jumlah), 0);
      setTotalPengeluaranBulanIni(pengeluaranBulanIni);
    }
    setLoading(false);
  };

  const fetchPemasukan = async () => {
    const bulanSekarang = moment().startOf('month').format('YYYY-MM-DD');
    const bulanDepan = moment().endOf('month').format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('transaksi')
      .select('total_biaya')
      .gte('tanggal_mulai', bulanSekarang)
      .lte('tanggal_mulai', bulanDepan);

    if (error) {
      console.error('Error fetching pemasukan:', error);
      setTotalPemasukanBulanIni(0);
    } else {
      const pemasukan = data.reduce((total, item) => total + item.total_biaya, 0);
      setTotalPemasukanBulanIni(pemasukan);
    }
  };

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        await fetchPengeluaran();
        await fetchPemasukan();
      } else {
        router.push('/login');
      }

      setInitialLoading(false);
    };

    checkSessionAndFetchData();

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
    setPendapatanBersihBulanIni(totalPemasukanBulanIni - totalPengeluaranBulanIni);
  }, [totalPemasukanBulanIni, totalPengeluaranBulanIni]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.jumlah || !formData.jenis_pengeluaran) {
      alert('Jenis pengeluaran dan Jumlah harus diisi.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('pengeluaran')
      .insert([
        {
          ...formData,
          jumlah: parseFloat(formData.jumlah)
        }
      ]);

    if (error) {
      console.error('Error adding pengeluaran:', error);
      alert('Gagal menambahkan pengeluaran!');
    } else {
      setFormData({
        tanggal: moment().format('YYYY-MM-DD'),
        jumlah: '',
        jenis_pengeluaran: '',
        deskripsi: ''
      });
      fetchPengeluaran();
      fetchPemasukan();
    }
    setLoading(false);
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const sortedPengeluaran = useMemo(() => {
    const sortableItems = [...pengeluaranData];
    sortableItems.sort((a, b) => {
      const isAsc = sortConfig.direction === 'asc';

      if (sortConfig.field === 'tanggal') {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return isAsc ? dateA - dateB : dateB - dateA;
      }

      if (a[sortConfig.field] < b[sortConfig.field]) return isAsc ? -1 : 1;
      if (a[sortConfig.field] > b[sortConfig.field]) return isAsc ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [pengeluaranData, sortConfig]);

  const formatRupiah = (angka) => {
    return `Rp${parseFloat(angka).toLocaleString('id-ID')}`;
  };

  const getSortIcon = (field) => {
    if (sortConfig.field === field) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  const handleExportCSV = () => {
    if (pengeluaranData.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = [
      'ID', 'Tanggal', 'Jenis Pengeluaran', 'Deskripsi', 'Jumlah'
    ];

    const csvRows = [headers.join(';')];

    pengeluaranData.forEach(p => {
      const row = [
        `"${p.id}"`,
        `"${moment(p.tanggal).format('YYYY-MM-DD')}"`,
        `"${p.jenis_pengeluaran}"`,
        `"${p.deskripsi || ''}"`,
        p.jumlah
      ].join(';');
      csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'laporan-pengeluaran.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  if (initialLoading) {
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
        <title>Catatan Pengeluaran</title>
      </Head>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-teal-400">Catatan Pengeluaran</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Kembali ke POS
        </button>
      </div>
      
      {/* Container utama dengan 2 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Kolom Pertama: Tambahkan Pengeluaran Baru */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Tambahkan Pengeluaran Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-400">Tanggal</label>
              <input
                type="date"
                name="tanggal"
                id="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
                required
              />
            </div>
            <div>
              <label htmlFor="jenis_pengeluaran" className="block text-sm font-medium text-gray-400">Jenis Pengeluaran</label>
              <select
                name="jenis_pengeluaran"
                id="jenis_pengeluaran"
                value={formData.jenis_pengeluaran}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
                required
              >
              <option value="" disabled>Pilih Jenis Pengeluaran</option>
              <option value="Pembelian Barang">Pembelian Barang</option>
              <option value="Gaji Karyawan">Gaji Karyawan</option>
              <option value="Listrik">Listrik</option>
              <option value="WiFi">WiFi</option>
              <option value="Refund">Refund</option>
              <option value="Evan">Evan</option>
              <option value="Indah">Indah</option>
              <option value="Beli Makan Evan & Indah">Beli Makan Evan & Indah</option>
              <option value="Beli Rokok Evan">Beli Rokok Evan</option>
              <option value="Konsumsi/suguhan/jajan">Konsumsi/suguhan/jajan</option>
              <option value="Beli Bensin Motor">Beli Bensin Motor</option>
              <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
            <div>
              <label htmlFor="jumlah" className="block text-sm font-medium text-gray-400">Jumlah (Rp)</label>
              <input
                type="number"
                name="jumlah"
                id="jumlah"
                value={formData.jumlah}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
                required
              />
            </div>
            <div>
              <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-400">Deskripsi (Opsional)</label>
              <textarea
                name="deskripsi"
                id="deskripsi"
                rows="3"
                value={formData.deskripsi}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold hover:bg-teal-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Tambahkan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Kolom Kedua: Ringkasan Finansial */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-1">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-2 text-gray-200">Total Pemasukan Bulan Ini</h2>
            <p className="text-3xl font-bold text-green-400">{formatRupiah(totalPemasukanBulanIni)}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-2 text-gray-200">Total Pengeluaran Bulan Ini</h2>
            <p className="text-3xl font-bold text-red-500">{formatRupiah(totalPengeluaranBulanIni)}</p>
          </div>
          <div className={`p-6 rounded-lg shadow-xl border ${pendapatanBersihBulanIni >= 0 ? 'bg-gray-800 border-gray-700' : 'bg-red-800 border-red-700'}`}>
            <h2 className="text-xl font-semibold mb-2 text-gray-200">Pendapatan Bersih Bulan Ini</h2>
            <p className="text-3xl font-bold">{formatRupiah(pendapatanBersihBulanIni)}</p>
          </div>
        </div>
      </div>

      {loading && !initialLoading ? (
        <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-200">Riwayat Pengeluaran</h2>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <IconExport />
              Ekspor ke CSV
            </button>
          </div>
          {sortedPengeluaran.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors whitespace-nowrap" onClick={() => handleSort('tanggal')}>
                      Tanggal {getSortIcon('tanggal')}
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors whitespace-nowrap" onClick={() => handleSort('jenis_pengeluaran')}>
                      Jenis Pengeluaran {getSortIcon('jenis_pengeluaran')}
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors whitespace-nowrap" onClick={() => handleSort('deskripsi')}>
                      Deskripsi {getSortIcon('deskripsi')}
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors text-right whitespace-nowrap" onClick={() => handleSort('jumlah')}>
                      Jumlah {getSortIcon('jumlah')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPengeluaran.map(p => (
                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                      <td className="p-4">{moment(p.tanggal).format('DD MMMM YYYY')}</td>
                      <td className="p-4">{p.jenis_pengeluaran}</td>
                      <td className="p-4">{p.deskripsi || '-'}</td>
                      <td className="p-4 font-semibold text-red-500 text-right">{formatRupiah(p.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center">Belum ada data pengeluaran.</p>
          )}
        </div>
      )}
    </div>
  );
}