import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import ProductPopup from '../components/ProductPopup'; // Komponen ini tetap digunakan

// --- [PROJECT AURORA] ---
// Ikonografi baru untuk tampilan yang lebih modern dan konsisten.
const IconChartBar = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20V16"/></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconTool = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
const IconShoppingCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;


export default function Home() {
    // --- State Management (Tidak ada perubahan fungsional) ---
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
    const [searchQuery, setSearchQuery] = useState('');
    const [session, setSession] = useState(null);
    const router = useRouter();
    const [metodePembayaran, setMetodePembayaran] = useState('Cash');
    const [catatan, setCatatan] = useState('');
    const [diskon, setDiskon] = useState(0);
    const [justAddedProductId, setJustAddedProductId] = useState(null);
    const [diskonOtomatisAktif, setDiskonOtomatisAktif] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');

    // --- [PROJECT AURORA] State untuk UI baru ---
    const [isCartOpen, setIsCartOpen] = useState(false);

    // --- Logika Bisnis (Tidak ada perubahan fungsional, hanya pemindahan) ---
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
        let subtotal = hitungSubtotalPerMalam() * durasi;
        if (diskonOtomatisAktif && durasi >= 3) {
           const biayaDuaMalamPertama = hitungSubtotalPerMalam() * 2;
           const sisaMalam = durasi - 2;
           const biayaDiskon = (hitungSubtotalPerMalam() * 0.5) * sisaMalam;
           subtotal = biayaDuaMalamPertama + biayaDiskon;
        }
        let totalAkhir = subtotal;
        if (jenisDiskonManual === 'nominal') {
            totalAkhir = Math.max(0, subtotal - diskonManual);
        } else if (jenisDiskonManual === 'persentase') {
            const nilaiDiskon = (diskonManual / 100) * subtotal;
            totalAkhir = Math.max(0, subtotal - nilaiDiskon);
        }
        return totalAkhir;
    };
    
    // --- Hooks (Tidak ada perubahan fungsional) ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) router.push('/login');
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setSession(session);
            if (!session) router.push('/login');
        });
        return () => subscription?.unsubscribe();
    }, [router]);

    useEffect(() => {
        async function fetchProduk() {
            const { data, error } = await supabase.from('produk').select('*');
            if (error) console.error('Error fetching produk:', error);
            else {
                setProduk(data);
                const urutanKategori = ['Semua', 'Tenda', 'Shelter', 'Sleeping System', 'Cookware', 'Tas', 'Sepatu', 'Hardware', 'Lighting & Electrical', 'Accecoris & Support', 'Lain-lain'];
                const uniqueKategori = [...new Set(data.map(p => p.kategori))];
                const kategoriTerurut = urutanKategori.filter(kategori => uniqueKategori.includes(kategori));
                const kategoriLainnya = uniqueKategori.filter(kategori => !urutanKategori.includes(kategori));
                setSemuaKategori(['Semua', ...kategoriTerurut.concat(kategoriLainnya)]);
            }
        }
        fetchProduk();
    }, []);

    useEffect(() => {
        const durasi = hitungDurasiHari();
        if (diskonOtomatisAktif && durasi >= 3) {
            const subtotalPerMalam = hitungSubtotalPerMalam();
            const sisaMalam = durasi - 2;
            const nilaiDiskon = (subtotalPerMalam * 0.5) * sisaMalam;
            setDiskon(nilaiDiskon);
        } else {
            setDiskon(0);
        }
    }, [keranjang, tanggalMulai, tanggalSelesai, diskonOtomatisAktif]);
    
    if (!session) {
        return <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0D1117] to-[#161B22] text-white">Loading...</div>;
    }
    
    // --- Handlers (Tidak ada perubahan fungsional) ---
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const tambahKeKeranjang = (item) => {
        if (item.stok <= 0) return;
        const itemSudahAda = keranjang.find((i) => i.id === item.id);
        if (itemSudahAda) {
            setKeranjang(keranjang.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setKeranjang([...keranjang, { ...item, qty: 1 }]);
        }
        setJustAddedProductId(item.id);
        setTimeout(() => setJustAddedProductId(null), 1000);
    };

    const kurangDariKeranjang = (itemId) => {
        const item = keranjang.find((i) => i.id === itemId);
        if (item.qty === 1) {
            hapusItem(itemId);
        } else {
            setKeranjang(keranjang.map((i) => i.id === itemId ? { ...i, qty: i.qty - 1 } : i));
        }
    };

    const hapusItem = (itemId) => {
        setKeranjang(keranjang.filter((i) => i.id !== itemId));
    };

    const handleProses = () => {
        if (keranjang.length === 0) return toast.error('Keranjang sewa masih kosong!');
        if (!tanggalMulai || !tanggalSelesai) return toast.error('Mohon isi tanggal sewa terlebih dahulu!');
        setShowPaymentPopup(true);
    };
    
    const handleSimpanPembayaran = async () => {
        if (!namaPelanggan || !alamatPelanggan || !noWhatsapp || !jaminan) {
            return toast.error('Mohon lengkapi semua data pelanggan!');
        }
        const toastId = toast.loading('Menyimpan transaksi...');
        try {
            const { data: existingPelanggan } = await supabase.from('pelanggan').select('id').eq('no_whatsapp', noWhatsapp).single();
            let pelangganId = existingPelanggan?.id;
            if (!pelangganId) {
                const { data: newPelangganData, error: insertError } = await supabase.from('pelanggan').insert({ nama: namaPelanggan, alamat: alamatPelanggan, no_whatsapp: noWhatsapp, jaminan: jaminan }).select().single();
                if (insertError) throw insertError;
                pelangganId = newPelangganData.id;
            }
            let nilaiDiskonManual = jenisDiskonManual === 'nominal' ? diskonManual : ((diskonManual / 100) * ((hitungSubtotalPerMalam() * hitungDurasiHari()) - diskon));
            const { data: transaksiData, error: transaksiError } = await supabase.from('transaksi').insert({ pelanggan_id: pelangganId, tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, durasi_hari: hitungDurasiHari(), total_biaya: hitungTotalAkhir(), jenis_pembayaran: metodePembayaran, catatan: catatan, diskon_manual: nilaiDiskonManual }).select().single();
            if (transaksiError) throw transaksiError;
            const transaksiId = transaksiData.id;
            const itemsToInsert = keranjang.map(item => ({ transaksi_id: transaksiId, produk_id: item.id, nama_barang: item.nama, jumlah: item.qty }));
            const { error: detailError } = await supabase.from('transaksi_detail').insert(itemsToInsert);
            if (detailError) throw detailError;
            await Promise.all(keranjang.map(item => supabase.from('produk').update({ stok: item.stok - item.qty }).eq('id', item.id)));
            toast.success('Data sewa berhasil disimpan!', { id: toastId });
            setShowPaymentPopup(false);
            setShowStrukPopup(true);
        } catch (error) {
            console.error('Error proses pembayaran:', error);
            toast.error(`Gagal menyimpan: ${error.message}`, { id: toastId });
        }
    };
    
    const handleCetak = () => {
        const transaksiDataUntukStruk = {
            pelanggan: { nama: namaPelanggan, alamat: alamatPelanggan, noWhatsapp: noWhatsapp, jaminan: jaminan },
            keranjang: keranjang,
            tanggalMulai: tanggalMulai,
            tanggalSelesai: tanggalSelesai,
            durasi: hitungDurasiHari(),
            subtotal: hitungSubtotalPerMalam() * hitungDurasiHari(),
            diskonOtomatis: diskon,
            diskonManual: jenisDiskonManual === 'persentase' ? (diskonManual/100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon) : diskonManual,
            total: hitungTotalAkhir(),
            metodePembayaran: metodePembayaran,
            catatan: catatan,
        };
        localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(transaksiDataUntukStruk));
        window.open('/cetak-struk', '_blank');
        setKeranjang([]);
        setShowStrukPopup(false);
        setNamaPelanggan(''); setAlamatPelanggan(''); setNoWhatsapp(''); setJaminan('');
        setTanggalMulai(''); setTanggalSelesai(''); setMetodePembayaran('Cash'); setCatatan('');
        setDiskonManual(0); setJenisDiskonManual('nominal'); setIsCartOpen(false);
    };

    const produkTerfilter = produk.filter(item => 
        (kategoriTerpilih === 'Semua' || item.kategori === kategoriTerpilih) && 
        item.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openProductPopup = (product) => setSelectedProduct(product);
    const closeProductPopup = () => setSelectedProduct(null);

    // --- [PROJECT AURORA] JSX / Tampilan Baru ---
    return (
        <div className="flex h-screen font-sans text-slate-200 bg-gradient-to-br from-[#0D1117] to-[#161B22] overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{
                style: { background: '#1A202C', color: '#E2E8F0', border: '1px solid #334155', backdropFilter: 'blur(10px)' },
            }} />
            <Head>
                <title>Nuevanesia POS - Aurora</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
            </Head>

            {/* --- Sidebar --- */}
            <nav className="flex flex-col w-72 bg-slate-900/50 border-r border-slate-800 p-6 transition-all duration-300">
                <div className="flex items-center justify-center mb-12 flex-col">
                    <img src="/images/logo-nuevanesia.png" alt="Nuevanesia Logo" className="h-20" />
                    <p className="text-sm font-light text-cyan-400 mt-2">Produce by GodByte</p>
                </div>
                <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                    <h2 className="text-sm font-semibold mb-2 text-slate-500 uppercase tracking-widest px-3">Kategori</h2>
                    {semuaKategori.map((kategori) => (
                        <div
                            key={kategori}
                            onClick={() => setKategoriTerpilih(kategori)}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                                kategoriTerpilih === kategori ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {kategoriTerpilih === kategori && <div className="absolute left-0 top-0 h-full w-1 bg-cyan-400 rounded-r-full"></div>}
                            <span className="ml-3 font-medium">{kategori}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-3 mt-8">
                    <button onClick={() => window.open('/manajemen-produk', '_blank')} className="flex items-center justify-center gap-3 bg-slate-700/50 text-slate-300 p-3 rounded-lg hover:bg-yellow-500/20 hover:text-white transition-colors duration-200 w-full font-semibold"><IconTool /> Manajemen Produk</button>
                    <button onClick={() => window.open('/laporan', '_blank')} className="flex items-center justify-center gap-3 bg-slate-700/50 text-slate-300 p-3 rounded-lg hover:bg-blue-500/20 hover:text-white transition-colors duration-200 w-full font-semibold"><IconChartBar /> Lihat Laporan</button>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-3 bg-slate-700/50 text-slate-300 p-3 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 w-full font-semibold"><IconLogout /> Logout</button>
                </div>
            </nav>

            {/* --- Main Content --- */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                     <div className="flex-1 max-w-xl relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama produk..."
                            className="w-full p-4 pl-12 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        />
                        <IconSearch />
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="relative bg-slate-800 hover:bg-slate-700 transition-colors text-slate-200 font-semibold py-3 px-5 rounded-xl flex items-center gap-3">
                        <IconShoppingCart />
                        <span>Keranjang</span>
                        {keranjang.length > 0 && <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">{keranjang.reduce((acc, item) => acc + item.qty, 0)}</span>}
                    </button>
                </header>
                
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {produkTerfilter.length > 0 ? (
                        produkTerfilter.map(item => {
                            const isInCart = keranjang.some(cartItem => cartItem.id === item.id);
                            return (
                                <div key={item.id} className={`bg-slate-800/50 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden group transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:scale-[1.02] cursor-pointer ${justAddedProductId === item.id ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400' : ''}`}>
                                    <div className="relative">
                                        <img src={item.url_gambar || '/images/placeholder.png'} alt={item.nama} className="w-full h-40 object-cover" />
                                        <div onClick={() => openProductPopup(item)} className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold">Lihat Detail</div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg text-white mb-1 truncate">{item.nama}</h3>
                                        <p className="font-mono text-slate-400">Rp{item.harga.toLocaleString('id-ID')} / Hari</p>
                                        <p className={`text-xs mt-1 font-semibold ${item.stok > 10 ? 'text-green-400' : item.stok > 0 ? 'text-yellow-400' : 'text-red-500'}`}>Stok: {item.stok}</p>
                                        <button onClick={(e) => { e.stopPropagation(); tambahKeKeranjang(item); }} disabled={item.stok === 0}
                                            className={`font-semibold p-2.5 mt-4 rounded-lg w-full transition-all duration-200 flex items-center justify-center text-sm disabled:cursor-not-allowed ${
                                                isInCart ? 'bg-green-600/20 text-green-300' : 'bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500'
                                            }`}>
                                            {isInCart ? 'Ditambahkan ✔' : <><IconPlus /><span>Tambah</span></>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : <p className="text-slate-500 col-span-full text-center py-16">Tidak ada produk yang cocok.</p>}
                </div>
            </main>

            {/* --- Cart Slide-Out Panel --- */}
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} >
                <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center p-6 border-b border-slate-800">
                        <h2 className="text-2xl font-bold text-white">Keranjang Sewa</h2>
                        <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-colors"><IconClose /></button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-grow">
                        <div className="bg-slate-800/50 p-4 rounded-xl mb-4 border border-slate-700">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Tanggal Ambil</label>
                            <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <label className="block text-sm font-medium text-slate-400 mt-4 mb-2">Tanggal Kembali</label>
                            <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <p className="text-sm mt-4 text-slate-400">Durasi: <span className="font-semibold text-white">{hitungDurasiHari()} Malam</span></p>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 min-h-[200px] flex flex-col">
                           <div className="p-4 flex-grow overflow-y-auto">
                                {keranjang.length === 0 ? (
                                    <div className="h-full flex items-center justify-center"><p className="text-slate-500 text-center text-sm">Keranjang Anda kosong.</p></div>
                                ) : (
                                    keranjang.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-700 last:border-b-0">
                                            <div>
                                                <p className="font-medium text-white text-sm">{item.nama}</p>
                                                <p className="text-xs text-slate-400 font-mono">Rp{item.harga.toLocaleString('id-ID')} x {item.qty}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => kurangDariKeranjang(item.id)} className="bg-slate-700 text-white w-7 h-7 rounded-md text-lg hover:bg-slate-600 transition-colors flex items-center justify-center">-</button>
                                                <span className="font-bold text-slate-200 text-sm w-4 text-center">{item.qty}</span>
                                                <button onClick={() => tambahKeKeranjang(item)} className="bg-slate-700 text-white w-7 h-7 rounded-md text-lg hover:bg-slate-600 transition-colors flex items-center justify-center">+</button>
                                                <button onClick={() => hapusItem(item.id)} className="text-slate-500 hover:text-red-500 ml-2 transition-colors"><IconTrash /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center"><span className="text-slate-400">Subtotal:</span><span className="font-semibold font-mono text-slate-200">Rp{(hitungSubtotalPerMalam()).toLocaleString('id-ID')}</span></div>
                            {hitungDurasiHari() >= 3 && (<div className="flex justify-between items-center"><span className="text-yellow-400">Diskon Otomatis:</span><span className="font-semibold font-mono text-yellow-400">-Rp{diskon.toLocaleString('id-ID')}</span></div>)}
                            {diskonManual > 0 && (<div className="flex justify-between items-center"><span className="text-violet-400">Diskon Manual:</span><span className="font-semibold font-mono text-violet-400">-Rp{jenisDiskonManual === 'persentase' ? ((diskonManual / 100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon)).toLocaleString('id-ID') : diskonManual.toLocaleString('id-ID')}</span></div>)}
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-700 pt-4 mt-4">
                            <p className="text-xl font-bold text-white">Total:</p>
                            <p className="text-2xl font-bold text-cyan-400 font-mono">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</p>
                        </div>
                        <button onClick={handleProses} className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white p-4 w-full mt-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity duration-200">PROSES TRANSAKSI</button>
                    </div>
                </div>
            </div>

            {/* --- Popups (Payment & Struk) --- */}
            {(showPaymentPopup || showStrukPopup) && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="p-8 bg-slate-800/90 backdrop-blur-lg rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                        {showPaymentPopup && (
                           // Konten popup pembayaran (logika sama, styling disesuaikan)
                           <>
                           <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Data & Pembayaran</h2>
                           {/* Diskon Manual & Otomatis */}
                           <div className="bg-slate-700/50 p-6 rounded-lg mb-6 shadow-inner">
                               <button onClick={() => setDiskonOtomatisAktif(!diskonOtomatisAktif)} className={`w-full p-3 rounded-lg font-semibold transition-all mb-4 ${diskonOtomatisAktif ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}`}>
                                   {diskonOtomatisAktif ? "Nonaktifkan Diskon Otomatis" : "Aktifkan Diskon Otomatis"}
                               </button>
                               <h3 className="text-xl font-semibold text-slate-200 mb-4">Diskon Manual</h3>
                               <div className="flex items-center space-x-4 mb-4">
                                   <div className="flex items-center"><input type="radio" id="nominal" value="nominal" checked={jenisDiskonManual === 'nominal'} onChange={() => setJenisDiskonManual('nominal')} className="form-radio text-cyan-500 h-4 w-4 bg-slate-600 border-slate-500"/> <label htmlFor="nominal" className="ml-2 text-slate-300">Nominal</label></div>
                                   <div className="flex items-center"><input type="radio" id="persentase" value="persentase" checked={jenisDiskonManual === 'persentase'} onChange={() => setJenisDiskonManual('persentase')} className="form-radio text-cyan-500 h-4 w-4 bg-slate-600 border-slate-500"/> <label htmlFor="persentase" className="ml-2 text-slate-300">Persentase</label></div>
                               </div>
                               <div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">{jenisDiskonManual === 'nominal' ? 'Rp' : '%'}</span><input type="number" value={diskonManual === 0 ? '' : diskonManual} onChange={(e) => setDiskonManual(Number(e.target.value))} placeholder="0" className="w-full p-2 pl-9 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"/></div>
                           </div>
                           {/* Data Pelanggan */}
                           <div className="bg-slate-700/50 p-6 rounded-lg mb-6 shadow-inner">
                                <h3 className="text-xl font-semibold text-slate-200 mb-4">Detail Pelanggan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Nama Pelanggan" />
                                    <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Alamat" />
                                    <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="No. WhatsApp (+62)" />
                                    <input type="text" value={jaminan} onChange={(e) => setJaminan(e.target.value)} className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Jaminan (KTP/SIM)" />
                                </div>
                                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full mt-4 p-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" rows="2" placeholder="Catatan..."></textarea>
                           </div>
                           {/* Ringkasan & Pembayaran */}
                           <div className="bg-slate-700/50 p-6 rounded-lg mb-6 shadow-inner">
                                <h3 className="text-xl font-semibold text-slate-200 mb-4">Total Biaya</h3>
                                <div className="border-t border-slate-600 pt-4 flex justify-between items-center mt-4">
                                    <span className="text-2xl font-bold text-cyan-400">Grand Total:</span>
                                    <span className="text-3xl font-bold font-mono text-cyan-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</span>
                                </div>
                           </div>
                           <div className="grid grid-cols-3 gap-4 mb-6">
                               <button onClick={() => setMetodePembayaran('Cash')} className={`p-4 rounded-lg font-bold transition-all ${metodePembayaran === 'Cash' ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>CASH</button>
                               <button onClick={() => setMetodePembayaran('Transfer')} className={`p-4 rounded-lg font-bold transition-all ${metodePembayaran === 'Transfer' ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>TRANSFER</button>
                               <button onClick={() => setMetodePembayaran('QRIS')} className={`p-4 rounded-lg font-bold transition-all ${metodePembayaran === 'QRIS' ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>QRIS</button>
                           </div>
                           <div className="flex space-x-4">
                               <button onClick={handleSimpanPembayaran} className="bg-blue-600 text-white p-4 rounded-lg w-full font-bold text-lg hover:bg-blue-700 transition-colors">SIMPAN TRANSAKSI</button>
                               <button onClick={() => setShowPaymentPopup(false)} className="bg-slate-600 text-slate-300 p-4 rounded-lg w-1/4 font-bold text-lg hover:bg-slate-500 transition-colors">BATAL</button>
                           </div>
                           </>
                        )}
                        {showStrukPopup && (
                            // Konten popup struk (logika sama, styling disesuaikan)
                            <>
                            <h2 className="text-3xl font-bold text-teal-400 mb-6 text-center">Transaksi Berhasil</h2>
                            <div className="bg-slate-700/50 p-6 rounded-lg w-full mb-4 shadow-inner text-sm">
                                <p className="text-slate-300 mb-1">Nama: <span className="font-semibold text-white">{namaPelanggan}</span></p>
                                <p className="text-slate-300 mb-1">Tanggal Sewa: <span className="font-semibold text-white">{tanggalMulai} s/d {tanggalSelesai}</span></p>
                                <p className="text-slate-300 mb-1">Metode Bayar: <span className="font-semibold text-white">{metodePembayaran}</span></p>
                            </div>
                            <div className="bg-slate-700/50 p-6 rounded-lg w-full shadow-inner">
                               <div className="flex justify-between font-bold text-3xl">
                                   <span className="text-teal-400">Total Biaya:</span>
                                   <span className="text-teal-400 font-mono">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</span>
                               </div>
                            </div>
                            <button onClick={handleCetak} className="bg-green-600 text-white p-4 rounded-lg w-full mt-6 font-bold text-lg hover:bg-green-700 transition-colors">CETAK STRUK & SELESAI</button>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <ProductPopup product={selectedProduct} onClose={closeProductPopup} />
        </div>
    );
}