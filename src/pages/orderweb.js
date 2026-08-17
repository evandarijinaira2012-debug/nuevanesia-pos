// Nama File: pages/orderweb.js (atau letak file orderweb milikmu)
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Sesuaikan letak folder utils kamu
import Head from 'next/head';
import moment from 'moment';
import 'moment/locale/id';
import toast, { Toaster } from 'react-hot-toast';

// --- HELPER WARNA LAYANAN ---
const getStripColor = (layanan) => {
  const layananLower = (layanan || "").toLowerCase();
  if (layananLower.includes("sewa")) return "bg-[#FF4501] text-white";
  if (layananLower.includes("laundry")) return "bg-[#007AFF] text-white";
  if (layananLower.includes("penjualan") || layananLower.includes("jual") || layananLower.includes("pembelian")) return "bg-[#1D1D1F] text-white";
  return "bg-[#FF4501] text-white"; 
};
// --- KOMPONEN IKON ---
const IconCheck = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);
const IconClock = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const IconX = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);

// --- MODAL RINCIAN TRANSAKSI (Diambil dari laporan.js) ---
const TransactionModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (angka) => `Rp${angka?.toLocaleString('id-ID')}`;
  const isBukanSewa = transaction.jenis_layanan === 'Penjualan' || transaction.jenis_layanan === 'Laundry';

  // Fungsi untuk handle klik nomor WA
  const handleWaClick = (noWa) => {
    if (!noWa || noWa === '-') return;

    const confirmChat = window.confirm('Apakah anda akan chat ke nomor ini?');
    if (confirmChat) {
      let formattedNo = noWa.replace(/\D/g, '');
      if (formattedNo.startsWith('0')) {
        formattedNo = '62' + formattedNo.substring(1);
      }
      window.open(`https://wa.me/${formattedNo}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-teal-400">Rincian Order Web</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">ID Transaksi:</p>
              <p className="font-semibold text-gray-200 text-xs mt-1">{transaction.id}</p>
            </div>
            <span className="bg-yellow-900/50 text-yellow-300 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-700">
                Menunggu Validasi
            </span>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">Nama Pelanggan:</p>
            <p className="font-semibold text-gray-200">{transaction.pelanggan?.nama || 'Anonim'}</p>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">Nomor WhatsApp:</p>
            {transaction.pelanggan?.no_whatsapp ? (
              <p 
                className="font-semibold text-teal-400 cursor-pointer hover:underline hover:text-teal-300 transition-colors"
                onClick={() => handleWaClick(transaction.pelanggan.no_whatsapp)}
                title="Klik untuk chat WhatsApp"
              >
                {transaction.pelanggan.no_whatsapp}
              </p>
            ) : (
              <p className="font-semibold text-gray-200">-</p>
            )}
          </div>
          
          <div className="border-b border-gray-700 pb-2">
            <p className="text-sm text-gray-400">{isBukanSewa ? 'Tanggal Transaksi:' : 'Tanggal Sewa:'}</p>
            {isBukanSewa || !transaction.tanggal_mulai ? (
                <p className="font-semibold text-gray-200">{moment(transaction.created_at).format('DD MMM YYYY, HH:mm')}</p>
            ) : (
                <p className="font-semibold text-gray-200">{moment(transaction.tanggal_mulai).format('DD MMM YYYY')} s/d {moment(transaction.tanggal_selesai).format('DD MMM YYYY')}</p>
            )}
          </div>

          {transaction.transaksi_detail && transaction.transaksi_detail.length > 0 && (
            <div className="border-b border-gray-700 pb-4 mt-2">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Item Dipesan:</h4>
              <ul className="space-y-1">
                {transaction.transaksi_detail.map((item, index) => {
                  const hargaFinal = item.harga_satuan !== undefined && item.harga_satuan !== null ? item.harga_satuan : (item.produk?.harga || 0);
                  return (
                    <li key={item.id || index} className="flex justify-between text-sm text-gray-300">
                      <span>
                        {item.nama_barang} 
                        {item.variasi_terpilih && <span className="text-gray-500 text-xs ml-1">({item.variasi_terpilih})</span>}
                        <span className="text-teal-500/80 ml-1">(x{item.jumlah})</span>
                      </span>
                      <span>{formatRupiah(item.jumlah * hargaFinal)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between font-bold text-xl mt-2 border-t border-gray-700 pt-2">
                <span className="text-teal-400">Total Biaya:</span>
                <span className="text-red-400">{formatRupiah(transaction.total_biaya)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODAL VALIDASI (Desain disesuaikan dengan Tailwind) ---
const ValidasiModal = ({ isOpen, onClose, transaction, onSuccess }) => {
    const [metodePembayaran, setMetodePembayaran] = useState('Transfer');
    const [nominalBayar, setNominalBayar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (transaction) {
            setNominalBayar(transaction.total_biaya);
            setMetodePembayaran(transaction.jenis_pembayaran || 'Transfer');
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const handleValidasiSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading('Memproses validasi...');
        const nominalFix = Number(nominalBayar);

        try {
            const isLunas = nominalFix >= transaction.total_biaya;
            const statusBayar = isLunas ? 'Lunas' : 'DP';
            const tipeLog = isLunas ? 'Pelunasan' : 'DP';

            // Update status order
            const { error: trxError } = await supabase
                .from('transaksi')
                .update({
                    status_validasi: 'Valid',
                    jumlah_terbayar: nominalFix,
                    status_pembayaran: statusBayar,
                    jenis_pembayaran: metodePembayaran
                })
                .eq('id', transaction.id);

            if (trxError) throw trxError;

            // Masukkan uang masuk ke Log Pembayaran
            if (nominalFix > 0) {
                const { error: logError } = await supabase.from('log_pembayaran').insert({
                    transaksi_id: transaction.id,
                    nominal: nominalFix,
                    jenis_pembayaran: metodePembayaran,
                    tipe: tipeLog
                });
                if (logError) console.error('Gagal mencatat log:', logError.message);
            }

            toast.success('Berhasil divalidasi ke kasir!', { id: toastId });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating order:', error.message);
            toast.error('Gagal memvalidasi pesanan.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-teal-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-teal-400">Validasi Pembayaran</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <form onSubmit={handleValidasiSubmit} className="space-y-4 mb-6">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-400">Total Tagihan</p>
                        <p className="text-xl font-bold text-red-400">Rp{transaction.total_biaya?.toLocaleString('id-ID')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Metode Pembayaran</label>
                        <select 
                            value={metodePembayaran} 
                            onChange={(e) => setMetodePembayaran(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 px-3 focus:ring-teal-500"
                        >
                            <option value="Transfer">Transfer Bank</option>
                            <option value="QRIS">QRIS</option>
                            <option value="Cash">Tunai / Cash</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Uang Diterima (DP/Lunas)</label>
                        <input 
                            type="number" 
                            value={nominalBayar}
                            onChange={(e) => setNominalBayar(e.target.value)}
                            required
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 px-3 focus:ring-teal-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold hover:bg-teal-500 transition-colors disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? 'MEMPROSES...' : 'SIMPAN & VALIDASI'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- HALAMAN UTAMA ORDER WEB ---
export default function OrderWeb() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Rincian
  const [rincianModalOpen, setRincianModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // State Modal Validasi
  const [validasiModalOpen, setValidasiModalOpen] = useState(false);
  const [selectedForValidasi, setSelectedForValidasi] = useState(null);

  const fetchWaitingOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          pelanggan (nama, no_whatsapp),
          transaksi_detail (id, nama_barang, jumlah, variasi_terpilih, harga_satuan, produk(harga, nama))
        `)
        .in('status_validasi', ['Menunggu', 'Request Batal', 'Dibatalkan'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      toast.error('Gagal mengambil data order web.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingOrders();
  }, []);

  const handleHapusPermanen = async (orderId, isAlreadyCanceled) => {
    const pesanKonfirmasi = isAlreadyCanceled 
      ? 'Orderan ini sudah dibatalkan customer. Yakin ingin menghapusnya permanen dari sistem?' 
      : 'Yakin ingin menolak dan menghapus orderan ini permanen?';
      
    const confirmDelete = window.confirm(pesanKonfirmasi);
    if (!confirmDelete) return;

    const toastId = toast.loading('Menghapus pesanan...');
    try {
      await supabase.from('transaksi_detail').delete().eq('transaksi_id', orderId);
      const { error } = await supabase.from('transaksi').delete().eq('id', orderId);

      if (error) throw error;

      toast.success('Orderan berhasil dihapus permanen.', { id: toastId });
      fetchWaitingOrders(); 
    } catch (error) {
      console.error('Error deleting order:', error.message);
      toast.error('Gagal menghapus orderan.', { id: toastId });
    }
  };

  const formatRupiah = (angka) => `Rp${angka?.toLocaleString('id-ID')}`;
  const activeOrders = orders.filter(o => o.status_validasi === 'Menunggu');
  const totalPotensiPendapatan = activeOrders.reduce((sum, order) => sum + (order.total_biaya || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Toaster position="top-center" toastOptions={{ style: { background: '#24252A', color: '#e2e8f0', border: '1px solid #2C2E33' } }} />
      <Head><title>Order Web (Menunggu)</title></Head>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-teal-400">Order Web (Menunggu Pembayaran)</h1>
        <p className="text-gray-400 mt-2">Data ini belum masuk ke Laporan Harian sebelum divalidasi.</p>
      </div>
      
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 rounded-2xl border border-teal-500 shadow-lg relative overflow-hidden flex items-center justify-between mb-8">
        <div>
            <p className="text-teal-100 text-sm font-medium mb-1">Potensi Pendapatan</p>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(totalPotensiPendapatan)}</h3>
        </div>
        <div className="bg-teal-900/50 p-4 rounded-full"><IconCheck /></div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
        {loading ? (
            <div className="flex justify-center py-8"><svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto whitespace-nowrap">
              <thead className="bg-gray-900/50 text-sm">
                <tr>
                  <th className="p-4">Tgl Order</th>
                  <th className="p-4">Pelanggan (Klik detail)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Jenis Layanan</th>
                  <th className="p-4">Total Biaya</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.map((order) => {
                  const isCanceled = order.status_validasi === 'Request Batal' || order.status_validasi === 'Dibatalkan';
                  
                  return (
                    <tr key={order.id} className={`border-b border-gray-700/50 transition-colors ${isCanceled ? 'bg-red-900/10' : 'hover:bg-gray-700/30'}`}>
                      <td className="p-4 text-gray-400 font-medium">{moment(order.created_at).format('DD/MM/YY HH:mm')}</td>
                      
                      <td className="p-4 cursor-pointer hover:underline text-teal-400 font-medium" 
                          onClick={() => { setSelectedTransaction(order); setRincianModalOpen(true); }}>
                        {order.pelanggan?.nama || 'Anonim'}
                        <p className="text-xs text-gray-500 mt-0.5">{order.pelanggan?.no_whatsapp}</p>
                      </td>
                      
                      <td className="p-4">
                          {isCanceled ? (
                              <span className="bg-orange-900/50 text-orange-300 px-3 py-1 rounded-full text-xs font-bold border border-orange-700 flex w-max items-center gap-1">
                                  Request Batal
                              </span>
                          ) : (
                              <span className="bg-yellow-900/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-700">
                                  Menunggu
                              </span>
                          )}
                      </td>

                      <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-sm ${getStripColor(order.jenis_layanan || order.jenis_transaksi)}`}>
                              {order.jenis_layanan || order.jenis_transaksi || 'UMUM'}
                          </span>
                      </td>
                      
                      <td className={`p-4 font-semibold ${isCanceled ? 'text-gray-500 line-through' : 'text-red-400'}`}>
                        {formatRupiah(order.total_biaya)}
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {!isCanceled && (
                              <button 
                                  onClick={() => { setSelectedForValidasi(order); setValidasiModalOpen(true); }} 
                                  className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-teal-900/50">
                                  Validasi
                              </button>
                          )}
                          <button 
                              onClick={() => handleHapusPermanen(order.id, isCanceled)} 
                              className={`${isCanceled ? 'bg-orange-700 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-500'} text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg`}>
                              {isCanceled ? 'Konfirmasi Batal & Hapus' : 'Tolak'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Belum ada orderan baru dari web.</p>
        )}
      </div>

      {/* --- RENDER MODAL --- */}
      <TransactionModal 
        isOpen={rincianModalOpen} 
        onClose={() => setRincianModalOpen(false)} 
        transaction={selectedTransaction} 
      />
      <ValidasiModal 
        isOpen={validasiModalOpen} 
        onClose={() => setValidasiModalOpen(false)} 
        transaction={selectedForValidasi} 
        onSuccess={fetchWaitingOrders} 
      />
    </div>
  );
}