import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router'; // Tambahkan ini

export default function Home() {
  const [produk, setProduk] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [showStrukPopup, setShowStrukPopup] = useState(false);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [alamatPelanggan, setAlamatPelanggan] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [jaminan, setJaminan] = useState('');
  const [kategoriTerpilih, setKategoriTerpilih] = useState('Semua');
  const [semuaKategori, setSemuaKategori] = useState([]);
  const [session, setSession] = useState(null); // Tambahkan ini
  const router = useRouter(); // Tambahkan ini

  // TAMBAHAN: Cek sesi pengguna saat halaman dimuat
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.push('/login');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [router]);
  
  // Jika tidak ada sesi, jangan tampilkan apa-apa
  if (!session) {
    return null;
  }

  // --- (sisanya dari kode Anda tetap sama, tidak perlu diubah) ---
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
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const hitungDurasiHari = () => {
    // ... (kode tetap sama)
  };
  
  const hitungTotal = () => {
    // ... (kode tetap sama)
  };

  const tambahKeKeranjang = (item) => {
    // ... (kode tetap sama)
  };
  
  const kurangDariKeranjang = (itemId) => {
    // ... (kode tetap sama)
  };

  const hapusItem = (itemId) => {
    // ... (kode tetap sama)
  };

  const handleProses = () => {
    // ... (kode tetap sama)
  };
  
  const handleSimpan = async () => {
    // ... (kode tetap sama)
  };

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
  
  const produkTerfilter = kategoriTerpilih === 'Semua'
    ? produk
    : produk.filter(item => item.kategori === kategoriTerpilih);

  return (
    <div className="flex min-h-screen font-sans">
      <Head>
        <title>Nuevanesia POS</title>
      </Head>
      
      {/* Tombol Logout */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Kolom 1: Kategori Produk */}
      <div className="w-1/4 p-4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kategori</h2>
        {semuaKategori.map(kategori => (
          <div
            key={kategori}
            onClick={() => setKategoriTerpilih(kategori)}
            className={`p-2 my-1 rounded-md cursor-pointer ${kategoriTerpilih === kategori ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {kategori}
          </div>
        ))}
      </div>

      {/* Kolom 2: Item Sewa */}
      <div className="w-1/2 p-4 border-r border-gray-100 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Item Sewa</h2>
        <div className="grid grid-cols-4 gap-4">
          {produkTerfilter.map(item => (
            <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white">
              {item.url_gambar && (
                <img src={item.url_gambar} alt={item.nama} className="w-full h-32 object-cover mb-2 rounded" />
              )}
              <h3 className="font-bold text-lg">{item.nama}</h3>
              <p className="text-sm text-gray-600">Harga: Rp{item.harga}</p>
              <p className="text-sm text-gray-600">Stok: {item.stok}</p>
              <button
                onClick={() => tambahKeKeranjang(item)}
                className="bg-blue-500 text-white p-2 mt-2 rounded w-full hover:bg-blue-600"
              >
                Tambah
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Kolom 3: Detail Transaksi */}
      <div className="w-1/4 p-4 bg-white flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-4">Detail Transaksi</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium">Tanggal Ambil</label>
            <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full p-2 border rounded" />
            <label className="block text-sm font-medium mt-2">Tanggal Kembali</label>
            <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-2 border rounded" />
            <p className="text-sm mt-2">Durasi: {hitungDurasiHari()} Malam</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {keranjang.length === 0 ? (
              <p className="text-gray-500">Keranjang masih kosong</p>
            ) : (
              keranjang.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.nama}</p>
                    <p className="text-sm text-gray-500">Rp{item.harga} x {item.qty}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => kurangDariKeranjang(item.id)} className="bg-gray-200 px-2 py-1 rounded">-</button>
                    <span className="font-bold">{item.qty}</span>
                    <button onClick={() => tambahKeKeranjang(item)} className="bg-gray-200 px-2 py-1 rounded">+</button>
                    <button onClick={() => hapusItem(item.id)} className="text-red-500 hover:text-red-700">x</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold mt-4">Total: Rp{hitungTotal().toLocaleString('id-ID')}</p>
          {hitungDurasiHari() >= 3 && (
            <p className="text-red-500 font-bold">Diskon 50% diterapkan!</p>
          )}
          <button onClick={handleProses} className="bg-green-500 text-white p-4 w-full mt-4 rounded-lg font-bold hover:bg-green-600">
            Proses
          </button>
        </div>
      </div>

      {/* OVERLAY POPUP untuk Form Pelanggan DAN Struk */}
      {(showFormPopup || showStrukPopup) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="p-6 bg-white rounded-lg shadow-md max-w-lg w-full max-h-screen overflow-y-auto">
            {showFormPopup && (
              <>
                <h2 className="text-2xl font-bold mb-4">Detail Transaksi</h2>
                <p className="text-sm text-gray-500 -mt-2 mb-4">Isi data pelanggan untuk melanjutkan</p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium">Nama Pelanggan</label>
                    <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Alamat</label>
                    <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">No. WhatsApp</label>
                    <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Jaminan</label>
                    <input type="text" value={jaminan} onChange={(e) => setJaminan(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ringkasan</h3>
                <div className="border-t border-b py-4 mb-4">
                  <div className="flex justify-between font-medium">
                    <span>Durasi:</span>
                    <span>{hitungDurasiHari()} malam</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl mt-2">
                    <span>Total:</span>
                    <span>Rp{hitungTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSimpan}
                    className="bg-blue-500 text-white p-3 rounded-md w-1/2 hover:bg-blue-600"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setShowFormPopup(false)}
                    className="bg-gray-300 text-gray-800 p-3 rounded-md w-1/2 hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </>
            )}
            
            {showStrukPopup && (
              <>
                <h2 className="text-2xl font-bold mb-4">Struk Transaksi</h2>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-lg mb-4">
                  <h3 className="text-xl font-bold mb-2">Detail Pelanggan</h3>
                  <p>Nama: {namaPelanggan}</p>
                  <p>Alamat: {alamatPelanggan}</p>
                  <p>No. WA: {noWhatsapp}</p>
                  <p>Jaminan: {jaminan}</p>
                  <p className="mt-4">Tanggal Sewa: {tanggalMulai} s/d {tanggalSelesai}</p>
                  <p>Durasi: {hitungDurasiHari()} malam</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-lg mb-4">
                  <h3 className="text-xl font-bold mb-2">Item Disewa</h3>
                  <ul>
                    {keranjang.map(item => (
                      <li key={item.id} className="flex justify-between py-1">
                        <span>{item.nama} ({item.qty})</span>
                        <span>Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-lg">
                  <div className="flex justify-between font-bold text-2xl">
                    <span>Total Biaya:</span>
                    <span>Rp{hitungTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={handleCetak}
                  className="bg-green-500 text-white p-3 rounded-md w-full max-w-lg mt-4 font-bold"
                >
                  Cetak Struk
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}