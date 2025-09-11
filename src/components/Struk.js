import React from 'react';

const Struk = ({ transaksiData }) => {
  if (!transaksiData) {
    return <div>Data transaksi tidak ditemukan.</div>;
  }

  // Mengambil data dari prop transaksiData
  const { pelanggan, keranjang, tanggalMulai, tanggalSelesai, total, metodePembayaran, catatan, durasi, diskon } = transaksiData;

  // Fungsi untuk mengubah format tanggal menjadi lebih rapi dan menyertakan hari
  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Fungsi untuk mendapatkan tanggal dan waktu saat ini untuk struk, dengan hari dan jam
  const formatDateTime = () => {
    const now = new Date();
    const dateOptions = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedDate = now.toLocaleDateString('id-ID', dateOptions);
    const formattedTime = now.toLocaleTimeString('id-ID', timeOptions);
    return `${formattedDate}, Jam ${formattedTime}`;
  };
  
  // Hitung sub total secara manual dari keranjang
  const hitungSubTotal = () => {
    return keranjang.reduce((total, item) => total + (item.harga * item.qty), 0);
  };

  return (
    <div className="print-struk">
      <div className="header">
        <h1>NUEVANESIA</h1>
        <p>Jl Sarirasa Blok 4 No 114 Bandung</p>
        <p>Tlp. 08180.208.9909</p>
        <hr className="divider" />
      </div>

      <div className="details-with-center-date">
        <p>Tgl: {formatDateTime()}</p>
        <div className="space-after-date"></div>
        <p>Pelanggan: {pelanggan.nama || '-'}</p>
        <p>No.WhatsApp: {pelanggan.noWhatsapp || '-'}</p>
        <p>Jaminan: {pelanggan.jaminan || '-'}</p>
        <p>Tanggal Ambil: {formatDate(tanggalMulai)}</p>
        <p>Tanggal Kembali: {formatDate(tanggalSelesai)}</p>
        <hr className="divider" />
        <p>Pastikan pengembalian barang tidak terlambat</p>
        <hr className="divider" />
      </div>
      
      <div className="items">
        {keranjang.map(item => (
          <div key={item.id} className="item">
            <span>{item.nama}</span>
            <span>{item.qty} x Rp{item.harga.toLocaleString('id-ID')}</span>
            <span>Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <hr className="divider" />
        <div className="summary-row">
          <span>Durasi:</span>
          <span>{durasi} hari</span>
        </div>
        <div className="summary-row">
          <span>Sub Total:</span>
          <span>Rp{hitungSubTotal().toLocaleString('id-ID')}</span>
        </div>
        <div className="summary-row">
          <span>Diskon:</span>
          <span>Rp{diskon.toLocaleString('id-ID')}</span>
        </div>
        <div className="summary-row total-row">
          <span>TOTAL:</span>
          <span>Rp{total.toLocaleString('id-ID')}</span>
        </div>
        <hr className="divider" />
      </div>
      
      <div className="footer">
        <div className="summary-row">
          <span>Metode Pembayaran:</span>
          <span><strong>{metodePembayaran}</strong></span>
        </div>
        <p className="note">Catatan: <strong>{catatan || '-'}</strong></p>
        <div className="space-before-thanks"></div>
        <p>Mulai petualanganmu dari sini</p>
        <p>karena Nuevanesia teman camping saat healing.</p>
      </div>

      <style jsx>{`
        .print-struk {
          width: 80mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 10px;
          line-height: 1.2;
          padding: 5mm;
          margin: 0;
        }
        .header, .items, .footer, .summary-section {
          text-align: center;
          margin-bottom: 5px;
        }
        .details-with-center-date {
          text-align: left;
          margin-bottom: 5px;
        }
        .details-with-center-date > p:first-child {
            text-align: center;
        }
        .space-after-date {
            margin-bottom: 5px;
        }
        h1 {
          font-size: 14px;
          margin: 0;
        }
        .divider {
          border-top: 1px dashed black;
          margin: 5px 0;
        }
        .items .item {
          display: flex;
          justify-content: space-between;
        }
        .item span:first-child {
          width: 50%;
          text-align: left;
        }
        .item span:nth-child(2), .item span:nth-child(3) {
          width: 25%;
          text-align: right;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .total-row {
          font-weight: bold;
          font-size: 12px;
        }
        .note {
            text-align: left; /* Membuat baris catatan rata kiri */
        }
        .space-before-thanks {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Struk;