import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// --- Komponen Ikon ---
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
  const [jenis_layanan, setJenisLayanan] = useState('Sewa');
  const [harga_diskon, setHargaDiskon] = useState('');
  const [isKategoriBaru, setIsKategoriBaru] = useState(false);
  const [produkUntukDiedit, setProdukUntukDiedit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [layananFilter, setLayananFilter] = useState('Semua');

  // --- STATE BARU UNTUK VARIASI DINAMIS ---
  const [variasiList, setVariasiList] = useState([]);
  const [gambarList, setGambarList] = useState([]);

  useEffect(() => {
    fetchProduk();
  }, []);

  async function fetchProduk() {
    // Pastikan kita juga menarik data relasi variasinya
    const { data, error } = await supabase
        .from('produk')
        .select('*, produk_variasi(*), produk_gambar(*)')
        .order('id', { ascending: false });
        
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
    setVariasiList([]); // Reset daftar variasi
    setGambarList([]);
    setIsKategoriBaru(false);
    setProdukUntukDiedit(null);
  };

  // --- FUNGSI UNTUK MENGELOLA BARIS VARIASI ---
  const tambahBarisVariasi = () => {
    setVariasiList([...variasiList, { nama_variasi: '', harga: '', stok: '' }]);
  };

  // --- FUNGSI UNTUK MENGELOLA BARIS GAMBAR TAMBAHAN ---
  const tambahBarisGambar = () => {
    setGambarList([...gambarList, { gambar_url: '' }]);
  };

  const hapusBarisGambar = (index) => {
    const listBaru = [...gambarList];
    listBaru.splice(index, 1);
    setGambarList(listBaru);
  };

  const handleUbahGambar = (index, value) => {
    const listBaru = [...gambarList];
    listBaru[index].gambar_url = value;
    setGambarList(listBaru);
  };

  const hapusBarisVariasi = (index) => {
    const listBaru = [...variasiList];
    listBaru.splice(index, 1);
    setVariasiList(listBaru);
  };

  const handleUbahVariasi = (index, field, value) => {
    const listBaru = [...variasiList];
    listBaru[index][field] = value;
    setVariasiList(listBaru);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!nama || !harga || !stok || !kategori || !jenis_layanan) {
      toast.error('Nama, harga, stok, kategori, dan layanan utama harus diisi.');
      return;
    }

    const toastId = toast.loading('Menyimpan produk dan variasinya...');
    
    const dataToSave = {
      nama,
      harga: Number(harga),
      stok: Number(stok),
      url_gambar,
      kategori: kategori.trim(),
      description,
      handling_notes,
      jenis_layanan,
      harga_diskon: harga_diskon ? Number(harga_diskon) : null,
      seo_title: nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    };

    let produkIdTerproses = null;

    try {
        if (produkUntukDiedit) {
            // PROSES EDIT PRODUK UTAMA
            produkIdTerproses = produkUntukDiedit.id;
            const { error: errorUpdate } = await supabase.from('produk').update(dataToSave).eq('id', produkIdTerproses);
            if (errorUpdate) throw errorUpdate;

            // MANAJEMEN VARIASI SAAT EDIT
            // 1. Hapus variasi yang dihapus oleh user di form
            const variasiIdsToKeep = variasiList.filter(v => v.id).map(v => v.id);
            if (variasiIdsToKeep.length > 0) {
                const { data: dbVariasi } = await supabase.from('produk_variasi').select('id').eq('produk_id', produkIdTerproses);
                const idsToDelete = dbVariasi.map(v => v.id).filter(id => !variasiIdsToKeep.includes(id));
                
                if (idsToDelete.length > 0) {
                    await supabase.from('produk_variasi').delete().in('id', idsToDelete);
                }
            } else {
                await supabase.from('produk_variasi').delete().eq('produk_id', produkIdTerproses);
            }
        } else {

            // MANAJEMEN GAMBAR SAAT EDIT
            // 1. Hapus gambar yang dihapus oleh user di form
            const gambarIdsToKeep = gambarList.filter(g => g.id).map(g => g.id);
            if (gambarIdsToKeep.length > 0) {
                const { data: dbGambar } = await supabase.from('produk_gambar').select('id').eq('produk_id', produkIdTerproses);
                const idsToDelete = dbGambar.map(g => g.id).filter(id => !gambarIdsToKeep.includes(id));
                
                if (idsToDelete.length > 0) {
                    await supabase.from('produk_gambar').delete().in('id', idsToDelete);
                }
            } else {
                await supabase.from('produk_gambar').delete().eq('produk_id', produkIdTerproses);
            }

            // PROSES INSERT PRODUK BARU
            const { data, error: errorInsert } = await supabase.from('produk').insert([dataToSave]).select();
            if (errorInsert) throw errorInsert;
            produkIdTerproses = data[0].id;
        }

        // PROSES SIMPAN/UPDATE DATA VARIASI
        if (variasiList.length > 0) {
            const dataVariasiToSave = variasiList.map(v => {
                const payload = {
                    produk_id: produkIdTerproses,
                    nama_variasi: v.nama_variasi,
                    harga: Number(v.harga),
                    stok: jenis_layanan === 'Laundry' ? null : Number(v.stok)
                };
                if (v.id) payload.id = v.id; // Sertakan ID jika ini adalah variasi yang sudah ada (untuk update)
                return payload;
            });

            const { error: errorVariasi } = await supabase.from('produk_variasi').upsert(dataVariasiToSave);
            if (errorVariasi) throw errorVariasi;
        }
        // PROSES SIMPAN/UPDATE DATA GAMBAR TAMBAHAN
        if (gambarList.length > 0) {
            const dataGambarToSave = gambarList.map(g => {
                const payload = {
                    produk_id: produkIdTerproses,
                    gambar_url: g.gambar_url
                };
                if (g.id) payload.id = g.id; // Sertakan ID jika ini adalah gambar lama (untuk update)
                return payload;
            });

            const { error: errorGambar } = await supabase.from('produk_gambar').upsert(dataGambarToSave);
            if (errorGambar) throw errorGambar;
        }
// PROSES SIMPAN/UPDATE DATA GAMBAR TAMBAHAN
        if (gambarList.length > 0) {
            const dataGambarToSave = gambarList.map(g => {
                const payload = {
                    produk_id: produkIdTerproses,
                    gambar_url: g.gambar_url
                };
                if (g.id) payload.id = g.id; // Sertakan ID jika ini adalah gambar lama (untuk update)
                return payload;
            });

            const { error: errorGambar } = await supabase.from('produk_gambar').upsert(dataGambarToSave);
            if (errorGambar) throw errorGambar;
        }
        toast.success(produkUntukDiedit ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!', { id: toastId });
        resetForm();
        fetchProduk();
    } catch (error) {
        console.error(error);
        toast.error('Gagal memproses data. Cek koneksi atau inputan.', { id: toastId });
    }
  };

  const handleEdit = (produk) => {
    setProdukUntukDiedit(produk);
    setNama(produk.nama);
    setHarga(produk.harga);
    setStok(produk.stok);
    setUrlGambar(produk.url_gambar || '');
    setVariasiList(produk.produk_variasi || []);
    setGambarList(produk.produk_gambar || []);
    setKategori(produk.kategori);
    setDescription(produk.description || '');
    setHandlingNotes(produk.handling_notes || '');
    setJenisLayanan(produk.jenis_layanan || 'Sewa');
    setHargaDiskon(produk.harga_diskon || '');
    setIsKategoriBaru(false);
    
    // Muat data variasi yang ada ke dalam form
    setVariasiList(produk.produk_variasi || []);
  };

  const handleDelete = async (produkId) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus produk ini? Semua variasi terkait juga akan terhapus.');
    if (konfirmasi) {
      const { error } = await supabase.from('produk').delete().eq('id', produkId);
      if (error) {
        toast.error('Gagal menghapus produk.');
      } else {
        toast.success('Produk berhasil dihapus!');
        fetchProduk();
      }
    }
  };

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

                            <div>
                                <label className="block text-gray-400 mb-2">Stok Utama</label>
                                <input
                                  type="number"
                                  value={stok}
                                  onChange={(e) => setStok(e.target.value)}
                                  placeholder="Stok"
                                  required
                                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                            </div>

                            {/* --- AREA VARIASI DINAMIS --- */}
                            <div className="mt-6 border-t border-gray-700 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-teal-400 font-bold">Variasi Produk (Opsional)</label>
                                    <button 
                                        type="button" 
                                        onClick={tambahBarisVariasi} 
                                        className="text-xs bg-teal-600/20 text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 hover:bg-teal-600/40 transition-colors flex items-center"
                                    >
                                        + Tambah Variasi
                                    </button>
                                </div>

                                {variasiList.length === 0 && (
                                    <p className="text-sm text-gray-500 italic mb-4">Belum ada variasi. Klik tombol tambah di atas.</p>
                                )}

                                <div className="space-y-3">
                                    {variasiList.map((variasi, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-900 p-3 rounded-lg border border-gray-700 relative">
                                            <div className="flex-grow space-y-2">
                                                <input
                                                    type="text"
                                                    value={variasi.nama_variasi}
                                                    onChange={(e) => handleUbahVariasi(index, 'nama_variasi', e.target.value)}
                                                    placeholder="Nama (mis: Carrier 45L)"
                                                    required
                                                    className="w-full p-2 text-sm bg-gray-800 rounded border border-gray-600 text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={variasi.harga}
                                                        onChange={(e) => handleUbahVariasi(index, 'harga', e.target.value)}
                                                        placeholder="Harga"
                                                        required
                                                        className="w-full p-2 text-sm bg-gray-800 rounded border border-gray-600 text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                    />
                                                    {jenis_layanan !== 'Laundry' && (
                                                        <input
                                                            type="number"
                                                            value={variasi.stok}
                                                            onChange={(e) => handleUbahVariasi(index, 'stok', e.target.value)}
                                                            placeholder="Stok"
                                                            required
                                                            className="w-full p-2 text-sm bg-gray-800 rounded border border-gray-600 text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => hapusBarisVariasi(index)}
                                                className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded h-full"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* --- AKHIR AREA VARIASI --- */}

                            <div className="border-t border-gray-700 pt-6">
                                <label className="block text-gray-400 mb-2">Kategori</label>
                                <select
                                  value={isKategoriBaru ? 'KategoriBaru' : kategori}
                                  onChange={(e) => {
                                    if (e.target.value === 'KategoriBaru') {
                                      setIsKategoriBaru(true);
                                      setKategori('');
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
                            {/* --- AREA GAMBAR TAMBAHAN DINAMIS --- */}
                            <div className="mt-4 border-t border-gray-700 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-teal-400 font-bold">Gambar Galeri / Tambahan (Opsional)</label>
                                    <button 
                                        type="button" 
                                        onClick={tambahBarisGambar} 
                                        className="text-xs bg-teal-600/20 text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 hover:bg-teal-600/40 transition-colors flex items-center"
                                    >
                                        + Tambah Gambar
                                    </button>
                                </div>

                                {gambarList.length === 0 && (
                                    <p className="text-sm text-gray-500 italic mb-4">Belum ada gambar tambahan. Klik tombol tambah di atas.</p>
                                )}

                                <div className="space-y-3">
                                    {gambarList.map((gambar, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-900 p-3 rounded-lg border border-gray-700 relative">
                                            <div className="flex-grow">
                                                <input
                                                    type="text"
                                                    value={gambar.gambar_url}
                                                    onChange={(e) => handleUbahGambar(index, e.target.value)}
                                                    placeholder="URL gambar tambahan (misal dari imgur/drive)"
                                                    required
                                                    className="w-full p-2 text-sm bg-gray-800 rounded border border-gray-600 text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => hapusBarisGambar(index)}
                                                className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded h-full"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* --- AKHIR AREA GAMBAR TAMBAHAN --- */}
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
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Harga Utama</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Info Tambahan</th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {produkTerfilter.length > 0 ? (
                                produkTerfilter.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                      <td className="px-4 py-4 text-sm font-medium text-white max-w-[200px]">
                                        {item.nama}
                                        <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{item.kategori}</span>
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
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {item.produk_variasi && item.produk_variasi.length > 0 ? (
                                            <span className="text-teal-400 font-semibold">{item.produk_variasi.length} Variasi</span>
                                        ) : (
                                            <span>Stok: {item.stok}</span>
                                        )}
                                      </td>
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