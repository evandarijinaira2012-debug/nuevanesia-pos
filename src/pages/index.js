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
  const [jaminan, setJaminan] = useState('');
  const [kategoriTerpilih, setKategoriTerpilih] = useState('Semua');
  const [semuaKategori, setSemuaKategori] = useState([]);
  const [session, setSession] = useState(null);
  const router = useRouter();

  const [metodePembayaran, setMetodePembayaran] = useState('Cash');

  // --- START: Authentication Hooks ---
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
  // --- END: Authentication Hooks ---

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

    const { data: pelangganData, error: pelangganError } = await supabase
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

    if (pelangganError) {
      console.error('Error menyimpan pelanggan:', pelangganError);
      alert('Gagal menyimpan data pelanggan.');
      return;
    }

    const pelangganId = pelangganData[0].id;

    const { error: transaksiError } = await supabase.from('transaksi').insert([
      {
        pelanggan_id: pelangganId,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        durasi_hari: hitungDurasiHari(),
        total_biaya: hitungTotalAkhir(),
        jenis_pembayaran: metodePembayaran,
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

  const produkTerfilter = kategoriTerpilih === 'Semua'
    ? produk
    : produk.filter(item => item.kategori === kategoriTerpilih);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      <Head>
        <title>Nuevanesia POS</title>
      </Head>
      
      {/* Kolom Kiri: Navigasi Kategori & Logo */}
      <div className="w-1/4 bg-gray-800 p-4 flex flex-col justify-between shadow-lg">
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
          onClick={handleLogout}
          className="flex items-center justify-center bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors duration-200 mt-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>

      {/* Kolom Tengah: Item Sewa */}
      <div className="w-1/2 p-4 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Item Sewa</h2>
        <div className="grid grid-cols-4 gap-4">
          {produkTerfilter.map(item => (
            <div key={item.id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-md flex flex-col justify-between">
              {item.url_gambar && (
                <img src={item.url_gambar} alt={item.nama} className="w-full h-24 object-cover mb-3 rounded-md" />
              )}
              <h3 className="font-bold text-md text-teal-300">{item.nama}</h3>
              <p className="text-xs text-gray-400">Rp{item.harga} / Hari</p>
              <p className="text-xs text-gray-400">Stok: {item.stok}</p>
              <button
                onClick={() => tambahKeKeranjang(item)}
                className="bg-blue-600 text-white p-2 mt-2 rounded-md w-full hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Tambah
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Kolom Kanan: Detail Transaksi & Keranjang */}
      <div className="w-1/4 bg-gray-800 p-4 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-100">Detail Transaksi</h2>
          
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal Ambil</label>
            <input 
              type="date" 
              value={tanggalMulai} 
              onChange={(e) => setTanggalMulai(e.target.value)} 
              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <label className="block text-sm font-medium text-gray-300 mt-3 mb-2">Tanggal Kembali</label>
            <input 
              type="date" 
              value={tanggalSelesai} 
              onChange={(e) => setTanggalSelesai(e.target.value)} 
              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <p className="text-sm mt-3 text-gray-400">Durasi: <span className="font-semibold">{hitungDurasiHari()} Malam</span></p>
          </div>

          <div className="max-h-80 overflow-y-auto bg-gray-700 p-4 rounded-lg mb-4">
            {keranjang.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">Keranjang masih kosong</p>
            ) : (
              keranjang.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
                  <div>
                    <p className="font-medium text-teal-300 text-sm">{item.nama}</p>
                    <p className="text-xs text-gray-400">Rp{item.harga.toLocaleString('id-ID')} x {item.qty}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => kurangDariKeranjang(item.id)} className="bg-gray-600 text-white px-2 py-1 rounded-md text-sm hover:bg-gray-500 transition-colors">-</button>
                    <span className="font-bold text-gray-200 text-sm">{item.qty}</span>
                    <button onClick={() => tambahKeKeranjang(item)} className="bg-gray-600 text-white px-2 py-1 rounded-md text-sm hover:bg-gray-500 transition-colors">+</button>
                    <button onClick={() => hapusItem(item.id)} className="text-red-500 hover:text-red-400 ml-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m3 0h6"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Subtotal per malam:</span>
            <span className="font-semibold text-gray-200 text-sm">Rp{hitungSubtotalPerMalam().toLocaleString('id-ID')}</span>
          </div>
          {hitungDurasiHari() >= 3 && (
            <div className="flex justify-between items-center mb-2 text-red-400 font-bold text-sm">
              <span>Diskon:</span>
              <span>-Rp{(hitungSubtotalPerMalam() * 0.5 * (hitungDurasiHari() - 2)).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-gray-600 pt-3 mt-3">
            <p className="text-xl font-bold text-teal-400">Total:</p>
            <p className="text-2xl font-bold text-teal-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</p>
          </div>
          <button onClick={handleProses} className="bg-green-600 text-white p-3 w-full mt-6 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors duration-200">
            PROSES
          </button>
        </div>
      </div>

      {(showPaymentPopup || showStrukPopup) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="p-8 bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            {showPaymentPopup && (
              <>
                <h2 className="text-3xl font-bold text-teal-400 mb-6 text-center">Data Pelanggan & Pembayaran</h2>
                
                <div className="bg-gray-700 p-6 rounded-lg mb-6 shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">Detail Pelanggan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nama Pelanggan</label>
                      <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nama Lengkap" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Alamat</label>
                      <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Alamat Lengkap" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">No. WhatsApp</label>
                      <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="+62..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Jaminan</label>
                      <input type="text" value={jaminan} onChange={(e) => setJaminan(e.target.value)} className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="KTP/SIM/Lainnya" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 p-6 rounded-lg mb-6 shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">Detail Pembayaran</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-gray-300">Tanggal Ambil:</div>
                    <div className="font-semibold text-gray-200">{tanggalMulai}</div>
                    <div className="text-gray-300">Tanggal Kembali:</div>
                    <div className="font-semibold text-gray-200">{tanggalSelesai}</div>
                    <div className="text-gray-300">Durasi:</div>
                    <div className="font-semibold text-gray-200">{hitungDurasiHari()} malam</div>
                    <div className="text-gray-300">Subtotal:</div>
                    <div className="font-semibold text-gray-200">Rp{hitungSubtotalPerMalam().toLocaleString('id-ID')}</div>
                    {hitungDurasiHari() >= 3 && (
                      <>
                        <div className="text-red-400 font-bold">Diskon:</div>
                        <div className="text-red-400 font-bold">-Rp{(hitungSubtotalPerMalam() * 0.5 * (hitungDurasiHari() - 2)).toLocaleString('id-ID')}</div>
                      </>
                    )}
                  </div>
                  <div className="border-t border-gray-600 pt-4 flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold text-teal-400">Grand Total:</span>
                    <span className="text-3xl font-bold text-teal-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex justify-around space-x-4 mb-6">
                  <button
                    onClick={() => setMetodePembayaran('Cash')}
                    className={`p-4 rounded-lg w-full font-bold text-lg transition-all duration-200 ${metodePembayaran === 'Cash' ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    CASH
                  </button>
                  <button
                    onClick={() => setMetodePembayaran('Transfer')}
                    className={`p-4 rounded-lg w-full font-bold text-lg transition-all duration-200 ${metodePembayaran === 'Transfer' ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    TRANSFER
                  </button>
                  <button
                    onClick={() => setMetodePembayaran('QRIS')}
                    className={`p-4 rounded-lg w-full font-bold text-lg transition-all duration-200 ${metodePembayaran === 'QRIS' ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    QRIS
                  </button>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSimpanPembayaran}
                    className="bg-blue-600 text-white p-4 rounded-lg w-full font-bold text-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    SIMPAN TRANSAKSI
                  </button>
                  <button
                    onClick={() => setShowPaymentPopup(false)}
                    className="bg-gray-600 text-gray-300 p-4 rounded-lg w-1/4 font-bold text-lg hover:bg-gray-500 transition-colors duration-200"
                  >
                    BATAL
                  </button>
                </div>
              </>
            )}
            
            {showStrukPopup && (
              <>
                <h2 className="text-3xl font-bold text-teal-400 mb-6 text-center">Struk Transaksi</h2>
                <div className="bg-gray-700 p-6 rounded-lg w-full mb-4 shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">Detail Pelanggan</h3>
                  <p className="text-gray-300 mb-1">Nama: <span className="font-semibold text-gray-200">{namaPelanggan}</span></p>
                  <p className="text-gray-300 mb-1">Alamat: <span className="font-semibold text-gray-200">{alamatPelanggan}</span></p>
                  <p className="text-gray-300 mb-1">No. WA: <span className="font-semibold text-gray-200">{noWhatsapp}</span></p>
                  <p className="text-gray-300 mb-1">Jaminan: <span className="font-semibold text-gray-200">{jaminan}</span></p>
                  <p className="mt-4 text-gray-300 mb-1">Tanggal Sewa: <span className="font-semibold text-gray-200">{tanggalMulai} s/d {tanggalSelesai}</span></p>
                  <p className="text-gray-300">Durasi: <span className="font-semibold text-gray-200">{hitungDurasiHari()} malam</span></p>
                  <p className="text-gray-300 mt-2">Metode Pembayaran: <span className="font-semibold text-gray-200">{metodePembayaran}</span></p>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg w-full mb-4 shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">Item Disewa</h3>
                  <ul>
                    {keranjang.map(item => (
                      <li key={item.id} className="flex justify-between py-1 text-gray-300">
                        <span>{item.nama} ({item.qty})</span>
                        <span>Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg w-full shadow-inner">
                  <div className="flex justify-between font-bold text-3xl">
                    <span className="text-teal-400">Total Biaya:</span>
                    <span className="text-teal-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={handleCetak}
                  className="bg-green-600 text-white p-4 rounded-lg w-full mt-6 font-bold text-lg hover:bg-green-700 transition-colors duration-200"
                >
                  CETAK STRUK
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}