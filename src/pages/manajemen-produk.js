import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// Komponen Ikon
const IconPlus = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);
const IconEdit = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
);
const IconTrash = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m3 0h6"></path></svg>
);
const IconChevronLeft = () => (
  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);

const ManajemenProduk = () => {
  const [produk, setProduk] = useState([]);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [url_gambar, setUrlGambar] = useState('');
  const [kategori, setKategori] = useState('');
  const [description, setDescription] = useState('');
  const [handling_notes, setHandlingNotes] = useState('');
  
  // State Baru Sesuai Database
  const [jenis_layanan, setJenisLayanan] = useState('Sewa');
  const [harga_diskon, setHargaDiskon] = useState('');
  const [variasi, setVariasi] = useState('');

  // State pendukung untuk input kategori manual
  const [isKategoriBaru, setIsKategoriBaru] = useState(false);

  const [produkUntukDiedit, setProdukUntukDiedit] = useState(null);
  
  // State Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [layananFilter, setLayananFilter] = useState('Semua');

  useEffect(() => {
    fetchProduk();
  }, []);

  async function fetchProduk() {
    const { data, error } = await supabase.from('produk').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Error fetching produk:', error);
    } else {
      setProduk(data);
    }
  }

  const resetForm = () => {
    setNama('');
    setHarga('');
    setStok('');
    setUrlGambar('');
    setKategori('');
    setDescription('');
    setHandlingNotes('');
    setJenisLayanan('Sewa');
    setHargaDiskon('');
    setVariasi('');
    setIsKategoriBaru(false);
    setProdukUntukDiedit(null);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!nama || !harga || !stok || !kategori || !jenis_layanan) {
      toast.error('Nama, harga, stok, kategori, dan layanan harus diisi.');
      return;
    }

    const toastId = toast.loading('Menyimpan produk...');
    
    const dataToSave = {
      nama,
      harga,
      stok,
      url_gambar,
      kategori: kategori.trim(),
      description,
      handling_notes,
      jenis_layanan,
      harga_diskon: harga_diskon || null,
      variasi: variasi || null,
      seo_title: nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    };

    if (produkUntukDiedit) {
      const { error } = await supabase
        .from('produk')
        .update(dataToSave)
        .eq('id', produkUntukDiedit.id);

      if (error) {
        toast.error('Gagal memperbarui produk.', { id: toastId });
      } else {
        toast.success('Produk berhasil diperbarui!', { id: toastId });
      }
    } else {
      const { error } = await supabase
        .from('produk')
        .insert([dataToSave]);
      
      if (error) {
        toast.error('Gagal menambahkan produk baru.', { id: toastId });
      } else {
        toast.success('Produk berhasil ditambahkan!', { id: toastId });
      }
    }

    resetForm();
    fetchProduk();
  };

  const handleEdit = (produk) => {
    setProdukUntukDiedit(produk);
    setNama(produk.nama);
    setHarga(produk.harga);
    setStok(produk.stok);
    setUrlGambar(produk.url_gambar || '');
    setKategori(produk.kategori);
    setDescription(produk.description || '');
    setHandlingNotes(produk.handling_notes || '');
    setJenisLayanan(produk.jenis_layanan || 'Sewa');
    setHargaDiskon(produk.harga_diskon || '');
    setVariasi(produk.variasi || '');
    setIsKategoriBaru(false); // Menggunakan kategori yang sudah ada saat edit
  };

  const handleDelete = async (produkId) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');
    if (konfirmasi) {
      const { error } = await supabase
        .from('produk')
        .delete()
        .eq('id', produkId);

      if (error) {
        toast.error('Gagal menghapus produk.');
      } else {
        toast.success('Produk berhasil dihapus!');
        fetchProduk();
      }
    }
  };

  // 🔎 Ekstraksi Kategori & Layanan Unik untuk Filter dan Dropdown Form
  const kategoriUnik = ['Semua', ...new Set(produk.map((item) => item.kategori).filter(Boolean))];
  const daftarKategoriForm = [...new Set(produk.map((item) => item.kategori).filter(Boolean))];
  const layananUnik = ['Semua', 'Sewa', 'Penjualan', 'Laundry'];

  const produkTerfilter = produk.filter((item) => {
    const cocokNama = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const cocokKategori = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
    const layananItem = item.jenis_layanan || 'Sewa';
    const cocokLayanan = layananFilter === 'Semua' || layananItem === layananFilter;
    
    return cocokNama && cocokKategori && cocokLayanan;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8 font-sans">
      <Head>
        <title>Manajemen Produk</title>
      </Head>
      <Toaster />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Manajemen Produk</h1>
          <Link href="/" className="flex items-center text-teal-400 hover:text-teal-300 transition-colors">
            <IconChevronLeft />
            Kembali ke Beranda
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Kolom 1: Formulir Tambah/Edit Produk */}
            <div className="lg:w-1/3 w-full sticky top-8 h-fit lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-6 text-white">{produkUntukDiedit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                    
                    <form onSubmit={handleSimpan} className="space-y-4">
                        <div className="space-y-4">
                            
                            <div>
                                <label className="block text-gray-400 mb-2">Jenis Layanan</label>
                                <select
                                  value={jenis_layanan}
                                  onChange={(e) => setJenisLayanan(e.target.value)}
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white font-semibold"
                                >
                                  <option value="Sewa">🏕️ Sewa</option>
                                  <option value="Penjualan">🛒 Penjualan</option>
                                  <option value="Laundry">🧼 Laundry</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Nama Produk / Layanan</label>
                                <input
                                  type="text"
                                  value={nama}
                                  onChange={(e) => setNama(e.target.value)}
                                  placeholder="Nama Produk"
                                  required
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>

                            <div className="flex gap-4">
                              <div className="w-1/2">
                                  <label className="block text-gray-400 mb-2">Harga Utama</label>
                                  <input
                                    type="number"
                                    value={harga}
                                    onChange={(e) => setHarga(e.target.value)}
                                    placeholder="Tanpa titik"
                                    required
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  />
                              </div>
                              <div className="w-1/2">
                                  <label className="block text-gray-400 mb-2">Harga Diskon (Opsional)</label>
                                  <input
                                    type="number"
                                    value={harga_diskon}
                                    onChange={(e) => setHargaDiskon(e.target.value)}
                                    placeholder="Tanpa titik"
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  />
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="w-1/2">
                                  <label className="block text-gray-400 mb-2">Stok</label>
                                  <input
                                    type="number"
                                    value={stok}
                                    onChange={(e) => setStok(e.target.value)}
                                    placeholder="Stok"
                                    required
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  />
                              </div>
                              <div className="w-1/2">
                                  <label className="block text-gray-400 mb-2">Variasi (Opsional)</label>
                                  <input
                                    type="text"
                                    value={variasi}
                                    onChange={(e) => setVariasi(e.target.value)}
                                    placeholder="Contoh: XL, Merah"
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  />
                              </div>
                            </div>

                            {/* --- PILIH KATEGORI (DROPDOWN + MANUAL INPUT) --- */}
                            <div>
                                <label className="block text-gray-400 mb-2">Kategori</label>
                                <select
                                  value={isKategoriBaru ? 'KategoriBaru' : kategori}
                                  onChange={(e) => {
                                    if (e.target.value === 'KategoriBaru') {
                                      setIsKategoriBaru(true);
                                      setKategori(''); // Kosongkan agar user bisa isi manual
                                    } else {
                                      setIsKategoriBaru(false);
                                      setKategori(e.target.value);
                                    }
                                  }}
                                  required={!isKategoriBaru}
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                >
                                  <option value="" disabled>-- Pilih Kategori --</option>
                                  {daftarKategoriForm.map((kat) => (
                                    <option key={kat} value={kat}>{kat}</option>
                                  ))}
                                  <option value="KategoriBaru" className="text-teal-400 font-semibold">✏️ + Tambah Kategori Baru...</option>
                                </select>

                                {/* Input text manual ini hanya muncul jika memilih 'Tambah Kategori Baru...' */}
                                {isKategoriBaru && (
                                  <input
                                    type="text"
                                    value={kategori}
                                    onChange={(e) => setKategori(e.target.value)}
                                    placeholder="Tulis nama kategori baru di sini..."
                                    required
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white mt-2 placeholder-gray-500"
                                  />
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">URL Gambar</label>
                                <input
                                  type="text"
                                  value={url_gambar}
                                  onChange={(e) => setUrlGambar(e.target.value)}
                                  placeholder="URL gambar produk"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 mb-2">Deskripsi Produk</label>
                                <textarea
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="Deskripsi detail produk atau spesifikasi layanan"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Catatan Penanganan</label>
                                <textarea
                                  value={handling_notes}
                                  onChange={(e) => setHandlingNotes(e.target.value)}
                                  placeholder="Catatan handling (Opsional)"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  rows="3"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <button
                                type="submit"
                                className="flex-grow flex items-center justify-center p-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-colors"
                            >
                                <IconPlus />
                                {produkUntukDiedit ? 'Simpan Perubahan' : 'Tambahkan Produk'}
                            </button>
                            {produkUntukDiedit && (
                                <button
                                  type="button"
                                  onClick={resetForm}
                                  className="flex-grow flex items-center justify-center p-3 rounded-lg bg-gray-600 text-gray-200 font-semibold hover:bg-gray-500 transition-colors"
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Kolom 2: Daftar Produk */}
            <div className="lg:w-2/3 w-full lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Daftar Produk & Layanan</h2>
                    
                    {/* Search & Filter */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 mt-4">
                      <input
                        type="text"
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full xl:w-2/5 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      />

                      <div className="flex items-center gap-3 w-full xl:w-3/5">
                        <select
                          value={layananFilter}
                          onChange={(e) => setLayananFilter(e.target.value)}
                          className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white font-medium"
                        >
                          {layananUnik.map((layanan) => (
                            <option key={layanan} value={layanan}>Layanan: {layanan}</option>
                          ))}
                        </select>

                        <select
                          value={kategoriFilter}
                          onChange={(e) => setKategoriFilter(e.target.value)}
                          className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                        >
                          {kategoriUnik.map((kategori) => (
                            <option key={kategori} value={kategori}>{kategori}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setKategoriFilter('Semua');
                            setLayananFilter('Semua');
                          }}
                          className="px-4 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors whitespace-nowrap"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-700/50">
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama Produk</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Layanan</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Harga</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Stok</th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {produkTerfilter.length > 0 ? (
                                produkTerfilter.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                      <td className="px-4 py-4 text-sm font-medium text-white max-w-[200px] truncate">
                                        {item.nama}
                                        <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{item.kategori}</span>
                                          {item.variasi && <span className="text-[10px] text-teal-400 font-mono">({item.variasi})</span>}
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                          (item.jenis_layanan || 'Sewa') === 'Sewa' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                                          (item.jenis_layanan) === 'Penjualan' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                                          'bg-purple-900/50 text-purple-300 border border-purple-700'
                                        }`}>
                                          {item.jenis_layanan || 'Sewa'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                        Rp{item.harga.toLocaleString('id-ID')}
                                        {item.harga_diskon && (
                                            <span className="block text-xs text-red-400 line-through mt-1">Rp{item.harga_diskon.toLocaleString('id-ID')}</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{item.stok}</td>
                                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-3">
                                          <button onClick={() => handleEdit(item)} className="text-yellow-500 hover:text-yellow-400 p-1 bg-yellow-500/10 rounded">
                                            <IconEdit />
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded">
                                            <IconTrash />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                                      <span className="text-4xl block mb-2">🔍</span>
                                      Produk tidak ditemukan.
                                    </td>
                                  </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManajemenProduk;