import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';

// TransactionModal Component
const TransactionModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (angka) => {
    return `Rp${angka.toLocaleString('id-ID')}`;
  };

  const handlePrint = () => {
    const printContent = `
      <style>
        @page {
          size: 80mm 100%; /* Common thermal paper size */
          margin: 0;
        }
        body {
          font-family: 'monospace';
          font-size: 12px;
          padding: 10px;
          color: black;
          line-height: 1.5;
        }
        .header, .footer, .divider {
          text-align: center;
          margin-bottom: 10px;
        }
        .divider {
          border-bottom: 1px dashed black;
          margin: 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          text-align: left;
          padding: 2px 0;
        }
        .text-right {
          text-align: right;
        }
        h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 5px 0;
        }
      </style>
      <body>
        <div class="header">
          <h3>Toko Rental Anda</h3>
          <p>Jl. Contoh No. 123</p>
          <p>WhatsApp: ${transaction.pelanggan?.no_whatsapp || 'N/A'}</p>
        </div>
        <div class="divider"></div>
        <p><strong>ID Transaksi:</strong> ${transaction.id}</p>
        <p><strong>Tanggal:</strong> ${moment(transaction.tanggal_mulai).format('DD MMMM YYYY')}</p>
        <p><strong>Pelanggan:</strong> ${transaction.pelanggan?.nama || 'N/A'}</p>
        <p><strong>Metode Pembayaran:</strong> ${transaction.jenis_pembayaran}</p>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Barang</th>
              <th class="text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${transaction.transaksi_detail.map(item => `
              <tr>
                <td>${item.nama_barang}</td>
                <td class="text-right">${item.jumlah} unit</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <p style="font-size: 18px; text-align: right;"><strong>Total: ${formatRupiah(transaction.total_biaya)}</strong></p>
        <div class="divider"></div>
        <div class="footer">
          <p>Terima kasih telah menyewa!</p>
          <p>Barang yang disewa harus dikembalikan dalam kondisi baik.</p>
        </div>
      </body>
    `;

    const printWindow = window.open('', '_blank', 'width=300,height=400');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      alert('Pop-up window blocked. Please allow pop-ups for this site to print.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 print:bg-white print:text-black">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto print:shadow-none print:border-0">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h3 className="text-xl font-bold text-teal-400">Rincian Transaksi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">
            &times;
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">ID Transaksi:</p>
            <p className="font-semibold text-gray-200 print:text-black">{transaction.id}</p>
          </div>
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">Nama Pelanggan:</p>
            <p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.nama || 'Nama tidak ditemukan'}</p>
          </div>
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">Alamat:</p>
            <p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.alamat || 'Tidak ditemukan'}</p>
          </div>
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">Nomor WhatsApp:</p>
            <p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.no_whatsapp || 'Tidak ditemukan'}</p>
          </div>
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">Tanggal Mulai Sewa:</p>
            <p className="font-semibold text-gray-200 print:text-black">{moment(transaction.tanggal_mulai).format('DD MMMM YYYY')}</p>
          </div>
          <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0">
            <p className="text-sm text-gray-400 print:text-black">Metode Pembayaran:</p>
            <p className="font-semibold text-gray-200 print:text-black">{transaction.jenis_pembayaran}</p>
          </div>
          {transaction.transaksi_detail && transaction.transaksi_detail.length > 0 && (
            <div className="mt-4 print:mt-0">
              <h4 className="text-lg font-bold text-gray-200 mb-2 print:text-black">Barang yang Disewa:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 print:text-black">
                {transaction.transaksi_detail.map((item, index) => (
                  <li key={item.id || index} className="flex justify-between items-center print:text-black">
                    <span>{item.nama_barang}</span>
                    <span className="font-semibold">{item.jumlah} unit</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t border-gray-700 pt-4 print:border-black print:pt-0">
            <p className="text-sm text-gray-400 print:text-black">Total Biaya:</p>
            <p className="font-bold text-2xl text-green-400 print:text-black">{formatRupiah(transaction.total_biaya)}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold hover:bg-teal-700 transition-colors mt-6 print:hidden"
        >
          CETAK STRUK
        </button>
      </div>
    </div>
  );
};

// Main Laporan Component (remains unchanged)
export default function Laporan() {
  const [laporan, setLaporan] = useState(null);
  const [transaksiData, setTransaksiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'tanggal_mulai', direction: 'desc' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const isMounted = useRef(false);

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

  const fetchLaporan = async () => {
    setLoading(true);
    let query = supabase
      .from('transaksi')
      .select(`*, pelanggan(nama, alamat, no_whatsapp, jaminan), transaksi_detail(id, nama_barang, jumlah, produk(harga, nama))`)
      .order('tanggal_mulai', { ascending: false });

    if (startDate) {
      query = query.gte('tanggal_mulai', startDate);
    }
    if (endDate) {
      query = query.lte('tanggal_mulai', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching laporan:', error);
    } else {
      const laporanHarian = {};
      const laporanBulanan = {};
      const laporanTahunan = {};

      data.forEach(transaksi => {
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
      });

      setLaporan({
        harian: laporanHarian,
        bulanan: laporanBulanan,
        tahunan: laporanTahunan,
      });
      setTransaksiData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session && !isMounted.current) {
      isMounted.current = true;
      fetchLaporan();
    }
  }, [session]);

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const filteredTransaksi = useMemo(() => {
    if (!transaksiData) return [];
    return transaksiData.filter(t =>
      t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transaksiData, searchQuery]);

  const sortedTransaksi = useMemo(() => {
    const sortableItems = [...filteredTransaksi];
    sortableItems.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.field) {
        case 'tanggal_mulai':
          aValue = new Date(a.tanggal_mulai);
          bValue = new Date(b.tanggal_mulai);
          break;
        case 'pelanggan.nama':
          aValue = a.pelanggan?.nama || '';
          bValue = b.pelanggan?.nama || '';
          break;
        case 'total_biaya':
          aValue = a.total_biaya;
          bValue = b.total_biaya;
          break;
        case 'jenis_pembayaran':
          aValue = a.jenis_pembayaran;
          bValue = b.jenis_pembayaran;
          break;
        default:
          return 0;
      }
      const isAsc = sortConfig.direction === 'asc';
      if (aValue < bValue) return isAsc ? -1 : 1;
      if (aValue > bValue) return isAsc ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [filteredTransaksi, sortConfig]);

  const formatRupiah = (angka) => {
    return `Rp${angka.toLocaleString('id-ID')}`;
  };

  const getSortIcon = (field) => {
    if (sortConfig.field === field) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    alert("Fitur ekspor ke CSV akan diimplementasikan di sini. Anda bisa menggunakan pustaka seperti 'papaparse' atau 'json-2-csv'.");
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    fetchLaporan();
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
      <div className="flex justify-between items-center mb-10 print:hidden">
        <h1 className="text-4xl font-bold text-teal-400">Laporan Keuangan</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Kembali ke POS
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 mb-8 print:hidden">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Filter & Pencarian</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">Cari Nama Pelanggan</label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan nama pelanggan..."
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="w-full md:w-auto flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
            />
          </div>
          <div className="w-full md:w-auto flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">Tanggal Selesai</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={fetchLaporan}
              className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors mt-6"
            >
              Terapkan
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors mt-6"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Harian</h2>
          {laporan?.harian && Object.keys(laporan.harian).length > 0 ? (
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

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Bulanan</h2>
          {laporan?.bulanan && Object.keys(laporan.bulanan).length > 0 ? (
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

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Pendapatan Tahunan</h2>
          {laporan?.tahunan && Object.keys(laporan.tahunan).length > 0 ? (
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

      <div className="mt-12 bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-200">Detail Transaksi</h2>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ekspor ke CSV
          </button>
        </div>
        {sortedTransaksi.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => handleSort('tanggal_mulai')}>
                    Tanggal Transaksi {getSortIcon('tanggal_mulai')}
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => handleSort('pelanggan.nama')}>
                    Nama Pelanggan {getSortIcon('pelanggan.nama')}
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => handleSort('jenis_pembayaran')}>
                    Metode Pembayaran {getSortIcon('jenis_pembayaran')}
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => handleSort('total_biaya')}>
                    Total Biaya {getSortIcon('total_biaya')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransaksi.map(t => (
                  <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                    <td className="p-4">{moment(t.tanggal_mulai).format('DD MMMM YYYY')}</td>
                    <td
                      className="p-4 cursor-pointer hover:underline text-teal-400"
                      onClick={() => handleRowClick(t)}
                    >
                      {t.pelanggan?.nama || 'Nama tidak ditemukan'}
                    </td>
                    <td className="p-4">{t.jenis_pembayaran}</td>
                    <td className="p-4 font-semibold text-green-400">{formatRupiah(t.total_biaya)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center">Tidak ada data transaksi yang ditemukan.</p>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}