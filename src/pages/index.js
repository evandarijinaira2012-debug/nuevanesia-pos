import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

// --- Komponen Ikon ---
const IconChartBar = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
const IconLogout = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;
const IconSearch = () => <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const IconPlus = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;
const IconTrash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m3 0h6"></path></svg>;
const IconTool = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
const IconBell = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>;

// --- Ikon Kategori ---
const IconTent = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 14l4 6h6l-9 -16l-9 16h6l4 -6" /></svg>;
const IconShelter = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.141 4.163l12 1.714a1 1 0 0 1 .859 .99v10.266a1 1 0 0 1 -.859 .99l-12 1.714a1 1 0 0 1 -1.141 -.99v-13.694a1 1 0 0 1 1.141 -.99z" /></svg>;
const IconSleeping = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M22 17v-3h-20" /><path d="M2 8v9" /><path d="M12 14h10v-2a3 3 0 0 0 -3 -3h-7v5z" /></svg>;
const IconCookware = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z" /><path d="M12 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /><path d="M16 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /><path d="M8 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /></svg>;
const IconBag = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 18v-6a6 6 0 0 1 6 -6h2a6 6 0 0 1 6 6v6a3 3 0 0 1 -3 3h-8a3 3 0 0 1 -3 -3z" /><path d="M10 6v-1a2 2 0 1 1 4 0v1" /><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" /><path d="M11 10h2" /></svg>;
const IconApparel = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 6a2 2 0 1 0 -4 0c0 1.667 .67 3 2 4h-.008l7.971 4.428a2 2 0 0 1 1.029 1.749v.823a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-.823a2 2 0 0 1 1.029 -1.749l7.971 -4.428" /></svg>;
const IconShoes = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6h5.426a1 1 0 0 1 .863 .496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89v2.27a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1z" /><path d="M14 13l1 -2" /><path d="M8 18v-1a4 4 0 0 0 -4 -4h-1" /><path d="M10 12l1.5 -3" /></svg>;
const IconHardware = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 10v-4a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v4" /><path d="M16 15v-2a3 3 0 1 1 3 3v3h-14v-3a3 3 0 1 1 3 -3v2" /><path d="M8 12h8" /><path d="M7 19v2" /><path d="M17 19v2" /></svg>;
const IconLighting = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 21h9" /><path d="M10 21l-7 -8l8.5 -5.5" /><path d="M13 14c-2.148 -2.148 -2.148 -5.852 0 -8c2.088 -2.088 5.842 -1.972 8 0l-8 8z" /><path d="M11.742 7.574l-1.156 -1.156a2 2 0 0 1 2.828 -2.829l1.144 1.144" /><path d="M15.5 12l.208 .274a2.527 2.527 0 0 0 3.556 0c.939 -.933 .98 -2.42 .122 -3.4l-.366 -.369" /></svg>;
const IconAccessory = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 16.5l2 -3l2 3m-2 -3v-2l3 -1m-6 0l3 1" /><circle cx="12" cy="7.5" r=".5" fill="currentColor" /></svg>;
const IconPaket = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 21h-2a3 3 0 0 1 -3 -3v-1h5.5" /><path d="M17 8.5v-3.5a2 2 0 1 1 2 2h-2" /><path d="M19 3h-11a3 3 0 0 0 -3 3v11" /><path d="M9 7h4" /><path d="M9 11h4" /><path d="M18.42 12.61a2.1 2.1 0 0 1 2.97 2.97l-6.39 6.42h-3v-3l6.42 -6.39" /></svg>;
const IconOther = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 6h18" /><path d="M4 6v13" /><path d="M20 19v-13" /><path d="M4 10h16" /><path d="M15 6v8a2 2 0 0 0 2 2h3" /></svg>;
const IconAll = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 21l16 -4" /><path d="M20 21l-16 -4" /><path d="M12 15a4 4 0 0 0 4 -4c0 -3 -2 -3 -2 -8c-4 2 -6 5 -6 8a4 4 0 0 0 4 4z" /></svg>;

const CATEGORY_ICONS = {
    'Semua': <IconAll />,
    'Tenda': <IconTent />,
    'Shelter': <IconShelter />,
    'Sleeping System': <IconSleeping />,
    'Cookware': <IconCookware />,
    'Tas': <IconBag />,
    'Apparel': <IconApparel />,
    'Sepatu': <IconShoes />,
    'Hardware': <IconHardware />,
    'Lighting & Electrical': <IconLighting />,
    'Accecoris & Support': <IconAccessory />,
    'Paket': <IconPaket />,
    'Lain-lain': <IconOther />,
};

