import React from 'react';

const Struk = ({ transaksiData }) => {
  if (!transaksiData) {
    return <div>Data transaksi tidak ditemukan.</div>;
  }

  // Tambahkan penangkapan statusPembayaran dan jumlahTerbayar dari transaksiData
  const { 
    pelanggan, 
    keranjang, 
    tanggalMulai, 
    tanggalSelesai, 
    total, 
    metodePembayaran, 
    catatan, 
    durasi, 
    diskonOtomatis = 0, 
    diskonManual = 0,
    statusPembayaran, // Ditambahkan
    jumlahTerbayar    // Ditambahkan
  } = transaksiData;

  const formatDate = (dateString) => {
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

  // Fungsi baru khusus untuk format tanggal DP sesuai permintaan (tgl/bulan/thn - jam)
  const formatTglDP = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };
  
  const hitungSubTotal = () => {
    return keranjang.reduce((total, item) => total + (item.harga * item.qty), 0);
  };

  const totalDiskon = Number(diskonOtomatis) + Number(diskonManual);

  return (
    <div className="print-struk">
      <div className="header">
        <img src="/nuevanesialogo.png" alt="nuevanesialogo" className="logo-struk" />
        <div className="alamat-toko">
          <p>Jl Sarirasa V Blok 4 No 114 Bandung</p>
          <p>Tlp. 08180.208.9909</p>
          <p style={{ marginTop: '5px', fontSize: '14px' }}><strong>---SEWA---</strong></p>
        </div>
        <hr className="divider" />
      </div>

      <div className="details-with-center-date">
        <p>Tgl Order: {formatDateTime()}</p>
        <div className="space-after-date"></div>
        <p>Pelanggan:<strong> {pelanggan.nama || '-'}</strong></p>
        <p>No.WhatsApp: {pelanggan.noWhatsapp || '-'}</p>
        <p>Jaminan: {pelanggan.jaminan || '-'}</p>
        <p>Tanggal Ambil: {formatDate(tanggalMulai)}</p>
        <p>Tanggal Kembali: {formatDate(tanggalSelesai)}</p>
        <hr className="divider" />
        <p style={{ textAlign: 'left', fontSize: '9px' }}>
          <strong>CATATAN:</strong>
          <br />
          • Keterlambatan pengembalian akan otomatis memperpanjang durasi sewa.
          <br />
          • Mohon informasikan admin apabila terdapat kerusakan barang.
        </p>
        <hr className="divider" />
      </div>
      
      <div className="items">
        {keranjang.map(item => (
          <div key={item.id} className="item">
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
          <span>Durasi:</span>
          <span>{durasi} Malam</span>
        </div>
        <div className="summary-row">
          <span>Sub Total:</span>
          <span>Rp{hitungSubTotal().toLocaleString('id-ID')}</span>
        </div>
        
        {Number(diskonOtomatis) > 0 && (
          <div className="summary-row diskon">
            <span>Diskon:</span>
            <span>-Rp{Number(diskonOtomatis).toLocaleString('id-ID')}</span>
          </div>
        )}
        
        {Number(diskonManual) > 0 && (
          <div className="summary-row diskon">
            <span>Diskon/Promo Khusus:</span>
            <span>-Rp{Number(diskonManual).toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="summary-row total-row">
          <span>TOTAL:</span>
          <span>Rp{total.toLocaleString('id-ID')}</span>
        </div>

        {/* --- BLOK PENAMBAHAN INFORMASI DP --- */}
        {statusPembayaran === 'DP' && (
          <div className="dp-section">
            <div className="summary-row dp-row">
              <span>DP:</span>
              <span>Rp{Number(jumlahTerbayar).toLocaleString('id-ID')}</span>
            </div>
            <div className="summary-row date-row">
              <span>Tgl DP:</span>
              <span>{formatTglDP()}</span>
            </div>
            <div className="summary-row total-row">
              <span>SISA TAGIHAN:</span>
              <span>Rp{(total - jumlahTerbayar).toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
        {/* --- AKHIR BLOK DP --- */}

        <hr className="divider" />
      </div>
      
      <div className="footer">
        <div className="summary-row">
          <span>Metode Pembayaran:</span>
          <span><strong>{metodePembayaran}</strong></span>
        </div>
        <p className="note">Catatan: <strong>{catatan || '-'}</strong></p>
        <div className="space-before-thanks"></div>
        <p><i>Mulai petualanganmu dari sini</i></p>
        <p><i>Nuevanesia teman camping saat healing</i></p>
        <p><strong>www.nuevanesia.com</strong></p>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .print-struk {
          width: 80mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.3;
          padding: 4mm;
          margin: 0 auto;
          background: white;
        }
        .header, .footer {
          text-align: center;
          margin-bottom: 5px;
        }
        .logo-struk {
          max-width: 38mm; 
          height: auto;
          margin: 0 auto 8px auto; 
          display: block;
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
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 5px 0;
        }
        .divider {
          border: none;
          border-top: 1px dashed black;
          margin: 6px 0;
        }
        .items {
          margin-bottom: 5px;
        }
        .items .item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .item-info {
          display: flex;
          flex-direction: column;
          text-align: left;
          max-width: 70%;
        }
        .item-name {
          font-weight: bold;
        }
        .item-qty {
          font-size: 10px;
          color: #333;
        }
        .item-total {
          text-align: right;
          white-space: nowrap;
        }
        .summary-section {
          margin-top: 5px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .diskon {
          color: black;
          font-style: italic;
        }
        .total-row {
          font-weight: bold;
          font-size: 13px;
          margin-top: 4px;
        }
        .dp-section {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px dotted #ccc;
        }
        .dp-row {
          font-weight: bold;
        }
        .date-row {
          font-size: 10px;
          color: #555;
        }
        .note {
          text-align: left;
          margin-top: 5px;
        }
        .space-before-thanks {
          margin-top: 15px;
        }
        .footer p {
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
};

export default Struk;