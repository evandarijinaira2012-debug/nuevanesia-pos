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
  const [produkUntukDiedit, setProdukUntukDiedit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');


  useEffect(() => {
    fetchProduk();
  }, []);

  async function fetchProduk() {
    // Menggunakan nama tabel 'produk'
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
    setProdukUntukDiedit(null);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!nama || !harga || !stok || !kategori) {
      toast.error('Nama, harga, stok, dan kategori harus diisi.');
      return;
    }

    const toastId = toast.loading('Menyimpan produk...');
    
    // Menggunakan nama kolom yang benar saat menyimpan data
    const dataToSave = {
      nama: nama,
      harga: harga,
      stok: stok,
      url_gambar: url_gambar,
      kategori: kategori,
      description: description,
      handling_notes: handling_notes,
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
    // Mengambil data dari database dengan nama kolom yang benar
    setNama(produk.nama);
    setHarga(produk.harga);
    setStok(produk.stok);
    setUrlGambar(produk.url_gambar || '');
    setKategori(produk.kategori);
    setDescription(produk.description || '');
    setHandlingNotes(produk.handling_notes || '');
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
// 🔎 Filter produk berdasarkan search & kategori
const kategoriUnik = ['Semua', ...new Set(produk.map((item) => item.kategori))];
const kategoriUnikForm = [...new Set(produk.map((item) => item.kategori))];

const produkTerfilter = produk.filter((item) => {
  const cocokNama = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
  const cocokKategori = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
  return cocokNama && cocokKategori;
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
        
        {/* Kontainer Utama untuk 2 Kolom */}
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Kolom 1: Formulir Tambah/Edit Produk */}
            <div className="lg:w-1/3 w-full sticky top-8 h-fit lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-6 text-white">{produkUntukDiedit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                    
                    <form onSubmit={handleSimpan} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Nama Produk</label>
                                <input
                                  type="text"
                                  value={nama}
                                  onChange={(e) => setNama(e.target.value)}
                                  placeholder="Nama Produk"
                                  required
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Harga Sewa</label>
                                <input
                                  type="number"
                                  value={harga}
                                  onChange={(e) => setHarga(e.target.value)}
                                  placeholder="Harga aja jgn pake titik dan Rp"
                                  required
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>
                            <div>
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
                            <div>
                                <label className="block text-gray-400 mb-2">Kategori</label>
                                <input
                                  type="text"
                                  value={kategori}
                                  onChange={(e) => setKategori(e.target.value)}
                                  placeholder="Contoh: Tenda, Sleeping System"
                                  required
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">URL Gambar</label>
                                <input
                                  type="text"
                                  value={url_gambar}
                                  onChange={(e) => setUrlGambar(e.target.value)}
                                  placeholder="URL gambar produk ambil dari web storelink"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Deskripsi Produk</label>
                                <textarea
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="Shift+Enter dulu sekali baru tulis deskripsi produk"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Catatan Penanganan</label>
                                <textarea
                                  value={handling_notes}
                                  onChange={(e) => setHandlingNotes(e.target.value)}
                                  placeholder="Shift+Enter dulu sekali baru tulis catatan (Opsional)"
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                  rows="3"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex space-x-4">
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
                    <h2 className="text-2xl font-semibold mb-6 text-white">Daftar Produk</h2>
                    
{/* ✅ Search & Filter */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-4">
  <input
    type="text"
    placeholder="Cari produk..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full md:w-1/2 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
  />

  <div className="flex items-center gap-3 w-full md:w-1/3">
    <select
      value={kategoriFilter}
      onChange={(e) => setKategoriFilter(e.target.value)}
      className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
    >
      {kategoriUnik.map((kategori) => (
        <option key={kategori} value={kategori}>{kategori}</option>
      ))}
    </select>

    {/* 🔘 Tombol Clear Filter */}
    <button
      onClick={() => {
        setSearchQuery('');
        setKategoriFilter('Semua');
      }}
      className="px-3 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors"
    >
      Clear
    </button>
  </div>
</div>


                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-700">
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama Produk</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Harga</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stok</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kategori</th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {produkTerfilter.length > 0 ? (
                                produkTerfilter.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                      {/* Menggunakan nama kolom yang benar dari database */}
                                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{item.nama}</td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">Rp{item.harga.toLocaleString('id-ID')}</td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{item.stok}</td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{item.kategori}</td>
                                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-3">
                                          <button onClick={() => handleEdit(item)} className="text-yellow-500 hover:text-yellow-400">
                                            <IconEdit />
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400">
                                            <IconTrash />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                      produkna leungit.
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