import TombolNotifOrderWeb from '../components/TombolNotifOrderWeb';
import ProductPopup from '../components/ProductPopup';

export default function Home() {
    const [produk, setProduk] = useState([]);
    const [keranjang, setKeranjang] = useState([]);
    const [jenisLayananTerpilih, setJenisLayananTerpilih] = useState('Sewa');
    const [kategoriTerpilih, setKategoriTerpilih] = useState('Semua');
    const [semuaKategori, setSemuaKategori] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [session, setSession] = useState(null);
    const router = useRouter();
    const [justAddedProductId, setJustAddedProductId] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const hitungSubtotal = () => {
        return keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    };

    useEffect(() => {
        const ADMIN_EMAILS = [
            'evandarijinaira2012@gmail.com',
            'xzibit@nuevanesia.com',
            'nuevanesia@gmail.com'
        ];

        // 2. FUNGSI SATPAM PENGECEK EMAIL
        const verifikasiAdmin = async (sesiAwal) => {
            if (!sesiAwal) {
                router.push('/login');
                return;
            }

            // Jika email yang login TIDAK ADA di daftar admin
            if (!ADMIN_EMAILS.includes(sesiAwal.user.email)) {
                toast.error("Akses Ditolak! Anda bukan Admin.");
                await supabase.auth.signOut(); // Tendang keluar (Logout paksa)
                router.push('/login');         // Kembalikan ke halaman login POS
            } else {
                setSession(sesiAwal);          // Jika valid, izinkan masuk
            }
        };

        // Eksekusi fungsi satpam saat pertama kali halaman dimuat
        supabase.auth.getSession().then(({ data: { session } }) => {
            verifikasiAdmin(session);
        });

        // Eksekusi fungsi satpam jika ada perubahan status login
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                verifikasiAdmin(session);
            }
        );

        return () => subscription?.unsubscribe();
    }, [router]);

    useEffect(() => {
        async function fetchProduk() {
            // PERUBAHAN: Memanggil produk beserta relasi produk_variasi
            const { data, error } = await supabase.from('produk').select('*, produk_variasi(*)');
            if (error) {
                console.error('Error fetching produk:', error);
            } else {
                setProduk(data);
                const urutanKategori = ['Semua', 'Tenda', 'Shelter', 'Sleeping System', 'Cookware', 'Tas', 'Apparel', 'Sepatu', 'Hardware', 'Lighting & Electrical', 'Accecoris & Support', 'Paket', 'Lain-lain'];
                const uniqueKategori = [...new Set(data.map(p => p.kategori))];

                const kategoriTerurut = urutanKategori.filter(kategori => uniqueKategori.includes(kategori));
                const kategoriLainnya = uniqueKategori.filter(kategori => !urutanKategori.includes(kategori));

                setSemuaKategori(['Semua', ...kategoriTerurut.concat(kategoriLainnya)]);
            }
        }
        fetchProduk();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nuevanesia-checkout-data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.keranjang)) {
                        setKeranjang(parsed.keranjang);
                        if (parsed.keranjang.length > 0) {
                            const layananKeranjang = parsed.keranjang[0].jenis_layanan || 'Sewa';
                            setJenisLayananTerpilih(layananKeranjang);
                        }
                    }
                } catch (err) {
                    console.error('Gagal parse nuevanesia-checkout-data', err);
                }
            }
        }
    }, []);

