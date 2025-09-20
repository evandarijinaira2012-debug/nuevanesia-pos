import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/id';

// --- Komponen Ikon (Tidak ada perubahan) ---
const IconEdit = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
);
const IconTrash = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m3 0h6"></path></svg>
);
const IconChevronLeft = () => (
  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);
const IconEye = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);
const IconSearch = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

const Superadmin = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [transaksiUntukDiedit, setTransaksiUntukDiedit] = useState(null);
  const [tanggalMulaiBaru, setTanggalMulaiBaru] = useState('');
  const [tanggalSelesaiBaru, setTanggalSelesaiBaru] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTransaksi, setDetailTransaksi] = useState([]);
  const [produkLengkap, setProdukLengkap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [produkList, setProdukList] = useState([]);
  const [produkBaru, setProdukBaru] = useState({ id: '', jumlah: 1 });
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    fetchTransaksi();
    fetchProdukLengkap();
    fetchProdukList();
  }, []);

  const fetchTransaksi = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transaksi')
      .select('*, pelanggan:pelanggan_id(nama, no_whatsapp)');

    if (error) {
      console.error('Error fetching transaksi:', error);
      toast.error('Gagal memuat daftar transaksi.');
    } else {
      setTransaksi(data);
    }
    setIsLoading(false);
  };

  const fetchProdukLengkap = async () => {
    const { data, error } = await supabase
      .from('produk')
      .select('id, nama, harga, stok');
    if (error) {
      console.error('Error fetching produk:', error);
    } else {
      const produkMap = data.reduce((map, p) => {
        map[p.id] = p;
        return map;
      }, {});
      setProdukLengkap(produkMap);
    }
  };

  const fetchProdukList = async () => {
    const { data, error } = await supabase
      .from('produk')
      .select('id, nama, stok');
    if (error) {
      console.error('Error fetching produk list:', error);
    } else {
      setProdukList(data);
    }
  };

  const handleEdit = async (transaksi) => {
    setTransaksiUntukDiedit(transaksi);
    if (transaksi.tanggal_mulai) {
      setTanggalMulaiBaru(moment(transaksi.tanggal_mulai).format('YYYY-MM-DD'));
    }
    if (transaksi.tanggal_selesai) {
      setTanggalSelesaiBaru(moment(transaksi.tanggal_selesai).format('YYYY-MM-DD'));
    }

    const { data, error } = await supabase
      .from('transaksi_detail')
      .select('*, produk:produk_id(nama, harga)')
      .eq('transaksi_id', transaksi.id);

    if (error) {
      console.error('Error fetching transaksi detail:', error);
      toast.error('Gagal memuat detail transaksi.');
    } else {
      setDetailTransaksi(data);
    }
  };

  const handleDeleteTransaction = async (transaksiId) => {
    const konfirmasi = window.confirm('yakin deuk di hapus bos?data stok bakal dibalikeun.');
    if (!konfirmasi) {
      return;
    }

    const toastId = toast.loading('Menghapus transaksi...');

    try {
        // Step 1: Ambil detail transaksi yang akan dihapus dari database
        const { data: detailData, error: detailError } = await supabase
            .from('transaksi_detail')
            .select('*')
            .eq('transaksi_id', transaksiId);

        if (detailError) {
            throw new Error('Gagal mengambil detail transaksi: ' + detailError.message);
        }

        // Step 2: Ambil data stok produk saat ini untuk setiap item yang akan dikembalikan
        const productIds = detailData.map(item => item.produk_id);
        const { data: produkData, error: produkError } = await supabase
            .from('produk')
            .select('id, stok')
            .in('id', productIds);

        if (produkError) {
            throw new Error('Gagal mengambil data produk: ' + produkError.message);
        }

        const produkStokMap = produkData.reduce((map, p) => {
            map[p.id] = p.stok;
            return map;
        }, {});

        // Step 3: Siapkan array promises untuk memperbarui stok
        const stokUpdatesPromises = detailData.map(item => {
            const stokSaatIni = produkStokMap[item.produk_id];
            // Hitung stok baru dengan menambahkan jumlah barang yang dikembalikan
            const newStok = stokSaatIni + item.jumlah;
            
            // Siapkan promise untuk update stok
            return supabase.from('produk').update({ stok: newStok }).eq('id', item.produk_id);
        });

        // Step 4: Jalankan semua update stok secara paralel dan tunggu hingga selesai
        await Promise.all(stokUpdatesPromises);
        
        // Step 5: Jika semua stok sudah berhasil diperbarui, barulah hapus detail transaksi dan transaksi utama
        const { error: deleteDetailsError } = await supabase.from('transaksi_detail').delete().eq('transaksi_id', transaksiId);
        if (deleteDetailsError) throw deleteDetailsError;

        const { error: deleteTransactionError } = await supabase.from('transaksi').delete().eq('id', transaksiId);
        if (deleteTransactionError) throw deleteTransactionError;

        // Step 6: Beri notifikasi sukses
        toast.success('Transaksi berhasil dihapus dan stok telah dikembalikan!', { id: toastId });
        // Refresh daftar transaksi di UI
        fetchTransaksi();
        resetForm();

    } catch (error) {
        console.error('Gagal menghapus transaksi:', error);
        toast.error('Gagal menghapus transaksi: ' + error.message, { id: toastId });
    }
  };

  const handleTambahProduk = () => {
    if (!produkBaru.id) {
        toast.error('Pilih produk yang ingin ditambahkan.');
        return;
    }

    const produkYangDipilih = produkList.find(p => p.id === produkBaru.id);
    const itemSudahAda = detailTransaksi.find(item => item.produk_id === produkBaru.id);
    
    if (itemSudahAda) {
      toast.error('Produk ini sudah ada dalam transaksi. Silakan ubah jumlahnya langsung.');
      return;
    }

    const produkStok = produkLengkap[produkBaru.id].stok;
    if (produkBaru.jumlah > produkStok) {
      toast.error('Stok produk tidak mencukupi.');
      return;
    }

    const newItem = {
      produk_id: produkBaru.id,
      jumlah: produkBaru.jumlah,
      produk: {
        nama: produkYangDipilih.nama,
        harga: produkLengkap[produkBaru.id].harga,
      }
    };

    setDetailTransaksi([...detailTransaksi, newItem]);
    setProdukBaru({ id: '', jumlah: 1 });
  };

  const handleSimpanItem = async () => {
    // Tambahkan konfirmasi pop-up sebelum menyimpan
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menyimpan perubahan pada transaksi ini?');
    if (!konfirmasi) {
        return;
    }

    if (!transaksiUntukDiedit) return;
    const toastId = toast.loading('Menyimpan perubahan...');

    if (moment(tanggalMulaiBaru).isAfter(moment(tanggalSelesaiBaru))) {
        toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
        toast.dismiss(toastId);
        return;
    }

    try {
      const { data: oldDetails, error: fetchError } = await supabase
        .from('transaksi_detail')
        .select('produk_id, jumlah')
        .eq('transaksi_id', transaksiUntukDiedit.id);

      if (fetchError) throw fetchError;

      const perubahanStok = {};
      
      for (const oldItem of oldDetails) {
          const newItem = detailTransaksi.find(item => item.produk_id === oldItem.produk_id);
          const selisih = (newItem ? oldItem.jumlah - newItem.jumlah : oldItem.jumlah);
          if (selisih !== 0) {
              perubahanStok[oldItem.produk_id] = (perubahanStok[oldItem.produk_id] || 0) + selisih;
          }
      }

      const updates = detailTransaksi.filter(item => item.id).map(item =>
        supabase
          .from('transaksi_detail')
          .update({ jumlah: item.jumlah })
          .eq('id', item.id)
      );

      const newItems = detailTransaksi.filter(item => !item.id).map(item => ({
        transaksi_id: transaksiUntukDiedit.id,
        produk_id: item.produk_id,
        jumlah: item.jumlah
      }));

      const deletions = detailTransaksi
        .filter(item => item.id && item.jumlah <= 0)
        .map(item => supabase.from('transaksi_detail').delete().eq('id', item.id));

      await Promise.all([...updates, ...deletions, supabase.from('transaksi_detail').insert(newItems)]);

      for (const oldItem of oldDetails) {
          const newItem = detailTransaksi.find(item => item.produk_id === oldItem.produk_id);
          const selisih = (newItem ? oldItem.jumlah - newItem.jumlah : oldItem.jumlah);
          if (selisih !== 0) {
              perubahanStok[oldItem.produk_id] = (perubahanStok[oldItem.produk_id] || 0) + selisih;
          }
      }

      for (const newItem of newItems) {
        perubahanStok[newItem.produk_id] = (perubahanStok[newItem.produk_id] || 0) - newItem.jumlah;
      }


      const stokUpdates = Object.keys(perubahanStok).map(produkId => {
          const jumlahPerubahan = perubahanStok[produkId];
          const produkSaatIni = produkLengkap[produkId];
          const newStok = produkSaatIni.stok + jumlahPerubahan;
          return supabase.from('produk').update({ stok: newStok }).eq('id', produkId);
      });
      await Promise.all(stokUpdates);

      const subtotalHarianBaru = detailTransaksi.reduce((sum, item) => sum + ((item.produk?.harga || 0) * item.jumlah), 0);
      const durasi = hitungDurasiHari(tanggalMulaiBaru, tanggalSelesaiBaru);
      
      let totalBiayaBaru;
      if (durasi >= 3) {
        const biayaDuaMalamPertama = subtotalHarianBaru * 2;
        const sisaMalam = durasi - 2;
        const biayaDiskon = (subtotalHarianBaru * 0.5) * sisaMalam;
        totalBiayaBaru = biayaDuaMalamPertama + biayaDiskon;
      } else {
        totalBiayaBaru = subtotalHarianBaru * durasi;
      }
      
      totalBiayaBaru = Math.max(0, totalBiayaBaru - transaksiUntukDiedit.diskon_manual);

      await supabase
        .from('transaksi')
        .update({
          total_biaya: totalBiayaBaru,
          tanggal_mulai: tanggalMulaiBaru,
          tanggal_selesai: tanggalSelesaiBaru
        })
        .eq('id', transaksiUntukDiedit.id);

      toast.success('Transaksi berhasil diperbarui!', { id: toastId });
      fetchTransaksi();
      resetForm();
    } catch (error) {
      console.error('Gagal memperbarui transaksi:', error);
      toast.error('Gagal memperbarui transaksi.', { id: toastId });
    }
  };

  const handleKurangiJumlah = (itemId) => {
    setDetailTransaksi(prevDetails =>
      prevDetails.map(item =>
        (item.id === itemId || item.produk_id === itemId) ? { ...item, jumlah: Math.max(0, item.jumlah - 1) } : item
      )
    );
  };

  const handleTambahJumlah = (itemId) => {
    setDetailTransaksi(prevDetails =>
      prevDetails.map(item => {
        const produkInfo = produkLengkap[item.produk_id];
        if ((item.id === itemId || item.produk_id === itemId) && produkInfo) {
          const itemLama = prevDetails.find(i => (i.id === itemId || i.produk_id === itemId));
          const stokLama = itemLama?.jumlah || 0;
          const stokBaru = item.jumlah + 1;
          
          if (stokBaru > (produkInfo.stok + stokLama)) {
            toast.error('Stok produk tidak mencukupi.');
            return item;
          }

          return { ...item, jumlah: stokBaru };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (itemId) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus item ini? Stok akan dikembalikan.');
    if (konfirmasi) {
      setDetailTransaksi(prevDetails => prevDetails.filter(item => (item.id !== itemId && item.produk_id !== itemId)));
    }
  };

  const resetForm = () => {
    setTransaksiUntukDiedit(null);
    setDetailTransaksi([]);
    setTanggalMulaiBaru('');
    setTanggalSelesaiBaru('');
    setProdukBaru({ id: '', jumlah: 1 });
    setProductSearchQuery('');
  };

  const transaksiTerfilter = transaksi.filter((item) => {
    const namaPelanggan = item.pelanggan?.nama || '';
    return namaPelanggan.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const hitungDurasiHari = (mulai, selesai) => {
    if (mulai && selesai) {
      const tglMulai = moment(mulai);
      const tglSelesai = moment(selesai);
      const selisihHari = tglSelesai.diff(tglMulai, 'days');
      return selisihHari > 0 ? selisihHari : 0;
    }
    return 0;
  };

  const hitungSubtotalBaru = () => {
    return detailTransaksi.reduce((sum, item) => {
      const harga = item.produk?.harga || (produkLengkap[item.produk_id]?.harga || 0);
      return sum + (harga * item.jumlah);
    }, 0);
  };

  const hitungTotalAkhirBaru = () => {
    const durasi = hitungDurasiHari(tanggalMulaiBaru, tanggalSelesaiBaru);
    if (durasi === 0) return 0;
    
    let subtotal = hitungSubtotalBaru() * durasi;
    
    if (durasi >= 3) {
      const biayaDuaMalamPertama = hitungSubtotalBaru() * 2;
      const sisaMalam = durasi - 2;
      const biayaDiskon = (hitungSubtotalBaru() * 0.5) * sisaMalam;
      subtotal = biayaDuaMalamPertama + biayaDiskon;
    }
    
    return Math.max(0, subtotal - transaksiUntukDiedit?.diskon_manual);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8 font-sans">
      <Head>
        <title>Superadmin</title>
      </Head>
      <Toaster />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Superadmin</h1>
          <Link href="/" className="flex items-center text-teal-400 hover:text-teal-300 transition-colors">
            <IconChevronLeft />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 w-full sticky top-8 h-fit lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-6 text-white">{transaksiUntukDiedit ? 'Edit Transaksi' : 'Pilih Transaksi untuk Diedit'}</h2>
                    {transaksiUntukDiedit && (
                        <div className="space-y-4">
                             <div className="p-4 bg-gray-700 rounded-lg">
                                <p className="text-lg font-bold text-white">Pelanggan: <span className="font-normal">{transaksiUntukDiedit.pelanggan?.nama}</span></p>
                                <p className="text-sm text-gray-400">Whatsapp: {transaksiUntukDiedit.pelanggan?.no_whatsapp || 'N/A'}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={tanggalMulaiBaru}
                                    onChange={(e) => setTanggalMulaiBaru(e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                                <label className="block text-sm font-medium text-gray-400">Tanggal Selesai</label>
                                <input
                                    type="date"
                                    value={tanggalSelesaiBaru}
                                    onChange={(e) => setTanggalSelesaiBaru(e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                />
                                <p className="text-sm text-gray-400">Durasi: <span className="font-semibold">{hitungDurasiHari(tanggalMulaiBaru, tanggalSelesaiBaru)} Malam</span></p>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-white mt-6">Item Disewa</h3>
                            <div className="space-y-3">
                                {detailTransaksi.length > 0 ? (
                                    detailTransaksi.map(item => (
                                        <div key={item.id || item.produk_id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                            <div className="flex-grow">
                                                <p className="font-medium text-white">{item.produk?.nama}</p>
                                                <p className="text-sm text-gray-400">Rp{(item.produk?.harga || produkLengkap[item.produk_id]?.harga || 0).toLocaleString('id-ID')} x {item.jumlah}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleKurangiJumlah(item.id || item.produk_id)} className="text-white bg-gray-600 rounded-md p-1 hover:bg-gray-500">-</button>
                                                <span className="font-semibold">{item.jumlah}</span>
                                                <button onClick={() => handleTambahJumlah(item.id || item.produk_id)} className="text-white bg-gray-600 rounded-md p-1 hover:bg-gray-500">+</button>
                                                <button onClick={() => handleDeleteItem(item.id || item.produk_id)} className="text-red-400 hover:text-red-300">
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Tidak ada item dalam transaksi ini.</p>
                                )}
                            </div>

                            <h3 className="text-xl font-semibold text-white mt-6">Tambah Item Baru</h3>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow space-y-2">
                                    <label className="block text-sm font-medium text-gray-400">Pilih Produk</label>
                                     <div className="relative mb-2">
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                          <IconSearch />
                                      </div>
                                      <input
                                          type="text"
                                          placeholder="Cari produk..."
                                          value={productSearchQuery}
                                          onChange={(e) => setProductSearchQuery(e.target.value)}
                                          className="w-full p-2 pl-10 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                                      />
                                    </div>
                                    <select
                                        value={produkBaru.id}
                                        onChange={(e) => setProdukBaru({ ...produkBaru, id: e.target.value })}
                                        className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Pilih produk...</option>
                                        {produkList
                                            .filter(produk => produk.nama.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                            .map(produk => (
                                                <option key={produk.id} value={produk.id}>{produk.nama} (Sisa: {produk.stok})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 w-24">
                                    <label className="block text-sm font-medium text-gray-400">Jumlah</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={produkBaru.jumlah}
                                        onChange={(e) => setProdukBaru({ ...produkBaru, jumlah: parseInt(e.target.value) || 1 })}
                                        className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <button
                                    onClick={handleTambahProduk}
                                    className="p-3 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-teal-500 transition-colors h-11"
                                >
                                    <IconPlus />
                                </button>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal Baru:</span>
                                    <span className="font-semibold">Rp{hitungSubtotalBaru().toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total Akhir Baru:</span>
                                    <span className="font-semibold text-teal-400">Rp{hitungTotalAkhirBaru().toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button onClick={handleSimpanItem} className="flex-grow flex items-center justify-center p-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-colors">
                                    Simpan Perubahan
                                </button>
                                <button type="button" onClick={resetForm} className="flex-grow flex items-center justify-center p-3 rounded-lg bg-gray-600 text-gray-200 font-semibold hover:bg-gray-500 transition-colors">
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="lg:w-2/3 w-full lg:h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Daftar Transaksi</h2>
                    <div className="mb-6">
                        <input type="text" placeholder="Cari nama pelanggan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-700">
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pelanggan</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Biaya</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Durasi</th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {isLoading ? (
                                    <tr>
                                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                        Memuat data...
                                      </td>
                                    </tr>
                                ) : (
                                  transaksiTerfilter.length > 0 ? (
                                    transaksiTerfilter.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{moment(item.tanggal_mulai).format('DD/MM/YYYY')}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{item.pelanggan?.nama || 'N/A'}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">Rp{item.total_biaya.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{hitungDurasiHari(item.tanggal_mulai, item.tanggal_selesai)} malam</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-center space-x-3">
                                                    <button onClick={() => handleEdit(item)} className="text-yellow-500 hover:text-yellow-400">
                                                        <IconEye />
                                                    </button>
                                                    <button onClick={() => handleDeleteTransaction(item.id)} className="text-red-500 hover:text-red-400">
                                                        <IconTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                        Tidak ada transaksi yang ditemukan.
                                      </td>
                                    </tr>
                                  )
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

export default Superadmin;