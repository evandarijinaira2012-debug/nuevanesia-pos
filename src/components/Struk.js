// src/components/Struk.js
import React from 'react';

// Fungsi pembantu otomatis untuk meratakan teks kanan-kiri (misal: Nama Barang ...... Total)
const buatBarisKolom = (kiri, kanan, lebarMaksimal = 48) => {
  const sisaSpasi = lebarMaksimal - kiri.length - kanan.length;
  return kiri + " ".repeat(sisaSpasi > 0 ? sisaSpasi : 1) + kanan + "\n";
};

// 1. FUNGSI UTAMA: Pembuat teks murni untuk RawBT & Preview Layar
export const generateTextStruk = (transaksiData, lebarMaksimal = 48) => {
  if (!transaksiData) return '';

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
    diskonManual = 0 
  } = transaksiData;

  const formatRupiah = (angka) => `Rp${Number(angka).toLocaleString('id-ID')}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const waktuCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + `, Jam ` + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let txt = "";

  // --- Header Struk (Perataan tengah manual menggunakan spasi agar cocok di RawBT & Layar) ---
  const t1 = "NUEVANESIA";
  const t2 = "Jl Sarirasa Blok 4 No 114 Bandung";
  const t3 = "Tlp. 08180.208.9909";
  
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - t1.length) / 2))) + t1 + "\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - t2.length) / 2))) + t2 + "\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - t3.length) / 2))) + t3 + "\n";
  txt += "-".repeat(lebarMaksimal) + "\n";

  // --- Data Transaksi & Pelanggan ---
  txt += `Tgl Cetak   : ${waktuCetak}\n`;
  txt += `Pelanggan   : ${pelanggan?.nama || '-'}\n`;
  txt += `No.WhatsApp : ${pelanggan?.noWhatsapp || '-'}\n`;
  txt += `Jaminan     : ${pelanggan?.jaminan || '-'}\n`;
  txt += `Tgl Ambil   : ${formatDate(tanggalMulai)}\n`;
  txt += `Tgl Kembali : ${formatDate(tanggalSelesai)}\n`;
  txt += "-".repeat(lebarMaksimal) + "\n";

  // --- Daftar Item ---
  let subTotal = 0;
  keranjang?.forEach(item => {
    subTotal += item.harga * item.qty;
    txt += `${item.nama}\n`;
    txt += buatBarisKolom(`  ${formatRupiah(item.harga)} x${item.qty}`, formatRupiah(item.harga * item.qty), lebarMaksimal);
  });

  // --- Rincian Pembayaran & Fitur Total Diskon Baru ---
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("Durasi:", `${durasi || 0} hari`, lebarMaksimal);
  txt += buatBarisKolom("Sub Total:", formatRupiah(subTotal), lebarMaksimal);
  
  // Akumulasi total diskon (Otomatis + Manual) sesuai keinginanmu
  const totalDiskon = Number(diskonOtomatis) + Number(diskonManual);
  if (totalDiskon > 0) {
    txt += buatBarisKolom("Total Diskon:", `-${formatRupiah(totalDiskon)}`, lebarMaksimal);
  }
  
  txt += "-".repeat(lebarMaksimal) + "\n";
  txt += buatBarisKolom("TOTAL:", formatRupiah(total || 0), lebarMaksimal);
  txt += "-".repeat(lebarMaksimal) + "\n";

  // --- Footer Struk ---
  txt += `Metode Bayar: ${metodePembayaran || '-'}\n`;
  txt += `Catatan     : ${catatan || '-'}\n\n`;
  
  const f1 = "Mulai petualanganmu dari sini";
  const f2 = "Nuevanesia teman camping saat healing";
  
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - f1.length) / 2))) + f1 + "\n";
  txt += " ".repeat(Math.max(0, Math.floor((lebarMaksimal - f2.length) / 2))) + f2 + "\n\n\n\n"; 

  return txt;
};

// 2. KOMPONEN VISUAL: Menampilkan hasil teks di atas agar muncul di layar monitor POS
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
      {teksStruk}
    </pre>
  );
};

export default Struk;