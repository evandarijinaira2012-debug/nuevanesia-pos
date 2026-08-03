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
  const [slug, setSlug] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [url_gambar, setUrlGambar] = useState('');
  const [kategori, setKategori] = useState('');
  const [description, setDescription] = useState('');
  const [handling_notes, setHandlingNotes] = useState('');
  const [jenis_layanan, setJenisLayanan] = useState('Sewa');
  const [harga_diskon, setHargaDiskon] = useState('');
  const [meta_title, setMetaTitle] = useState('');
  const [tag_produk, setTagProduk] = useState('');
  const [meta_description, setMetaDescription] = useState('');
  const [isKategoriBaru, setIsKategoriBaru] = useState(false);
  const [produkUntukDiedit, setProdukUntukDiedit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [layananFilter, setLayananFilter] = useState('Semua');
  const [variasiList, setVariasiList] = useState([]);
  const [gambarList, setGambarList] = useState([]);
  const [slugStatus, setSlugStatus] = useState('');
  const [spesifikasiList, setSpesifikasiList] = useState([]);
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const cekSlugUnik = async (slugToCheck, currentProdukId) => {
    if (!slugToCheck) return true;
    let query = supabase.from('produk').select('id').eq('slug', slugToCheck);
    if (currentProdukId) {
      query = query.neq('id', currentProdukId);
    }
    const { data } = await query.maybeSingle()
    return !data; 
  };

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
    setSlug('');
    setHarga('');
    setStok('');
    setUrlGambar('');
    setKategori('');
    setDescription('');
    setHandlingNotes('');
    setJenisLayanan('Sewa');
    setHargaDiskon('');
    setMetaTitle('');
    setMetaDescription('');
    setTagProduk('');
    setVariasiList([]); 
    setGambarList([]);
    setIsKategoriBaru(false);
    setProdukUntukDiedit(null);
    setSpesifikasiList([]);
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

  // --- FUNGSI UNTUK MENGELOLA BARIS SPESIFIKASI ---
  const tambahBarisSpesifikasi = () => {
    setSpesifikasiList([...spesifikasiList, { key: '', value: '' }]);
  };

  const hapusBarisSpesifikasi = (index) => {
    const listBaru = [...spesifikasiList];
    listBaru.splice(index, 1);
    setSpesifikasiList(listBaru);
  };

  const handleUbahSpesifikasi = (index, field, value) => {
    const listBaru = [...spesifikasiList];
    listBaru[index][field] = value;
    setSpesifikasiList(listBaru);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    const isStillUnique = await cekSlugUnik(slug, produkUntukDiedit?.id);
    if (!isStillUnique) {
        toast.error('Gagal simpan: Slug sudah digunakan orang lain.');
        return; 
    }
    if (!nama || !harga || !stok || !kategori || !jenis_layanan) {
      toast.error('Nama, harga, stok, kategori, dan layanan utama harus diisi.');
      return;
    }

    const toastId = toast.loading('Menyimpan produk dan variasinya...');
    
    let spesifikasiArray = null;
    if (spesifikasiList.length > 0) {
        spesifikasiArray = spesifikasiList
            .filter(item => item.key && item.value)
            .map(item => ({
                label: item.key.trim(),
                nilai: item.value
            }));
            
        if (spesifikasiArray.length === 0) spesifikasiArray = null;
    }

        const dataToSave = {
              nama,
              slug, 
              harga: Number(harga),
              stok: Number(stok),
              url_gambar,
              kategori: kategori.trim(),
              description,
              handling_notes,
              jenis_layanan,
              harga_diskon: harga_diskon ? Number(harga_diskon) : null,
              meta_title,            
              meta_description,  
              tag_produk: tag_produk ? tag_produk.trim() : null, // <-- INI YANG BARU
              spesifikasi: spesifikasiArray
            };
    let produkIdTerproses = null;

    try {
        if (produkUntukDiedit) {
            // 1. PROSES EDIT PRODUK UTAMA
            produkIdTerproses = produkUntukDiedit.id;
            const { error: errorUpdate } = await supabase.from('produk').update(dataToSave).eq('id', produkIdTerproses);
            if (errorUpdate) throw errorUpdate;

            // 2. MANAJEMEN HAPUS VARIASI SAAT EDIT
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

            // 3. MANAJEMEN HAPUS GAMBAR SAAT EDIT (Sudah dipindah ke tempat yang benar)
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

        } else {
            // PROSES INSERT PRODUK BARU
            const { data, error: errorInsert } = await supabase.from('produk').insert([dataToSave]).select();
            if (errorInsert) throw errorInsert;
            produkIdTerproses = data[0].id;
        }

        // PROSES SIMPAN/UPDATE DATA VARIASI (Diperbaiki agar tidak error Supabase)
        if (variasiList.length > 0) {
            const variasiBaru = [];
            const variasiLama = [];

            variasiList.forEach(v => {
                const payload = {
                    produk_id: produkIdTerproses,
                    nama_variasi: v.nama_variasi,
                    harga: Number(v.harga),
                    stok: Number(v.stok)
                };
                if (v.id) {
                    payload.id = v.id; 
                    variasiLama.push(payload); // Masuk antrean Update
                } else {
                    variasiBaru.push(payload); // Masuk antrean Insert
                }
            });

            // Jalankan Update untuk variasi lama
            if (variasiLama.length > 0) {
                const { error: errorUpdateVar } = await supabase.from('produk_variasi').upsert(variasiLama);
                if (errorUpdateVar) throw errorUpdateVar;
            }
            // Jalankan Insert untuk variasi baru
            if (variasiBaru.length > 0) {
                const { error: errorInsertVar } = await supabase.from('produk_variasi').insert(variasiBaru);
                if (errorInsertVar) throw errorInsertVar;
            }
        }
        
        // PROSES SIMPAN/UPDATE DATA GAMBAR TAMBAHAN (Sama seperti logika variasi)
        if (gambarList.length > 0) {
            const gambarBaru = [];
            const gambarLama = [];

            gambarList.forEach(g => {
                const payload = {
                    produk_id: produkIdTerproses,
                    gambar_url: g.gambar_url
                };
                if (g.id) {
                    payload.id = g.id;
                    gambarLama.push(payload);
                } else {
                    gambarBaru.push(payload);
                }
            });

            if (gambarLama.length > 0) {
                const { error: errorUpdateGambar } = await supabase.from('produk_gambar').upsert(gambarLama);
                if (errorUpdateGambar) throw errorUpdateGambar;
            }
            if (gambarBaru.length > 0) {
                const { error: errorInsertGambar } = await supabase.from('produk_gambar').insert(gambarBaru);
                if (errorInsertGambar) throw errorInsertGambar;
            }
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
    setSlug(produk.slug || '');
    setHarga(produk.harga);
    setStok(produk.stok);
    setUrlGambar(produk.url_gambar || '');
    setGambarList(produk.produk_gambar || []);
    setKategori(produk.kategori);
    setDescription(produk.description || '');
    setHandlingNotes(produk.handling_notes || '');
    setJenisLayanan(produk.jenis_layanan || 'Sewa');
    setHargaDiskon(produk.harga_diskon || '');
    setMetaTitle(produk.meta_title || '');
    setMetaDescription(produk.meta_description || '');
    setIsKategoriBaru(false);
    setTagProduk(produk.tag_produk || '');
    setVariasiList(produk.produk_variasi || []);
      if (produk.spesifikasi) {
          if (Array.isArray(produk.spesifikasi)) {
              // Jika formatnya sudah Array (Baru)
              const arrSpesifikasi = produk.spesifikasi.map(item => ({ key: item.label, value: item.nilai }));
              setSpesifikasiList(arrSpesifikasi);
          } else if (typeof produk.spesifikasi === 'object') {
              // Jika formatnya masih Objek (Lama/Legacy)
              const arrSpesifikasi = Object.entries(produk.spesifikasi).map(([k, v]) => ({ key: k, value: v }));
              setSpesifikasiList(arrSpesifikasi);
          }
      } else {
          setSpesifikasiList([]);
      }
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
                <div className="bg-gray-800 p-6 rounded-sm shadow-xl border border-gray-700 border-t-4 border-t-teal-500">
                    <h2 className="text-lg font-extrabold mb-6 text-white uppercase tracking-wider">
                        {produkUntukDiedit ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h2>
                    
                    <form onSubmit={handleSimpan} className="space-y-5">
                        <div className="space-y-5">
                            
                            {/* JENIS LAYANAN */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Jenis Layanan</label>
                                <select
                                  value={jenis_layanan}
                                  onChange={(e) => setJenisLayanan(e.target.value)}
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 font-semibold appearance-none"
                                >
                                  <option value="Sewa">Sewa</option>
                                  <option value="Penjualan">Penjualan</option>
                                  <option value="Laundry">Laundry</option>
                                </select>
                            </div>

                            {/* NAMA PRODUK */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nama Produk</label>
                                <input
                                  type="text"
                                  value={nama}
                                  onChange={(e) => {
                                      setNama(e.target.value);
                                      setSlug(generateSlug(e.target.value));
                                  }}
                                  placeholder="Contoh: Carrier Eiger 45L"
                                  required
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                />
                            </div>

                            {/* SLUG */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Slug URL</label>
                                <input
                                  type="text"
                                  value={slug}
                                  onChange={async (e) => {
                                      const value = e.target.value;
                                      setSlug(value);
                                      clearTimeout(window.slugTimer);
                                      window.slugTimer = setTimeout(async () => {
                                        if (value) {
                                          const isUnique = await cekSlugUnik(value, produkUntukDiedit?.id);
                                          setSlugStatus(isUnique ? '✅ TERSEDIA' : '❌ DIGUNAKAN');
                                        } else {
                                          setSlugStatus('');
                                        }
                                      }, 500);
                                  }}
                                  placeholder="otomatis-dari-nama"
                                  required
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                />
                                {slugStatus && (
                                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${slugStatus.includes('✅') ? 'text-teal-400' : 'text-red-400'}`}>
                                    {slugStatus}
                                  </p>
                                )}
                            </div>
                            
                            {/* META TITLE */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Title (SEO)</label>
                                <input
                                  type="text"
                                  value={meta_title}
                                  onChange={(e) => setMetaTitle(e.target.value)}
                                  placeholder="Judul SEO untuk Google..."
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                />
                            </div>

                            {/* META DESCRIPTION */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Description (SEO)</label>
                                <textarea
                                  value={meta_description}
                                  onChange={(e) => setMetaDescription(e.target.value)}
                                  placeholder="Ringkasan singkat untuk hasil pencarian Google..."
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 min-h-[80px] placeholder-gray-600"
                                ></textarea>
                            </div>

                            {/* HARGA */}
                            <div className="flex gap-4">
                              <div className="w-1/2">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Harga Utama</label>
                                  <input
                                    type="number"
                                    value={harga}
                                    onChange={(e) => setHarga(e.target.value)}
                                    placeholder="Rp"
                                    required
                                    className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                  />
                              </div>
                              <div className="w-1/2">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Harga Diskon</label>
                                  <input
                                    type="number"
                                    value={harga_diskon}
                                    onChange={(e) => setHargaDiskon(e.target.value)}
                                    placeholder="Rp (Opsional)"
                                    className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                  />
                              </div>
                            </div>

                            {/* STOK & KATEGORI */}
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Stok</label>
                                    <input
                                      type="number"
                                      value={stok}
                                      onChange={(e) => setStok(e.target.value)}
                                      placeholder="Jumlah"
                                      required
                                      className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600"
                                    />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Kategori</label>
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
                                      className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 appearance-none"
                                    >
                                      <option value="" disabled>-- Pilih Kategori --</option>
                                      {daftarKategoriForm.map((kat) => (
                                        <option key={kat} value={kat}>{kat}</option>
                                      ))}
                                      <option value="KategoriBaru" className="text-teal-400 font-bold">+ BUAT BARU...</option>
                                    </select>
                                </div>
                            </div>
                            
                            {isKategoriBaru && (
                                <div>
                                    <input
                                      type="text"
                                      value={kategori}
                                      onChange={(e) => setKategori(e.target.value)}
                                      placeholder="Nama kategori baru..."
                                      required
                                      className="w-full p-3 bg-gray-900 border border-teal-500 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none rounded-sm transition-all text-gray-100"
                                    />
                                </div>
                            )}

                            {/* FORM INPUT TAG PRODUK KUSTOM */}
                            <div className="mt-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-red-400">Tag Custom (Pita Merah)</label>
                                <input
                                  type="text"
                                  value={tag_produk}
                                  onChange={(e) => setTagProduk(e.target.value)}
                                  placeholder="Opsional (Contoh: PROMO, TERLARIS...)"
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none rounded-sm transition-all text-gray-100 placeholder-gray-600 uppercase"
                                />
                            </div>

                            {/* DYNAMIC LISTS: VARIASI */}
                            <div className="mt-6 border-t border-gray-700 pt-5">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest">Variasi Produk</label>
                                    <button 
                                        type="button" 
                                        onClick={tambahBarisVariasi} 
                                        className="text-[10px] uppercase tracking-widest font-bold bg-gray-700/50 text-gray-300 px-3 py-1.5 border border-gray-600 hover:bg-teal-600 hover:text-white hover:border-teal-500 transition-all rounded-sm flex items-center"
                                    >
                                        + Tambah
                                    </button>
                                </div>
                                {variasiList.length === 0 && (
                                    <p className="text-xs text-gray-600 italic font-medium mb-4">Tidak ada variasi.</p>
                                )}
                                <div className="space-y-3">
                                    {variasiList.map((variasi, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-900/50 p-3 rounded-sm border border-gray-700 border-l-2 border-l-teal-500">
                                            <div className="flex-grow space-y-2">
                                                <input
                                                    type="text"
                                                    value={variasi.nama_variasi}
                                                    onChange={(e) => handleUbahVariasi(index, 'nama_variasi', e.target.value)}
                                                    placeholder="Nama (mis: 45L Hitam)"
                                                    required
                                                    className="w-full p-2 text-sm bg-gray-800 border border-gray-600 focus:border-teal-500 text-white rounded-sm outline-none transition-colors"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={variasi.harga}
                                                        onChange={(e) => handleUbahVariasi(index, 'harga', e.target.value)}
                                                        placeholder="Harga"
                                                        required
                                                        className="w-full p-2 text-sm bg-gray-800 border border-gray-600 focus:border-teal-500 text-white rounded-sm outline-none transition-colors"
                                                    />
                                                    {jenis_layanan !== 'Laundry' && (
                                                        <input
                                                            type="number"
                                                            value={variasi.stok}
                                                            onChange={(e) => handleUbahVariasi(index, 'stok', e.target.value)}
                                                            placeholder="Stok"
                                                            required
                                                            className="w-full p-2 text-sm bg-gray-800 border border-gray-600 focus:border-teal-500 text-white rounded-sm outline-none transition-colors"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => hapusBarisVariasi(index)}
                                                className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-sm h-full transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DYNAMIC LISTS: SPESIFIKASI */}
                            <div className="mt-6 border-t border-gray-700 pt-5">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest">Spesifikasi Detail</label>
                                    <button 
                                        type="button" 
                                        onClick={tambahBarisSpesifikasi} 
                                        className="text-[10px] uppercase tracking-widest font-bold bg-gray-700/50 text-gray-300 px-3 py-1.5 border border-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all rounded-sm flex items-center"
                                    >
                                        + Tambah
                                    </button>
                                </div>
                                {spesifikasiList.length === 0 && (
                                    <p className="text-xs text-gray-600 italic font-medium mb-4">Tidak ada spesifikasi khusus.</p>
                                )}
                                <div className="space-y-3">
                                    {spesifikasiList.map((spec, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-900/50 p-3 rounded-sm border border-gray-700 border-l-2 border-l-blue-500">
                                            <div className="flex-grow flex gap-2">
                                                <input
                                                    type="text"
                                                    value={spec.key}
                                                    onChange={(e) => handleUbahSpesifikasi(index, 'key', e.target.value)}
                                                    placeholder="Label"
                                                    required
                                                    className="w-1/3 p-2 text-sm bg-gray-800 border border-gray-600 focus:border-blue-500 text-white rounded-sm outline-none transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    value={spec.value}
                                                    onChange={(e) => handleUbahSpesifikasi(index, 'value', e.target.value)}
                                                    placeholder="Nilai (mis: Polyester)"
                                                    required
                                                    className="w-2/3 p-2 text-sm bg-gray-800 border border-gray-600 focus:border-blue-500 text-white rounded-sm outline-none transition-colors"
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => hapusBarisSpesifikasi(index)}
                                                className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-sm transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* GAMBAR */}
                            <div className="mt-6 border-t border-gray-700 pt-5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Gambar Utama (URL)</label>
                                <input
                                  type="text"
                                  value={url_gambar}
                                  onChange={(e) => setUrlGambar(e.target.value)}
                                  placeholder="Link gambar utama..."
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100"
                                />
                            </div>

                            {/* DYNAMIC LISTS: GAMBAR TAMBAHAN */}
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Galeri Tambahan</label>
                                    <button 
                                        type="button" 
                                        onClick={tambahBarisGambar} 
                                        className="text-[10px] uppercase tracking-widest font-bold bg-gray-700/50 text-gray-300 px-3 py-1.5 border border-gray-600 hover:bg-teal-600 hover:text-white hover:border-teal-500 transition-all rounded-sm flex items-center"
                                    >
                                        + Gambar
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {gambarList.map((gambar, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-900/50 p-2 rounded-sm border border-gray-700">
                                            <input
                                                type="text"
                                                value={gambar.gambar_url}
                                                onChange={(e) => handleUbahGambar(index, e.target.value)}
                                                placeholder="Link gambar..."
                                                required
                                                className="flex-grow p-2 text-sm bg-gray-800 border border-gray-600 focus:border-teal-500 text-white rounded-sm outline-none transition-colors"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => hapusBarisGambar(index)}
                                                className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-sm transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DESKRIPSI & CATATAN */}
                            <div className="mt-6 border-t border-gray-700 pt-5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Deskripsi Produk</label>
                                <textarea
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="Tulis spesifikasi lengkap..."
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 min-h-[100px]"
                                ></textarea>
                            </div>
                            <div className="mt-3">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Catatan Handling</label>
                                <textarea
                                  value={handling_notes}
                                  onChange={(e) => setHandlingNotes(e.target.value)}
                                  placeholder="Contoh: Dicuci kering, rawan sobek..."
                                  className="w-full p-3 bg-gray-900 border border-gray-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-sm transition-all text-gray-100 min-h-[80px]"
                                ></textarea>
                            </div>
                        </div>

                        {/* SUBMIT BUTTONS */}
                        <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-700">
                            <button
                                type="submit"
                                className="flex-grow flex items-center justify-center p-3.5 rounded-sm bg-teal-600 text-white text-[11px] font-extrabold uppercase tracking-widest hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-900/50 transition-all"
                            >
                                <IconPlus />
                                {produkUntukDiedit ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK'}
                            </button>
                            {produkUntukDiedit && (
                                <button
                                  type="button"
                                  onClick={resetForm}
                                  className="w-1/3 flex items-center justify-center p-3.5 rounded-sm bg-gray-700 text-white text-[11px] font-extrabold uppercase tracking-widest hover:bg-gray-600 transition-all border border-gray-600"
                                >
                                    BATAL
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            {/* Kolom 2: Daftar Produk */}
            <div className="lg:w-2/3 w-full lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-sm shadow-xl border border-gray-700 border-t-4 border-t-gray-600">
                    <h2 className="text-lg font-extrabold mb-6 text-white uppercase tracking-wider">Daftar Produk & Layanan</h2>
                    
                    {/* Search & Filter */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 mt-4">
                      <input
                        type="text"
                        placeholder="CARI PRODUK..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full xl:w-2/5 p-3 bg-gray-900 rounded-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-white text-sm placeholder-gray-600 font-medium"
                      />

                      <div className="flex items-center gap-3 w-full xl:w-3/5">
                        <select
                          value={layananFilter}
                          onChange={(e) => setLayananFilter(e.target.value)}
                          className="flex-grow p-3 bg-gray-900 rounded-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-white text-sm font-semibold uppercase tracking-wide appearance-none"
                        >
                          {layananUnik.map((layanan) => (
                            <option key={layanan} value={layanan}>{layanan === 'Semua' ? 'SEMUA LAYANAN' : layanan}</option>
                          ))}
                        </select>

                        <select
                          value={kategoriFilter}
                          onChange={(e) => setKategoriFilter(e.target.value)}
                          className="flex-grow p-3 bg-gray-900 rounded-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-white text-sm font-semibold uppercase tracking-wide appearance-none"
                        >
                          {kategoriUnik.map((kategori) => (
                            <option key={kategori} value={kategori}>{kategori === 'Semua' ? 'SEMUA KATEGORI' : kategori}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setKategoriFilter('Semua');
                            setLayananFilter('Semua');
                          }}
                          className="px-5 py-3 bg-gray-700 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-sm hover:bg-gray-600 transition-all border border-gray-600 whitespace-nowrap"
                        >
                          RESET
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-sm border border-gray-700 shadow-sm">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-900 border-b border-gray-700">
                                  <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nama Produk</th>
                                  <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Layanan</th>
                                  <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Harga Utama</th>
                                  <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Info Tambahan</th>
                                  <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {produkTerfilter.length > 0 ? (
                                produkTerfilter.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                                      <td className="px-5 py-4 text-sm font-bold text-white max-w-[200px]">
                                        {item.nama}
                                        <div className="flex gap-2 mt-2">
                                          <span className="text-[9px] bg-gray-900 border border-gray-600 px-2 py-1 rounded-sm text-gray-400 uppercase tracking-wider font-bold">{item.kategori}</span>
                                          
                                          {/* INDIKATOR TAG DI TABEL */}
                                          {item.tag_produk && (
                                            <span className="text-[9px] bg-red-900/30 border border-red-500/50 px-2 py-1 rounded-sm text-red-400 uppercase tracking-wider font-bold">
                                              {item.tag_produk}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-1 rounded-sm text-[10px] font-extrabold uppercase tracking-wider border ${
                                          (item.jenis_layanan || 'Sewa') === 'Sewa' ? 'bg-blue-900/20 text-blue-400 border-blue-800/50' :
                                          (item.jenis_layanan) === 'Penjualan' ? 'bg-green-900/20 text-green-400 border-green-800/50' :
                                          'bg-purple-900/20 text-purple-400 border-purple-800/50'
                                        }`}>
                                          {item.jenis_layanan || 'Sewa'}
                                        </span>
                                      </td>
                                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                                        Rp {item.harga.toLocaleString('id-ID')}
                                        {item.harga_diskon && (
                                            <span className="block text-[11px] font-semibold text-red-400 line-through mt-1">Rp {item.harga_diskon.toLocaleString('id-ID')}</span>
                                        )}
                                      </td>
                                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {item.produk_variasi && item.produk_variasi.length > 0 ? (
                                            <span className="text-teal-400 font-bold text-[10px] uppercase tracking-wider bg-teal-900/20 px-2 py-1.5 rounded-sm border border-teal-800/50">
                                                {item.produk_variasi.length} VARIASI
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-medium uppercase tracking-wider">Stok: {item.stok}</span>
                                        )}
                                      </td>
                                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-2">
                                          <button onClick={() => handleEdit(item)} className="text-yellow-500 hover:text-white p-2 bg-yellow-500/10 hover:bg-yellow-600 rounded-sm transition-all border border-transparent hover:border-yellow-600">
                                            <IconEdit />
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-white p-2 bg-red-500/10 hover:bg-red-600 rounded-sm transition-all border border-transparent hover:border-red-600">
                                            <IconTrash />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="px-5 py-16 text-center text-gray-500">
                                      <span className="text-4xl block mb-3 opacity-40">🏕️</span>
                                      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Produk tidak ditemukan.</span>
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