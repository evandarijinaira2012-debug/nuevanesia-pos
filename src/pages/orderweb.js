import React, { useState, useEffect } from 'react';
// SESUAIKAN JALUR IMPORT SUPABASE DI BAWAH INI DENGAN PROJECT-MU:
import { supabase } from '../utils/supabaseClient';

export default function OrderWeb() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Validasi
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [nominalBayar, setNominalBayar] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState('Transfer');

  // Mengambil data pesanan yang berstatus "Menunggu"
  const fetchWaitingOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaksi')
        // Kita juga menarik data pelanggan untuk menampilkan namanya
        .select(`
          *,
          pelanggan (nama, no_whatsapp)
        `)
        .eq('status_validasi', 'Menunggu')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      alert('Gagal mengambil data order web.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingOrders();
  }, []);

  // Membuka modal validasi dan menyiapkan data awal
  const openValidasiModal = (order) => {
    setSelectedOrder(order);
    setNominalBayar(order.total_biaya); // Default nominal diset sama dengan total biaya
    setMetodePembayaran(order.jenis_pembayaran || 'Transfer');
    setShowModal(true);
  };

  // Menutup modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // Proses Update Data ke Supabase
  const handleValidasiSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Konversi input ke angka agar aman saat dimasukkan ke database
    const nominalFix = Number(nominalBayar);

    try {
      // 1. Tentukan status pembayaran apakah Lunas atau DP
      const isLunas = nominalFix >= selectedOrder.total_biaya;
      const statusBayar = isLunas ? 'Lunas' : 'DP';
      
      // Gunakan kata 'Pelunasan' untuk log karena database menolak kata 'Lunas'
      const tipeLog = isLunas ? 'Pelunasan' : 'DP';

      // 2. Update status order menjadi Valid
      const { error: trxError } = await supabase
        .from('transaksi')
        .update({
          status_validasi: 'Valid',
          jumlah_terbayar: nominalFix,
          status_pembayaran: statusBayar,
          jenis_pembayaran: metodePembayaran
        })
        .eq('id', selectedOrder.id);

      if (trxError) throw trxError;

      // 3. Masukkan uang masuk ke Log Pembayaran agar terbaca di Widget Laporan.js
      if (nominalFix > 0) {
        const { error: logError } = await supabase.from('log_pembayaran').insert({
          transaksi_id: selectedOrder.id,
          nominal: nominalFix,
          jenis_pembayaran: metodePembayaran,
          tipe: tipeLog
        });
        
        // Memunculkan peringatan di console log jika uang gagal masuk ke widget
        if (logError) console.error('Gagal mencatat log uang masuk:', logError.message);
      }

      alert('Berhasil! Pembayaran divalidasi dan masuk ke sistem kasir.');
      closeModal();
      fetchWaitingOrders();
    } catch (error) {
      console.error('Error updating order:', error.message);
      alert('Gagal memvalidasi pesanan.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Daftar Order Web (Menunggu Pembayaran)</h2>
      <p>Data di bawah ini belum masuk ke Laporan Harian (Closing) sebelum divalidasi.</p>
      <hr style={{ marginBottom: '20px' }} />

      {loading ? (
        <p>Memuat data orderan web...</p>
      ) : orders.length === 0 ? (
        <p>Belum ada orderan baru dari web.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f0f0f0' }}>
            <tr>
              <th>Tgl Order</th>
              <th>Nama Pelanggan</th>
              <th>Jenis Layanan</th>
              <th>Total Biaya</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleString('id-ID')}</td>
                <td>{order.pelanggan?.nama || 'Tanpa Nama'} <br/> <small>{order.pelanggan?.no_whatsapp}</small></td>
                <td>{order.jenis_transaksi}</td>
                <td style={{ color: 'red', fontWeight: 'bold' }}>
                  Rp {order.total_biaya?.toLocaleString('id-ID')}
                </td>
                <td>
                  <button 
                    onClick={() => openValidasiModal(order)}
                    style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Validasi Pembayaran
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL VALIDASI PEMBAYARAN */}
      {showModal && selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>Validasi Pembayaran</h3>
            <p>Order: <strong>{selectedOrder.jenis_transaksi}</strong> - {selectedOrder.pelanggan?.nama}</p>
            <p>Total Tagihan: <strong>Rp {selectedOrder.total_biaya?.toLocaleString('id-ID')}</strong></p>
            
            <form onSubmit={handleValidasiSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Uang Diterima (DP / Lunas)</label>
                <input 
                  type="number" 
                  value={nominalBayar}
                  onChange={(e) => setNominalBayar(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Metode Pembayaran</label>
                <select 
                  value={metodePembayaran}
                  onChange={(e) => setMetodePembayaran(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Cash">Tunai / Cash</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 12px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 12px', border: 'none', cursor: 'pointer' }}>Simpan & Validasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}