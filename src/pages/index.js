import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const [produk, setProduk] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showStrukPopup, setShowStrukPopup] = useState(false);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [alamatPelanggan, setAlamatPelanggan] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [jaminan, setJaminan] = useState(''); // Perbaikan: Nilai awal kosong
  const [kategoriTerpilih, setKategoriTerpilih] = useState('Semua');
  const [semuaKategori, setSemuaKategori] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState(null);
  const router = useRouter();

  const [metodePembayaran, setMetodePembayaran] = useState('Cash');
  const [catatanKasir, setCatatanKasir] = useState('');

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

  useEffect(() => {
    async function fetchProduk() {
      const { data, error } = await supabase.from('produk').select('*');
      if (error) {
        console.error('Error fetching produk:', error);
      } else {
        setProduk(data);
        const uniqueKategori = ['Semua', ...new Set(data.map(p => p.kategori))];
        setSemuaKategori(uniqueKategori);
      }
    }
    fetchProduk();
  }, []);

  if (!session) {
    return null;
  }

  const handleCetak = () => {
    window.print();
    setKeranjang([]);
    setShowStrukPopup(false);
    setNamaPelanggan('');
    setAlamatPelanggan('');
    setNoWhatsapp('');
    setJaminan('');
    setTanggalMulai('');
    setTanggalSelesai('');
    setMetodePembayaran('Cash');
    setCatatanKasir(''); // Perbaikan: Tambahkan baris ini
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const hitungDurasiHari = () => {
    if (tanggalMulai && tanggalSelesai) {
      const tglMulai = new Date(tanggalMulai);
      const tglSelesai = new Date(tanggalSelesai);
      const selisihWaktu = tglSelesai.getTime() - tglMulai.getTime();
      const selisihHari = Math.ceil(selisihWaktu / (1000 * 3600 * 24));
      return selisihHari > 0 ? selisihHari : 0;
    }
    return 0;
  };

  const hitungSubtotalPerMalam = () => {
    return keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  };

  const hitungTotalAkhir = () => {
    const durasi = hitungDurasiHari();
    if (durasi === 0) return 0;
    const subtotalPerMalam = hitungSubtotalPerMalam();
    if (durasi <= 2) {
      return subtotalPerMalam * durasi;
    }
    const biayaDuaMalamPertama = subtotalPerMalam * 2;
    const sisaMalam = durasi - 2;
    const biayaDiskon = (subtotalPerMalam * 0.5) * sisaMalam;
    return biayaDuaMalamPertama + biayaDiskon;
  };

  const tambahKeKeranjang = (item) => {
    const itemSudahAda = keranjang.find((i) => i.id === item.id);
    if (itemSudahAda) {
      setKeranjang(
        keranjang.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setKeranjang([...keranjang, { ...item, qty: 1 }]);
    }
  };
  
  const kurangDariKeranjang = (itemId) => {
    const item = keranjang.find((i) => i.id === itemId);
    if (item.qty === 1) {
      hapusItem(itemId);
    } else {
      setKeranjang(
        keranjang.map((i) =>
          i.id === itemId ? { ...i, qty: i.qty - 1 } : i
        )
      );
    }
  };

  const hapusItem = (itemId) => {
    setKeranjang(keranjang.filter((i) => i.id !== itemId));
  };

  const handleProses = () => {
    if (keranjang.length === 0) {
      alert('Keranjang sewa masih kosong!');
      return;
    }
    if (!tanggalMulai || !tanggalSelesai) {
      alert('Mohon isi tanggal sewa terlebih dahulu!');
      return;
    }
    setShowPaymentPopup(true);
  };
  
  const handleSimpanPembayaran = async () => {
    if (!namaPelanggan || !alamatPelanggan || !noWhatsapp || !jaminan) {
        alert('Mohon lengkapi semua data pelanggan!');
        return;
    }

    let pelangganId;
    
    const { data: existingPelanggan, error: fetchError } = await supabase
        .from('pelanggan')
        .select('id')
        .eq('no_whatsapp', noWhatsapp)
        .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newPelangganData, error: insertError } = await supabase
        .from('pelanggan')
        .insert([
          {
            nama: namaPelanggan,
            alamat: alamatPelanggan,
            no_whatsapp: noWhatsapp,
            jaminan: jaminan,
          },
        ])
        .select();

      if (insertError) {
        console.error('Error menyimpan pelanggan baru:', insertError);
        alert('Gagal menyimpan data pelanggan baru.');
        return;
      }
      pelangganId = newPelangganData[0].id;

    } else if (existingPelanggan) {
        pelangganId = existingPelanggan.id;
    } else {
        console.error('Error saat mencari pelanggan:', fetchError);
        alert('Gagal mencari data pelanggan.');
        return;
    }

    const { error: transaksiError } = await supabase.from('transaksi').insert([
      {
        pelanggan_id: pelangganId,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        durasi_hari: hitungDurasiHari(),
        total_biaya: hitungTotalAkhir(),
        jenis_pembayaran: metodePembayaran,
        catatan_kasir: catatanKasir, // Perbaikan: Tambahkan baris ini
      },
    ]);

    if (transaksiError) {
      console.error('Error menyimpan transaksi:', transaksiError);
      alert('Gagal menyimpan data transaksi.');
      return;
    }

    await Promise.all(
      keranjang.map((item) =>
        supabase
          .from('produk')
          .update({ stok: item.stok - item.qty })
          .eq('id', item.id)
      )
    );

    alert('Data sewa berhasil disimpan! Sekarang Anda bisa cetak struk.');
    setShowPaymentPopup(false);
    setShowStrukPopup(true);
  };

  const produkTerfilter = produk.filter(item => {
    const kategoriCocok = kategoriTerpilih === 'Semua' || item.kategori === kategoriTerpilih;
    const pencarianCocok = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return kategoriCocok && pencarianCocok;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white font-sans">
      <Head>
        <title>Nuevanesia POS</title>
      </Head>
      
      {/* Kolom Kiri: Navigasi Kategori & Logo */}
      <div className="w-full lg:w-1/4 bg-gray-800 p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-center mb-10">
            <img src="/images/logo-nuevanesia.png" alt="Nuevanesia Logo" className="h-10 mr-3" />
            <span className="text-2xl font-bold text-teal-400">Nuevanesia</span>
          </div>

          <h2 className="text-lg font-semibold mb-4 text-gray-300">Kategori Produk</h2>
          <div className="space-y-3">
            {semuaKategori.map((kategori) => (
              <div
                key={kategori}
                onClick={() => setKategoriTerpilih(kategori)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 
                  ${kategoriTerpilih === kategori ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {kategori === 'Tenda & Terpal' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2 2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                )}
                {kategori === 'Peralatan Masak' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M3 12H2M15 9l-2 2m-2 2l-2 2m5 0a6 6 0 11-12 0 6 6 0 0112 0z"></path>
                  </svg>
                )}
                {kategori === 'Alat Penerangan' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13l-3 3m0 0l3 3m-3-3h12m5-6v2m0 0v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2m0 0V9a1 1 0 011-1h1a1 1 0 011 1v2z"></path>
                  </svg>
                )}
                {kategori === 'Tas & Ransel' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.564 23.564 0 0112 15c-3.185 0-6.223-.62-9-1.745M16 4v12a2 2 0 002 2h2v-8m-4-2l-2 2h2m-2 2h2M6 20h.01M9 20h.01"></path>
                  </svg>
                )}
                {kategori === 'Kursi & Meja Portabel' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2m7-9v8"></path>
                  </svg>
                )}
                {kategori === 'Lain-lain' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                )}
                {kategori === 'Semua' && (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                )}
                <span>{kategori}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => router.push('/laporan')}
          className="flex items-center justify-center bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-3"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Lihat Laporan
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors duration-200 mt-6"
        >
          <svg className="w-5 h-5 mr-2" fill="