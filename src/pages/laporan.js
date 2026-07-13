// Nama File: laporan.js
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';
import toast, { Toaster } from 'react-hot-toast';

// --- KOMPONEN IKON ---
const IconExport = () => (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);
const IconSort = () => (
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7l4-4m0 0l4 4m-4-4v12"></path></svg>
);
const IconCheck = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

// --- MODAL PELUNASAN ---
const PelunasanModal = ({ isOpen, onClose, transaction, onSuccess }) => {
    const [metode, setMetode] = useState('QRIS');
    const [nominal, setNominal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (transaction) {
            setNominal(transaction.total_biaya - transaction.jumlah_terbayar);
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const sisaTagihan = transaction.total_biaya - transaction.jumlah_terbayar;

    const handleSimpan = async () => {
    if (nominal <= 0) {
        toast.error("Nominal pelunasan tidak valid!");
        return;
    }
    
    if (nominal > sisaTagihan) {
        toast.error(`Nominal tidak boleh melebihi sisa tagihan (${sisaTagihan.toLocaleString('id-ID')})`);
        return;
    }
    
    setIsSubmitting(true);
    // ... sisa kode aman
        const toastId = toast.loading('Memproses pelunasan...');

        try {
            const { error: logError } = await supabase.from('log_pembayaran').insert({
                transaksi_id: transaction.id,
                nominal: nominal,
                jenis_pembayaran: metode,
                tipe: 'Pelunasan'
            });
            if (logError) throw logError;

            const newJumlahTerbayar = transaction.jumlah_terbayar + nominal;
            const newStatus = newJumlahTerbayar >= transaction.total_biaya ? 'Lunas' : 'DP';

            const { error: trxError } = await supabase.from('transaksi').update({
                jumlah_terbayar: newJumlahTerbayar,
                status_pembayaran: newStatus
            }).eq('id', transaction.id);
            if (trxError) throw trxError;

            toast.success('Pelunasan berhasil dicatat!', { id: toastId });
            onSuccess(); 
            onClose();
        } catch (e) {
            console.error('Error pelunasan:', e);
            toast.error('Gagal memproses pelunasan.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-teal-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-teal-400">Pelunasan Tagihan</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-400">Total Biaya</p>
                        <p className="text-lg font-semibold text-gray-200">Rp{transaction.total_biaya.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-gray-400 mt-2">Sudah Dibayar (DP)</p>
                        <p className="text-lg font-semibold text-green-400">Rp{transaction.jumlah_terbayar.toLocaleString('id-ID')}</p>
                        <div className="border-t border-gray-700 my-2 pt-2">
                            <p className="text-sm text-gray-400">Sisa Tagihan</p>
                            <p className="text-xl font-bold text-red-400">Rp{sisaTagihan.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Metode Pembayaran Baru</label>
                        <select 
                            value={metode} 
                            onChange={(e) => setMetode(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 px-3 focus:ring-teal-500 focus:border-teal-500"
                        >
                            <option value="QRIS">QRIS</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nominal Dibayarkan (Rp)</label>
                        <input 
                            type="number" 
                            value={nominal}
                            onChange={(e) => setNominal(Number(e.target.value))}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 px-3 focus:ring-teal-500"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSimpan}
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold hover:bg-teal-500 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'MEMPROSES...' : 'SIMPAN PELUNASAN'}
                </button>
            </div>
        </div>
    );
};

// --- MODAL RINCIAN TRANSAKSI ---
const TransactionModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (angka) => `Rp${angka.toLocaleString('id-ID')}`;
  const isBukanSewa = transaction.jenis_transaksi === 'Penjualan' || transaction.jenis_transaksi === 'Laundry';

  const handlePrint = () => {
    const dataUntukStruk = {
      pelanggan: {
        nama: transaction.pelanggan?.nama || '-',
        noWhatsapp: transaction.pelanggan?.no_whatsapp || '-',
        jaminan: transaction.pelanggan?.jaminan || '-'
      },
      keranjang: transaction.transaksi_detail ? transaction.transaksi_detail.map(item => ({
        id: item.id,
        nama: item.nama_barang,
        harga: item.produk?.harga || 0,
        qty: item.jumlah
      })) : [],
      tanggalMulai: transaction.tanggal_mulai,
      tanggalSelesai: transaction.tanggal_selesai,
      durasi: transaction.durasi_hari,
      total: transaction.total_biaya,
      metodePembayaran: transaction.jenis_pembayaran,
      catatan: transaction.catatan || '',
      diskonOtomatis: transaction.diskon_otomatis || 0,
      diskonManual: transaction.diskon_manual || 0,
      statusPembayaran: transaction.status_pembayaran,
      jumlahTerbayar: transaction.jumlah_terbayar,
      logPembayaran: transaction.log_pembayaran || []
    };

    localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(dataUntukStruk));
    window.open('/cetak-struk', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 print:bg-white print:text-black">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-700 print:shadow-none print:border-0">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h3 className="text-xl font-bold text-teal-400">Rincian Transaksi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">ID Transaksi:</p>
              <p className="font-semibold text-gray-200 text-xs mt-1">{transaction.id}</p>
            </div>
            {isBukanSewa && (
                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-lg text-xs font-bold border border-blue-700">
                    {transaction.jenis_transaksi}
                </span>
            )}
          </div>
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">Nama Pelanggan:</p>
            <p className="font-semibold text-gray-200">{transaction.pelanggan?.nama || 'Anonim'}</p>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">Nomor WhatsApp:</p>
            <p className="font-semibold text-gray-200">{transaction.pelanggan?.no_whatsapp || '-'}</p>
          </div>
          
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">{isBukanSewa ? 'Tanggal Transaksi:' : 'Tanggal Sewa:'}</p>
            {isBukanSewa || !transaction.tanggal_mulai ? (
                <p className="font-semibold text-gray-200">{moment(transaction.created_at).format('DD MMM YYYY, HH:mm')}</p>
            ) : (
                <p className="font-semibold text-gray-200">{moment(transaction.tanggal_mulai).format('DD MMM YYYY')} s/d {moment(transaction.tanggal_selesai).format('DD MMM YYYY')}</p>
            )}
          </div>
          
          <div className="border-b border-gray-700 pb-2 flex justify-between">
            <div>
              <p className="text-sm text-gray-400">Metode Awal:</p>
              <p className="font-semibold text-gray-200">{transaction.jenis_pembayaran}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Status Pembayaran:</p>
              <p className={`font-bold ${transaction.status_pembayaran === 'Lunas' ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.status_pembayaran}
              </p>
            </div>
          </div>

          {transaction.transaksi_detail && transaction.transaksi_detail.length > 0 && (
            <div className="border-b border-gray-700 pb-4 mt-2">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Item Transaksi:</h4>
              <ul className="space-y-1">
                {transaction.transaksi_detail.map((item, index) => (
                  <li key={item.id || index} className="flex justify-between text-sm text-gray-300">
                    <span>{item.nama_barang} (x{item.jumlah})</span>
                    <span>{formatRupiah(item.jumlah * (item.produk?.harga || 0))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {transaction.log_pembayaran && transaction.log_pembayaran.length > 0 && (
            <div className="border-b border-gray-700 pb-4 mt-2">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Riwayat Pembayaran:</h4>
              <ul className="space-y-2">
                {transaction.log_pembayaran.map((log, index) => (
                  <li key={log.id || index} className="flex justify-between items-center text-sm bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <div>
                      <span className="font-semibold text-gray-200">{log.tipe}</span>
                      <p className="text-xs text-teal-400 mt-0.5">Via {log.jenis_pembayaran} • {moment(log.tanggal_bayar).format('DD/MM/YY HH:mm')}</p>
                    </div>
                    <span className="font-bold text-green-400">+{formatRupiah(log.nominal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Total Biaya:</span>
                <span className="text-gray-200">{formatRupiah(transaction.total_biaya)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Sudah Dibayar:</span>
                <span className="text-green-400">{formatRupiah(transaction.jumlah_terbayar || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-2 border-t border-gray-700 pt-2">
                <span className="text-teal-400">Sisa Tagihan:</span>
                <span className="text-red-400">{formatRupiah(transaction.total_biaya - (transaction.jumlah_terbayar || 0))}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold hover:bg-teal-700 transition-colors mt-6 print:hidden"
        >
          CETAK STRUK
        </button>
      </div>
    </div>
  );
};

// --- HALAMAN UTAMA LAPORAN ---
export default function Laporan() {
  const [transaksiData, setTransaksiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', direction: 'desc' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');

  const [rekapKas, setRekapKas] = useState({ cash: 0, transfer: 0, qris: 0, total: 0 });
  const [jumlahTransaksiHariIni, setJumlahTransaksiHariIni] = useState(0);

  const [pelunasanModalOpen, setPelunasanModalOpen] = useState(false);
  const [selectedForPelunasan, setSelectedForPelunasan] = useState(null);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const fetchLaporan = async () => {
    setLoading(true);

    let query = supabase
      .from('transaksi')
      .select(`*, pelanggan(nama, alamat, no_whatsapp, jaminan), transaksi_detail(id, nama_barang, jumlah, produk(harga, nama)), log_pembayaran(id, nominal, jenis_pembayaran, tipe, tanggal_bayar), status_pengembalian, status_pembayaran, jumlah_terbayar`)
      .order('created_at', { ascending: false });

    // UBAH: Gunakan created_at agar transaksi penjualan/laundry dan booking di muka tetap terhitung rata
    query = query.or('status_validasi.eq.Valid,sumber_transaksi.eq.POS,sumber_transaksi.is.null');
    if (startDate) query = query.gte('created_at', `${startDate}T00:00:00`);
    if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);
    
  // Menyiapkan variabel tanggal hari ini untuk keperluan filter
    const hariIni = moment().format('YYYY-MM-DD');
    const awalHariIni = moment().startOf('day').toISOString();
    const akhirHariIni = moment().endOf('day').toISOString();

    // Logika untuk masing-masing tombol filter
    if (activeTab === 'Belum Kembali') {
      query = query.or('status_pengembalian.eq.Belum_Kembali,status_pengembalian.is.null');
    } else if (activeTab === 'Terlambat') {
      query = query.or('status_pengembalian.eq.Belum_Kembali,status_pengembalian.is.null').lt('tanggal_selesai', hariIni);
    } else if (activeTab === 'Belum Lunas') {
      query = query.neq('status_pembayaran', 'Lunas');
    } else if (activeTab === 'Lunas') {
      query = query.eq('status_pembayaran', 'Lunas');
    } else if (activeTab === 'Closing Hari Ini') {
      query = query.gte('created_at', awalHariIni).lte('created_at', akhirHariIni);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching laporan:', error);
    } else {
      setTransaksiData(data);
    }

    // UBAH: Optimasi query log_pembayaran langsung difilter berdasarkan hari ini di database
    const todayStart = moment().startOf('day').toISOString();
    const todayEnd = moment().endOf('day').toISOString();

    const { data: logData, error: logError } = await supabase
        .from('log_pembayaran')
        .select('nominal, jenis_pembayaran, created_at')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
    
    if (!logError && logData) {
        let tCash = 0, tTransfer = 0, tQris = 0;

        logData.forEach(log => {
            const nom = Number(log.nominal);
            if (log.jenis_pembayaran === 'Cash') tCash += nom;
            if (log.jenis_pembayaran === 'Transfer') tTransfer += nom;
            if (log.jenis_pembayaran === 'QRIS') tQris += nom;
        });
        setRekapKas({ cash: tCash, transfer: tTransfer, qris: tQris, total: tCash + tTransfer + tQris });
    }

    // Menghitung jumlah transaksi yang dibuat hari ini
    const { count: countTransaksi, error: errorCount } = await supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

    if (!errorCount) {
        setJumlahTransaksiHariIni(countTransaksi || 0);
    }

    setLoading(false);
    setInitialLoading(false);
};

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchLaporan();
      else router.push('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) router.push('/login');
    });

    return () => { if (subscription) subscription.unsubscribe(); };
  }, [router, activeTab]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchLaporan();
  };

  const filteredTransaksi = useMemo(() => {
    if (!transaksiData) return [];
    const searchLower = searchQuery.toLowerCase();
    return transaksiData.filter(t => {
        const matchNama = t.pelanggan?.nama?.toLowerCase().includes(searchLower);
        const matchHp = t.pelanggan?.no_whatsapp?.toLowerCase().includes(searchLower);
        return matchNama || matchHp;
    });
  }, [transaksiData, searchQuery]);

  const sortedTransaksi = useMemo(() => {
    const sortableItems = [...filteredTransaksi];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.field], bValue = b[sortConfig.field];
      if (sortConfig.field === 'pelanggan.nama') {
          aValue = a.pelanggan?.nama || ''; bValue = b.pelanggan?.nama || '';
      }
      const isAsc = sortConfig.direction === 'asc';
      if (aValue < bValue) return isAsc ? -1 : 1;
      if (aValue > bValue) return isAsc ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [filteredTransaksi, sortConfig]);

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'desc') direction = 'asc';
    else if (sortConfig.field === field && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ field, direction });
  };

  const getSortIcon = (field) => sortConfig.field === field ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : '';
  const formatRupiah = (angka) => `Rp${angka.toLocaleString('id-ID')}`;

  const updateStatusPengembalian = async (transactionId, status) => {
    setLoading(true);
    const { error } = await supabase.from('transaksi').update({ status_pengembalian: status }).eq('id', transactionId);
    if (error) {
      toast.error('Gagal memperbarui status pengembalian!');
      setLoading(false);
    } else {
      await fetchLaporan();
    }
  };

  const handleExportCSV = () => {
    if (sortedTransaksi.length === 0) { toast.error('Tidak ada data untuk diekspor!'); return; }
    const headers = ['ID Transaksi', 'Jenis Transaksi', 'Tanggal Mulai', 'Tanggal Selesai', 'Nama Pelanggan', 'No WhatsApp', 'Metode Pembayaran', 'Status Pembayaran', 'Total Biaya', 'Sudah Dibayar'];
    const csvRows = [headers.join(';')];

    sortedTransaksi.forEach(t => {
      const isSewa = t.jenis_transaksi !== 'Penjualan' && t.jenis_transaksi !== 'Laundry';
      const row = [
        `"${t.id}"`, `"${t.jenis_transaksi || 'Sewa'}"`, 
        `"${isSewa && t.tanggal_mulai ? moment(t.tanggal_mulai).format('YYYY-MM-DD') : '-'}"`, 
        `"${isSewa && t.tanggal_selesai ? moment(t.tanggal_selesai).format('YYYY-MM-DD') : '-'}"`,
        `"${t.pelanggan?.nama || 'Anonim'}"`, `"${t.pelanggan?.no_whatsapp || '-'}"`, `"${t.jenis_pembayaran}"`,
        `"${t.status_pembayaran}"`, t.total_biaya, t.jumlah_terbayar
      ].join(';');
      csvRows.push(row);
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'laporan-transaksi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setStartDate(''); setEndDate(''); setSearchQuery(''); setActiveTab('Semua');
    setTimeout(() => fetchLaporan(), 100);
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
      <Toaster position="top-center" toastOptions={{ style: { background: '#24252A', color: '#e2e8f0', border: '1px solid #2C2E33' } }} />
      <Head><title>Laporan Keuangan</title></Head>
      
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-teal-400">Laporan & Kasir</h1>
        <button onClick={() => router.push('/')} className="bg-gray-700 text-white px-5 py-2.5 rounded-lg hover:bg-gray-600 transition-colors font-medium">
          Kembali ke POS
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 print:hidden">
        <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Transaksi Hari Ini</p>
            <h3 className="text-2xl font-bold text-yellow-400">{jumlahTransaksiHariIni} <span className="text-sm font-normal text-gray-500">Order</span></h3>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><IconCheck /></div>
            <p className="text-gray-400 text-sm font-medium mb-1">Kas Laci (Cash)</p>
            <h3 className="text-xl font-bold text-green-400">Rp{rekapKas.cash.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg">
            <p className="text-gray-400 text-sm font-medium mb-1">Transfer Bank</p>
            <h3 className="text-xl font-bold text-blue-400">Rp{rekapKas.transfer.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg">
            <p className="text-gray-400 text-sm font-medium mb-1">QRIS</p>
            <h3 className="text-xl font-bold text-purple-400">Rp{rekapKas.qris.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 rounded-2xl border border-teal-500 shadow-lg">
            <p className="text-teal-100 text-sm font-medium mb-1">Total Uang Masuk</p>
            <h3 className="text-xl font-bold text-white">Rp{rekapKas.total.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8 print:hidden">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Filter & Pencarian</h2>
        
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['Semua', 'Belum Kembali', 'Terlambat', 'Belum Lunas', 'Lunas', 'Closing Hari Ini'].map(tab => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs text-gray-400 mb-1">Cari Nama atau No HP</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Ketik disini..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2.5 px-3 focus:ring-teal-500" />
          </div>
          <div className="w-full">
            <label className="block text-xs text-gray-400 mb-1">Sewa/Laundry Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2.5 px-3" />
          </div>
          <div className="w-full">
            <label className="block text-xs text-gray-400 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2.5 px-3" />
          </div>
          <div className="flex gap-2 w-full mt-2 md:mt-0">
            <button onClick={fetchLaporan} className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-500 transition-colors font-medium">Terapkan</button>
            <button onClick={handleResetFilters} className="bg-gray-600 text-white py-2.5 px-4 rounded-lg hover:bg-gray-500 transition-colors font-medium">Reset</button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Data Transaksi</h2>
          <button onClick={handleExportCSV} className="bg-gray-700 border border-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center text-sm">
            <IconExport /> Ekspor CSV
          </button>
        </div>

        {loading && !initialLoading ? (
            <div className="flex justify-center py-8"><svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
        ) : sortedTransaksi.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto whitespace-nowrap">
              <thead className="bg-gray-900/50 text-sm">
                <tr>
                  <th className="p-4 cursor-pointer hover:text-teal-400" onClick={() => handleSort('created_at')}>Tgl Order {getSortIcon('created_at')}</th>
                  <th className="p-4 cursor-pointer hover:text-teal-400" onClick={() => handleSort('tanggal_mulai')}>Tgl Sewa {getSortIcon('tanggal_mulai')}</th>
                  <th className="p-4 cursor-pointer hover:text-teal-400" onClick={() => handleSort('pelanggan.nama')}>Pelanggan {getSortIcon('pelanggan.nama')}</th>
                  <th className="p-4 cursor-pointer hover:text-teal-400" onClick={() => handleSort('jumlah_terbayar')}>Uang Masuk {getSortIcon('jumlah_terbayar')}</th>
                  <th className="p-4">Sisa Pembayaran</th>
                  <th className="p-4 cursor-pointer hover:text-teal-400" onClick={() => handleSort('total_biaya')}>Total Biaya {getSortIcon('total_biaya')}</th>
                  <th className="p-4">Status Pengembalian / Pengerjaan</th>
                  <th className="p-4">Status Pembayaran</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedTransaksi.map(t => {
                  const isLate = moment().isAfter(moment(t.tanggal_selesai), 'day') && (t.status_pengembalian === 'Belum_Kembali' || t.status_pengembalian === null);
                  const isReturned = t.status_pengembalian === 'Sudah Kembali';
                  const isLunas = t.status_pembayaran === 'Lunas';
                  
                  const isBukanSewa = t.jenis_transaksi === 'Penjualan' || t.jenis_transaksi === 'Laundry';

                  return (
                    <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-gray-400 font-medium">{moment(t.created_at).format('DD/MM/YY HH:mm')}</td>
                      
                      <td className="p-4 text-gray-300">
                        {isBukanSewa || !t.tanggal_mulai ? (
                            t.jenis_transaksi === 'Penjualan' ? (
                                <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-700">
                                    Penjualan
                                </span>
                            ) : (
                                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-700">
                                    {t.jenis_transaksi || 'Langsung'}
                                </span>
                            )
                        ) : (
                            `${moment(t.tanggal_mulai).format('DD MMM')} - ${moment(t.tanggal_selesai).format('DD MMM')}`
                        )}
                      </td>
                      <td className="p-4 cursor-pointer hover:underline text-teal-400 font-medium" onClick={() => { setSelectedTransaction(t); setModalOpen(true); }}>
                        {t.pelanggan?.nama || 'Anonim'}
                        <p className="text-xs text-gray-500 mt-0.5">{t.pelanggan?.no_whatsapp}</p>
                      </td>
                      <td className="p-4 text-green-400 font-medium">
                        {formatRupiah(t.jumlah_terbayar || 0)}
                      </td>
                      <td className="p-4 text-red-400 font-medium">
                        {formatRupiah(t.total_biaya - (t.jumlah_terbayar || 0))}
                      </td>
                      <td className="p-4 font-semibold text-gray-200">
                        {formatRupiah(t.total_biaya)}
                      </td>
                      
                      {/* PERUBAHAN LOGIKA RENDERING STATUS */}
                      <td className="p-4">
                        {t.jenis_transaksi === 'Penjualan' ? (
                            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-700">Terjual</span>
                        ) : t.jenis_transaksi === 'Laundry' ? (
                            isReturned ? (
                                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">Sudah Diambil</span>
                            ) : (
                                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/30">Diproses</span>
                            )
                        ) : isReturned ? (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30">Sudah Kembali</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isLate ? 'bg-red-700 text-white border-red-800' : 'bg-red-500 text-white border-red-600'}`}>
                              {isLate ? 'Terlambat' : 'Belum Kembali'}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isLunas ? 'bg-green-600 text-white border-green-700' : 'bg-red-500 text-white border-red-600'}`}>
                          {isLunas ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {/* PERUBAHAN: Tombol muncul untuk Sewa DAN Laundry */}
                          {(!isReturned && t.jenis_transaksi !== 'Penjualan') && (
                            <button onClick={(e) => { e.stopPropagation(); updateStatusPengembalian(t.id, 'Sudah Kembali'); }} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-600">
                                {t.jenis_transaksi === 'Laundry' ? 'Tandai Diambil' : 'Tandai Kembali'}
                            </button>
                          )}
                          {!isLunas && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedForPelunasan(t); setPelunasanModalOpen(true); }} className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-teal-900/50">
                                Lunasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Tidak ada data transaksi yang ditemukan.</p>
        )}
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} transaction={selectedTransaction} />
      <PelunasanModal isOpen={pelunasanModalOpen} onClose={() => setPelunasanModalOpen(false)} transaction={selectedForPelunasan} onSuccess={fetchLaporan} />
    </div>
  );
}