// FUNGSI 1: Untuk menambah produk ke keranjang dari daftar produk
    const tambahKeKeranjang = (item, variasi = null) => {
        const itemLayanan = item.jenis_layanan || 'Sewa';
        
        if (keranjang.length > 0) {
            const layananDiKeranjang = keranjang[0].jenis_layanan || 'Sewa';
            if (itemLayanan !== layananDiKeranjang) {
                toast.error(`Keranjang saat ini berisi item ${layananDiKeranjang}. Selesaikan atau kosongkan keranjang terlebih dahulu!`);
                return;
            }
        }
        
        // Membuat Unique ID untuk keranjang agar variasi yang berbeda tidak menumpuk
        const cartItemId = variasi ? `${item.id}-${variasi.id}` : item.id;
        
        // Override nama dan harga jika ada variasi atau diskon produk
        const namaTampil = variasi ? `${item.nama} - ${variasi.nama_variasi}` : item.nama;
        
        let hargaTampil = item.harga;
        if (variasi) {
            hargaTampil = variasi.harga;
        } else if (item.harga_diskon && item.harga_diskon > 0 && item.harga_diskon < item.harga) {
            hargaTampil = item.harga_diskon;
        }

        const itemToSave = { 
            ...item, 
            cartItemId: cartItemId, 
            nama: item.nama, // <--- UBAH INI: Kembali gunakan nama asli agar tidak dobel di struk
            harga: hargaTampil,
            jenis_layanan: itemLayanan,
            produk_variasi_id: variasi ? variasi.id : null,
            variasi_terpilih: variasi ? variasi.nama_variasi : null // <--- TAMBAHAN INI
        };

        const itemSudahAda = keranjang.find((i) => i.cartItemId === cartItemId);
        let newKeranjang;

        if (itemSudahAda) {
            newKeranjang = keranjang.map((i) =>
                i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i
            );
        } else {
            newKeranjang = [...keranjang, { ...itemToSave, qty: 1 }];
        }
        
        setKeranjang(newKeranjang);
        updateLocalStorage(newKeranjang);
        toast.success(`${namaTampil} berhasil ditambahkan.`);

        setJustAddedProductId(item.id);
        setTimeout(() => setJustAddedProductId(null), 1000);
    };

    // FUNGSI 2: Khusus untuk tombol (+) di sidebar keranjang
    const tambahQty = (cartItemId) => {
        const newKeranjang = keranjang.map((i) =>
            i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i
        );
        setKeranjang(newKeranjang);
        updateLocalStorage(newKeranjang);
    };

    // FUNGSI 3: Khusus untuk tombol (-) di sidebar keranjang
    const kurangDariKeranjang = (cartItemId) => {
        const item = keranjang.find((i) => i.cartItemId === cartItemId);
        if (item.qty === 1) {
            hapusItem(cartItemId);
        } else {
            const newKeranjang = keranjang.map((i) =>
                i.cartItemId === cartItemId ? { ...i, qty: i.qty - 1 } : i
            );
            setKeranjang(newKeranjang);
            updateLocalStorage(newKeranjang);
        }
    };

    // FUNGSI 4: Khusus untuk menghapus item
    const hapusItem = (cartItemId) => {
        const newKeranjang = keranjang.filter((i) => i.cartItemId !== cartItemId);
        setKeranjang(newKeranjang);
        updateLocalStorage(newKeranjang);
    };

    const updateLocalStorage = (newKeranjang) => {
        if (typeof window !== 'undefined') {
            try {
                const savedRaw = localStorage.getItem('nuevanesia-checkout-data');
                const saved = savedRaw ? JSON.parse(savedRaw) : {};
                saved.keranjang = newKeranjang;
                if (newKeranjang.length === 0) saved.jenisTransaksi = null;
                localStorage.setItem('nuevanesia-checkout-data', JSON.stringify(saved));
            } catch (err) {
                console.error('Gagal update localStorage', err);
            }
        }
    };

    const handleProses = () => {
        if (keranjang.length === 0) {
            toast.error('Keranjang masih kosong!');
            return;
        }
        router.push('/checkout');
    };

    const produkTerfilter = produk.filter(item => {
        const jenisLayananProduk = item.jenis_layanan || 'Sewa'; 
        if (jenisLayananProduk !== jenisLayananTerpilih) return false;
        if (searchQuery.trim() !== '') {
            return item.nama.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return kategoriTerpilih === 'Semua' || item.kategori === kategoriTerpilih;
    });

    const openProductPopup = (product) => setSelectedProduct(product);
    const closeProductPopup = () => setSelectedProduct(null);
    
    if (!session) return null;

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-900 text-gray-200 font-sans">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#24252A', color: '#e2e8f0', border: '1px solid #2C2E33' } }} />
            <Head>
                <title>Nuevanesia POS</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            
            {/* SIDEBAR KIRI */}
            <div className="w-full lg:w-120 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
                <div className="flex items-center justify-center mb-8 flex-col">
                    <img src="/images/logo-nuevanesia.png" alt="Nuevanesia Logo" className="h-20 mr-3" />
                    <p className="text-sm font-light text-blue-400 mt-2">Produce by GodByte</p>
                </div>

                <div className="mb-6">
                    <h2 className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-widest">Jenis Transaksi</h2>
                    <div className="flex flex-col space-y-2">
                        {['Sewa', 'Penjualan', 'Laundry'].map(layanan => (
                            <button
                                key={layanan}
                                onClick={() => {
                                    setJenisLayananTerpilih(layanan);
                                    setKategoriTerpilih('Semua');
                                }}
                                className={`p-3 rounded-lg text-left font-semibold transition-all duration-200 flex items-center ${
                                    jenisLayananTerpilih === layanan
                                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                }`}
                            >
                                <span className="mr-3 text-lg">
                                    {layanan === 'Sewa' ? '🏕️' : layanan === 'Penjualan' ? '🛒' : '🧼'}
                                </span>
                                {layanan}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="w-full h-px bg-gray-800 mb-6"></div>

                <div className="flex-grow lg:h-[40vh] overflow-y-auto scrollbar-hide">
                    <h2 className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-widest">Kategori ({jenisLayananTerpilih})</h2>
                    <div className="space-y-1">
                        {semuaKategori.map(kategori => (
                            <div
                                key={kategori}
                                onClick={() => setKategoriTerpilih(kategori)}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 
                                    ${kategoriTerpilih === kategori 
                                    ? 'bg-teal-500/10 text-teal-300' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                {kategoriTerpilih === kategori && <div className="absolute left-0 top-0 h-full w-1 bg-teal-400 rounded-r-full"></div>}
                                <span className="mr-2">{CATEGORY_ICONS[kategori] || <IconOther />}</span>
                                <span className="font-medium text-sm">{kategori}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-3 mt-8">
                    <TombolNotifOrderWeb session={session} />
                    <button onClick={() => window.open('/manajemen-produk', '_blank')} className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-yellow-500/30 hover:text-white transition-colors duration-200 w-full font-semibold text-sm">
                        <IconTool /> Manajemen Produk
                    </button>
                    <button onClick={() => window.open('/laporan', '_blank')} className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-blue-500/20 hover:text-white transition-colors duration-200 w-full font-semibold text-sm">
                        <IconChartBar /> Lihat Laporan
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 w-full font-semibold text-sm">
                        <IconLogout /> Logout
                    </button>
                </div>
            </div>

            {/* AREA TENGAH: DAFTAR PRODUK */}
            <div className="w-[110rem] p-8 bg-gray-900 overflow-y-auto scrollbar-hide">
                <h1 className="text-3xl font-bold mb-8 text-white text-center uppercase">
                    LAYANAN {jenisLayananTerpilih}
                </h1>
                
                <div className="mb-8 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Cari nama produk ${jenisLayananTerpilih.toLowerCase()}...`}
                        className="w-full p-4 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                    <IconSearch />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {produkTerfilter.length > 0 ? (
                        produkTerfilter.map(item => {
                            const hasVariasi = item.produk_variasi && item.produk_variasi.length > 0;
                            // Jika ada variasi, ketersediaan stok akan dinilai dari variasi yang dipilih di dalam popup
                            const isOutOfStock = !hasVariasi && item.stok <= 0 && jenisLayananTerpilih !== 'Laundry';
                            
                            // Cek jika setidaknya ada versi produk ini di dalam keranjang
                            const isInCart = keranjang.some(cartItem => cartItem.id === item.id);

                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => openProductPopup(item)}
                                    className={`bg-gray-800/50 border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden group transition-all duration-300 hover:border-teal-500/50 hover:shadow-teal-500/10 hover:scale-[1.02] cursor-pointer ${
                                        justAddedProductId === item.id ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-teal-400' : ''
                                    }`}
                                >
                                <div className="w-full h-44 bg-white flex items-center justify-center">
                                        <img src={item.url_gambar || '/images/placeholder.png'} alt={item.nama} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">{item.kategori}</p>
                                        <h3 className="font-bold text-lg text-white mb-1 leading-tight">{item.nama}</h3>
                                        <p className="text-sm font-semibold mb-2">
                                            {hasVariasi ? 'Mulai dari ' : ''}
                                            {item.harga_diskon && item.harga_diskon < item.harga ? (
                                                <>
                                                    <span className="line-through text-gray-500 text-xs mr-1">
                                                        Rp{item.harga.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-red-400 font-bold">
                                                        Rp{item.harga_diskon.toLocaleString('id-ID')}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-teal-400">
                                                    Rp{item.harga.toLocaleString('id-ID')}
                                                </span>
                                            )}
                                            {jenisLayananTerpilih === 'Sewa' && <span className="text-gray-400 text-xs ml-1">/ Hari</span>}
                                        </p>
                                        
                                        {/* BUNGKUSAN BARU (mt-auto) AGAR ELEMEN SELALU RATA BAWAH */}
                                        <div className="mt-auto w-full pt-2">
                                            {!hasVariasi && jenisLayananTerpilih !== 'Laundry' && (
                                                <p className={`text-xs mb-3 font-semibold ${item.stok > 10 ? 'text-green-400' : item.stok > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                                                    Stok: {item.stok}
                                                </p>
                                            )}
                                            {hasVariasi && (
                                                <p className="text-xs mb-3 font-semibold text-blue-400">
                                                    Tersedia {item.produk_variasi.length} Variasi
                                                </p>
                                            )}
                                            
                                            {/* LOGIKA TOMBOL BARU */}
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (hasVariasi) {
                                                        openProductPopup(item); // Buka popup jika ada variasi
                                                    } else {
                                                        tambahKeKeranjang(item); // Langsung tambah jika tidak ada variasi
                                                    }
                                                }}
                                                disabled={isOutOfStock}
                                                className={`font-semibold p-2.5 rounded-lg w-full transition-all duration-200 flex items-center justify-center text-sm disabled:cursor-not-allowed ${
                                                    hasVariasi 
                                                    ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30 hover:bg-blue-600/40'
                                                    : isInCart 
                                                    ? 'bg-green-600/20 text-green-300 border border-green-600/30' 
                                                    : 'bg-teal-600 text-white hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500'
                                                }`}
                                            >
                                                {hasVariasi ? 'Pilih Variasi' : (isInCart ? 'Ditambahkan ✔' : <><IconPlus /> Tambah</>)}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                            <span className="text-6xl mb-4">🔍</span>
                            <p className="text-gray-400 text-lg">Tidak ada item {jenisLayananTerpilih} yang ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR KANAN: KERANJANG */}
            <div className="w-full lg:w-150 bg-gray-900 border-l border-gray-800 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Keranjang</h2>
                    {keranjang.length > 0 && (
                        <span className="bg-teal-600/20 text-teal-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-teal-500/30">
                            {keranjang[0].jenis_layanan || 'Sewa'}
                        </span>
                    )}
                </div>

                <div className="flex-grow bg-gray-800 rounded-xl mb-4 border border-gray-700 min-h-[200px] flex flex-col overflow-hidden">
                    <div className="p-4 flex-grow overflow-y-auto scrollbar-hide">
                        {keranjang.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <span className="text-4xl mb-3">🛒</span>
                                <p className="text-sm">Keranjang Anda kosong.</p>
                            </div>
                        ) : (
                            // PERUBAHAN: menggunakan cartItemId sebagai key
                            keranjang.map(item => (
                                <div key={item.cartItemId} className="flex justify-between items-center py-3 border-b border-gray-700/50 last:border-b-0">
                                    <div className="pr-2">
                                        <p className="font-medium text-white text-sm leading-tight mb-1">{item.nama}</p>
                                        <p className="text-xs text-teal-400 font-semibold">Rp{item.harga.toLocaleString('id-ID')} <span className="text-gray-500 font-normal">x {item.qty}</span></p>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-1 border border-gray-700">
                                        {/* PERUBAHAN: passing cartItemId untuk tombol kurang & hapus */}
                                        <button onClick={() => kurangDariKeranjang(item.cartItemId)} className="bg-gray-700 text-white w-7 h-7 rounded-md text-lg hover:bg-gray-600 flex items-center justify-center">-</button>
                                        <span className="font-bold text-gray-200 text-sm w-5 text-center">{item.qty}</span>
                                        <button onClick={() => tambahQty(item.cartItemId)} className="bg-gray-700 text-white w-7 h-7 rounded-md text-lg hover:bg-gray-600 flex items-center justify-center">+</button>
                                        <button onClick={() => hapusItem(item.cartItemId)} className="text-gray-500 hover:text-red-500 ml-1 p-1">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Subtotal Sementara:</span>
                            <span className="font-bold text-white text-lg">Rp{hitungSubtotal().toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-700 pt-4 mt-4">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Produk</p>
                        <p className="text-lg font-bold text-teal-400">{keranjang.reduce((sum, item) => sum + item.qty, 0)} Item</p>
                    </div>
                    <button 
                        onClick={handleProses} 
                        className="bg-gradient-to-r from-teal-500 to-green-500 text-white p-4 w-full mt-6 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] transition-all duration-200"
                    >
                        PROSES TRANSAKSI
                    </button>
                </div>
            </div>

            {/* PERUBAHAN: Memasukkan onAddToCart ke dalam prop popup */}
            <ProductPopup 
                product={selectedProduct} 
                onClose={closeProductPopup} 
                jenisLayananTerpilih={jenisLayananTerpilih}
                onAddToCart={(product, variasi) => {
                    tambahKeKeranjang(product, variasi);
                    closeProductPopup();
                }}
            />
        </div>
    );
}