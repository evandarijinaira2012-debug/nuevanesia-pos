// components/StrukLaundry.js
import React from 'react';

const StrukLaundry = ({ data }) => {
  if (!data || !data.transaksiData) return <div>Data transaksi Laundry tidak ditemukan.</div>;

  const { transaksiData, pelangganData, keranjang } = data;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatDateTime = () => {
    const now = new Date();
    const dateOptions = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedDate = now.toLocaleDateString('id-ID', dateOptions);
    const formattedTime = now.toLocaleTimeString('id-ID', timeOptions);
    return `${formattedDate}, Jam ${formattedTime}`;
  };
  
  const hitungSubTotal = () => {
    return keranjang.reduce((total, item) => total + (item.harga * item.qty), 0);
  };

  const subTotal = hitungSubTotal();
  // Karena diskon manual tidak dikirim langsung di dataUntukStruk, kita hitung selisihnya
  const diskon = subTotal - transaksiData.total_biaya;

  return (
    <div className="print-struk">
      <div className="header">
        <img src="/nuevanesialogo.png" alt="nuevanesialogo" className="logo-struk" />
        <div className="alamat-toko">
          <p></p>
          <p>Jl Sarirasa V Blok 4 No 114 Bandung</p>
          <p>Tlp. 08180.208.9909</p>
          <p style={{ marginTop: '5px', fontSize: '14px' }}>
             <strong>{data.isReprint ? '--- CETAK ULANG ARSIP LAUNDRY ---' : '---LAUNDRY---'}</strong>
          </p>
        </div>
        <hr className="divider" />
      </div>

      <div className="details-with-center-date">
        <p>Tgl Order: {formatDateTime()}</p>
        <div className="space-after-date"></div>
        <p>Pelanggan:<strong> {pelangganData.nama || '-'}</strong></p>
        <p>No.WhatsApp: {pelangganData.noWhatsapp || '-'}</p>
        <p>Tanggal Masuk: {formatDate(transaksiData.tanggal_mulai)}</p>
        <p>Estimasi Selesai: {formatDate(transaksiData.tanggal_selesai)}</p>
        <hr className="divider" />
      </div>
      
      <div className="items">
        {keranjang.map((item, index) => (
          <div key={item.id || index} className="item">
            <div className="item-info">
              <span className="item-name">{item.nama}</span>
              <span className="item-qty">{item.harga.toLocaleString('id-ID')} x{item.qty}</span>
            </div>
            <span className="item-total">Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <hr className="divider" />
        <div className="summary-row">
          <span>Sub Total:</span>
          <span>Rp{subTotal.toLocaleString('id-ID')}</span>
        </div>
        
        {diskon > 0 && (
          <div className="summary-row diskon">
            <span>Diskon/Potongan:</span>
            <span>-Rp{diskon.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="summary-row total-row">
          <span>TOTAL:</span>
          <span>Rp{transaksiData.total_biaya.toLocaleString('id-ID')}</span>
        </div>
        <hr className="divider" />
      </div>
      
      <div className="footer">
        {/* Menggunakan paragraph biasa (p) agar teks rapat setelah titik dua */}
        <p style={{ textAlign: 'left', margin: '4px 0' }}>
          Status Pembayaran: <strong>{transaksiData.status_pembayaran?.toUpperCase() || '-'}</strong>
        </p>
        <p style={{ textAlign: 'left', margin: '4px 0' }}>
          Metode Pembayaran: <strong>{transaksiData.jenis_pembayaran}</strong>
        </p>
        <p className="note">Catatan: <strong>{transaksiData.catatan || '-'}</strong></p>
        <div className="space-before-thanks"></div>
        <p><i>Mulai petualanganmu dari sini</i></p>
        <p><i>Nuevanesia teman camping saat healing</i></p>
        <p><strong>www.nuevanesia.com</strong></p>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; }
        .print-struk { width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.3; padding: 4mm; margin: 0 auto; background: white; }
        .header, .footer { text-align: center; margin-bottom: 5px; }
        .logo-struk { max-width: 38mm; height: auto; margin: 0 auto 8px auto; display: block; }
        .details-with-center-date { text-align: left; margin-bottom: 5px; }
        .details-with-center-date > p:first-child { text-align: center; }
        .space-after-date { margin-bottom: 5px; }
        .divider { border: none; border-top: 1px dashed black; margin: 6px 0; }
        .items { margin-bottom: 5px; }
        .items .item { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .item-info { display: flex; flex-direction: column; text-align: left; max-width: 70%; }
        .item-name { font-weight: bold; }
        .item-qty { font-size: 10px; color: #333; }
        .item-total { text-align: right; white-space: nowrap; }
        .summary-section { margin-top: 5px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .diskon { color: black; font-style: italic; }
        .total-row { font-weight: bold; font-size: 13px; margin-top: 4px; }
        .note { text-align: left; margin-top: 5px; }
        .space-before-thanks { margin-top: 15px; }
        .footer p { margin: 2px 0; }
      `}</style>
    </div>
  );
};

export default StrukLaundry;