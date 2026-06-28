// src/components/Struk.js
import React from 'react';

// Fungsi pembantu otomatis untuk meratakan teks kanan-kiri (misal: Nama Barang ...... Total)
const buatBarisKolom = (kiri, kanan, lebarMaksimal = 48) => {
  const sisaSpasi = lebarMaksimal - kiri.length - kanan.length;
  return kiri + " ".repeat(sisaSpasi > 0 ? sisaSpasi : 1) + kanan + "\n";
};

// 1. FUNGSI UTAMA: Pembuat teks untuk printer Bluetooth & Preview Layar
export const generateTextStruk = (transaksiData, lebarMaksimal = 48) => {
  if (!transaksiData) return '';

  const { pelanggan, keranjang, tanggalMulai, tanggalSelesai, total, metodePembayaran, catatan, durasi, diskonOtomatis, diskonManual } = transaksiData;

  const ESC = '\x1B';
  const CLEAR = ESC + '@'; 
  const CENTER = ESC + 'a' + '\x01'; 
  const LEFT = ESC + 'a' + '\x00'; 

  const formatRupiah = (angka) => `Rp${Number(angka).toLocaleString('id-ID')}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const waktuCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + `, Jam ` + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let txt = CLEAR;

  // --- Mulai Susun Konten Struk Di Sini ---
  txt += CENTER + "NUEVANESIA\n";
  txt += "Jl Sarirasa Blok 4 No 114 Bandung\n";
  txt += "Tlp. 08180.208.9909\n";
  txt += "-".repeat(lebarMaksimal) + "\n";

  txt += LEFT + `Tgl Cetak   : ${waktuCetak}\n`;
  txt += `Pelanggan   : ${pelanggan?.nama || '-'}\n`;
  txt += `No.WhatsApp : ${pelanggan?.noWhatsapp || '-'}\n`;
  txt += `Jaminan     : ${pelanggan?.jaminan || '-'}\n`;
  txt += `Tgl Ambil   : ${formatDate(tanggalMulai)}\n`;
  txt += `Tgl Kembali : ${formatDate(tanggalSelesai)}\n`;
  txt += "-".repeat(lebarMaksimal) + "\n";

  let subTotal = 0;
  keranjang?.forEach(item => {
    subTotal += item.harga * item.qty;
    txt += `${item.nama}\n`;
    txt += buatBarisKolom(`  ${formatRupiah(item.harga)} x${item.qty}`, formatRupiah(item.harga * item.qty), lebarMaksimal);
  });

  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("Durasi:", `${durasi || 0} hari`, lebarMaksimal);
  txt += buatBarisKolom("Sub Total:", formatRupiah(subTotal), lebarMaksimal);
  
  if (diskonOtomatis > 0) txt += buatBarisKolom("Diskon Otomatis:", formatRupiah(diskonOtomatis), lebarMaksimal);
  if (diskonManual > 0) txt += buatBarisKolom("Diskon Manual:", `-${formatRupiah(diskonManual)}`, lebarMaksimal);
  
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("TOTAL:", formatRupiah(total || 0), lebarMaksimal);
  txt += "-".repeat(lebarMaksimal) + "\n";

  txt += `Metode Bayar: ${metodePembayaran || '-'}\n`;
  txt += `Catatan: ${catatan || '-'}\n\n`;
  txt += CENTER + "Mulai petualanganmu dari sini\n";
  txt += "Nuevanesia teman camping saat healing\n\n\n\n"; 

  return txt;
};

// 2. KOMPONEN VISUAL: Hanya bertugas menampilkan hasil teks di atas agar muncul di layar monitor
const Struk = ({ transaksiData, lebarMaksimal = 48 }) => {
  const teksStruk = generateTextStruk(transaksiData, lebarMaksimal);
  
  return (
    <pre style={{
      fontFamily: 'Courier New, Courier, monospace',
      fontSize: '13px',
      background: 'white',
      color: 'black',
      padding: '20px',
      whiteSpace: 'pre-wrap',
      width: 'fit-content',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      {/* Bersihkan kode biner printer khusus agar tidak merusak tampilan teks di layar browser */}
      {teksStruk.replace(/[\x1B\x40\x61\x01\x00]/g, '')}
    </pre>
  );
};

export default Struk;