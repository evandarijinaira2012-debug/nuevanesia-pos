import React from 'react';

// Fungsi pembantu otomatis untuk membuat teks rata kanan-kiri (Nama Barang ........ Total)
const buatBarisKolom = (kiri, kanan, lebarMaksimal = 48) => {
  const sisaSpasi = lebarMaksimal - kiri.length - kanan.length;
  return kiri + " ".repeat(sisaSpasi > 0 ? sisaSpasi : 1) + kanan + "\n";
};

// 1. FUNGSI LOGIKA TEKS: Dipanggil oleh cetak-struk.js untuk dikirim ke RawBT
export const generateTextStruk = (transaksiData, lebarMaksimal = 48) => {
  if (!transaksiData) return '';

  const { pelanggan, keranjang, tanggalMulai, tanggalSelesai, total, metodePembayaran, catatan, durasi, diskonOtomatis = 0, diskonManual = 0 } = transaksiData;

  const formatRupiah = (angka) => `Rp${Number(angka).toLocaleString('id-ID')}`;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const waktuCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + `, Jam ` + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let txt = "";

  // Header Struk
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 10) / 2))) + "NUEVANESIA\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 33) / 2))) + "Jl Sarirasa Blok 4 No 114 Bandung\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 19) / 2))) + "Tlp. 08180.208.9909\n";
  txt += "-".repeat(lebarMaksimal) + "\n";

  // Detail Pelanggan
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - waktuCetak.length) / 2))) + waktuCetak + "\n\n";
  txt += `Pelanggan   : ${pelanggan?.nama || '-'}\n`;
  txt += `No.WhatsApp : ${pelanggan?.noWhatsapp || '-'}\n`;
  txt += `Jaminan     : ${pelanggan?.jaminan || '-'}\n`;
  txt += `Tanggal Ambil: ${formatDate(tanggalMulai)}\n`;
  txt += `Tanggal Kembali: ${formatDate(tanggalSelesai)}\n`;
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 44) / 2))) + "Pastikan pengembalian barang tidak terlambat\n";
  txt += "-".repeat(lebarMaksimal) + "\n";

  // Daftar Item Barang
  let subTotal = 0;
  keranjang?.forEach(item => {
    subTotal += item.harga * item.qty;
    txt += `${item.nama}\n`;
    txt += buatBarisKolom(`  ${formatRupiah(item.harga)} x${item.qty}`, formatRupiah(item.harga * item.qty), lebarMaksimal);
  });

  // Bagian Perhitungan Total & Diskon
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("Durasi:", `${durasi || 0} hari`, lebarMaksimal);
  txt += buatBarisKolom("Sub Total:", formatRupiah(subTotal), lebarMaksimal);
  
  // LOGIKA TAMBAHAN: Menghitung akumulasi total diskon
  const totalDiskon = Number(diskonOtomatis) + Number(diskonManual);
  if (totalDiskon > 0) {
    txt += buatBarisKolom("Total Diskon:", `-${formatRupiah(totalDiskon)}`, lebarMaksimal);
  }
  
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("TOTAL:", formatRupiah(total || 0), lebarMaksimal);
  txt += "-".repeat(lebarMaksimal) + "\n";

  // Footer Struk
  txt += `Metode Pembayaran: ${metodePembayaran || '-'}\n`;
  txt += `Catatan: ${catatan || '-'}\n\n`;
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 28) / 2))) + "Mulai petualanganmu dari sini\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - 37) / 2))) + "Nuevanesia teman camping saat healing\n\n\n";

  return txt;
};

// 2. KOMPONEN TAMPILAN PREVIEW: Muncul di layar tablet browser POS
const Struk = ({ transaksiData }) => {
  if (!transaksiData) {
    return <div>Data transaksi tidak ditemukan.</div>;
  }

  const { pelanggan, keranjang, tanggalMulai, tanggalSelesai, total, metodePembayaran, catatan, durasi, diskonOtomatis = 0, diskonManual = 0 } = transaksiData;

  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatDateTime = () => {
    const now = new Date();
    const dateOptions = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${now.toLocaleDateString('id-ID', dateOptions)}, Jam ${now.toLocaleTimeString('id-ID', timeOptions)}`;
  };
  
  const hitungSubTotal = () => {
    return keranjang.reduce((total, item) => total + (item.harga * item.qty), 0);
  };

  const totalDiskon = Number(diskonOtomatis) + Number(diskonManual);

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
        <p style={{ textAlign: 'center' }}>Pastikan pengembalian barang tidak terlambat</p>
        <hr className="divider" />
      </div>
      
      <div className="items">
        {keranjang.map(item => (
          <div key={item.id} className="item" style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '4px' }}>
            <div style={{ textAlign: 'left', width: '70%' }}>
              <div>{item.nama}</div>
              <div style={{ color: '#555', fontSize: '9px' }}>Rp{item.harga.toLocaleString('id-ID')} x{item.qty}</div>
            </div>
            <div style={{ textAlign: 'right', width: '30%' }}>
              Rp{(item.harga * item.qty).toLocaleString('id-ID')}
            </div>
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
        
        {/* LOGIKA PREVIEW DISKON */}
        {totalDiskon > 0 && (
          <div className="summary-row" style={{ color: '#dc2626', fontWeight: 'bold' }}>
            <span>Total Diskon:</span>
            <span>-Rp{totalDiskon.toLocaleString('id-ID')}</span>
          </div>
        )}
        
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
        <p>Nuevanesia teman camping saat healing</p>
      </div>

      <style jsx>{`
        .print-struk {
          width: 80mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.3;
          padding: 5mm;
          background: white;
          color: black;
        }
        .header, .footer, .summary-section {
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
        h1 {
          font-size: 15px;
          margin: 0;
        }
        .divider {
          border-top: 1px dashed black;
          margin: 5px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .total-row {
          font-weight: bold;
          font-size: 13px;
        }
        .note {
            text-align: left;
        }
        .space-before-thanks {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Struk;