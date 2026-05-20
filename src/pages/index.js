import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';
import toast, { Toaster } from 'react-hot-toast';

// --- Komponen Ikon (Tidak ada perubahan) ---
const IconChartBar = () => (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
);
const IconLogout = () => (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);
const IconSearch = () => (
    <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const IconPlus = () => (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);
const IconTrash = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m3 0h6"></path></svg>
);
const IconTool = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
);

// --- Penambahan Ikon untuk Kategori ---
const IconHome = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1h2a1 1 0 001-1m-6 0h6"></path></svg>;
const IconTent = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-tent"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 14l4 6h6l-9 -16l-9 16h6l4 -6" /></svg>;
const IconShelter = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-perspective"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.141 4.163l12 1.714a1 1 0 0 1 .859 .99v10.266a1 1 0 0 1 -.859 .99l-12 1.714a1 1 0 0 1 -1.141 -.99v-13.694a1 1 0 0 1 1.141 -.99z" /></svg>;
const IconSleeping = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-bed"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M22 17v-3h-20" /><path d="M2 8v9" /><path d="M12 14h10v-2a3 3 0 0 0 -3 -3h-7v5z" /></svg>;
const IconCookware = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-soup"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z" /><path d="M12 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /><path d="M16 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /><path d="M8 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2" /></svg>;
const IconBag = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-backpack"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 18v-6a6 6 0 0 1 6 -6h2a6 6 0 0 1 6 6v6a3 3 0 0 1 -3 3h-8a3 3 0 0 1 -3 -3z" /><path d="M10 6v-1a2 2 0 1 1 4 0v1" /><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" /><path d="M11 10h2" /></svg>;
const IconShoes = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-shoe"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6h5.426a1 1 0 0 1 .863 .496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89v2.27a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1z" /><path d="M14 13l1 -2" /><path d="M8 18v-1a4 4 0 0 0 -4 -4h-1" /><path d="M10 12l1.5 -3" /></svg>;
const IconHardware = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-armchair-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 10v-4a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v4" /><path d="M16 15v-2a3 3 0 1 1 3 3v3h-14v-3a3 3 0 1 1 3 -3v2" /><path d="M8 12h8" /><path d="M7 19v2" /><path d="M17 19v2" /></svg>;
const IconLighting = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-lamp-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 21h9" /><path d="M10 21l-7 -8l8.5 -5.5" /><path d="M13 14c-2.148 -2.148 -2.148 -5.852 0 -8c2.088 -2.088 5.842 -1.972 8 0l-8 8z" /><path d="M11.742 7.574l-1.156 -1.156a2 2 0 0 1 2.828 -2.829l1.144 1.144" /><path d="M15.5 12l.208 .274a2.527 2.527 0 0 0 3.556 0c.939 -.933 .98 -2.42 .122 -3.4l-.366 -.369" /></svg>;
const IconAccessory = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-accessible"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 16.5l2 -3l2 3m-2 -3v-2l3 -1m-6 0l3 1" /><circle cx="12" cy="7.5" r=".5" fill="currentColor" /></svg>;
const IconOther = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-desk"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 6h18" /><path d="M4 6v13" /><path d="M20 19v-13" /><path d="M4 10h16" /><path d="M15 6v8a2 2 0 0 0 2 2h3" /></svg>;
const IconAll = () => <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-campfire"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 21l16 -4" /><path d="M20 21l-16 -4" /><path d="M12 15a4 4 0 0 0 4 -4c0 -3 -2 -3 -2 -8c-4 2 -6 5 -6 8a4 4 0 0 0 4 4z" /></svg>;

const CATEGORY_ICONS = {
    'Semua': <IconAll />,
    'Tenda': <IconTent />,
    'Shelter': <IconShelter />,
    'Sleeping System': <IconSleeping />,
    'Cookware': <IconCookware />,
    'Tas': <IconBag />,
    'Sepatu': <IconShoes />,
    'Hardware': <IconHardware />,
    'Lighting & Electrical': <IconLighting />,
    'Accecoris & Support': <IconAccessory />,
    'Lain-lain': <IconOther />,
};

// --- IMPORT KOMPONEN POPUP BARU ---
import ProductPopup from '../components/ProductPopup';

export default function Home() {
    const [produk, setProduk] = useState([]);
    const [keranjang, setKeranjang] = useState([]);
    const [kategoriTerpilih, setKategoriTerpilih] = useState('Semua');
    const [semuaKategori, setSemuaKategori] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [session, setSession] = useState(null);
    const router = useRouter();
    const [justAddedProductId, setJustAddedProductId] = useState(null);
 
    // --- PENAMBAHAN KODE: State untuk produk yang dipilih ---
    const [selectedProduct, setSelectedProduct] = useState(null);

    const hitungSubtotalPerMalam = () => {
        return keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
        if (durasi === 0) return 0;
        
        let subtotal = hitungSubtotalPerMalam() * durasi;

        // Terapkan diskon otomatis (jika ada)
        if (diskonOtomatisAktif && durasi >= 3) {
           const biayaDuaMalamPertama = hitungSubtotalPerMalam() * 2;
           const sisaMalam = durasi - 2;
           const biayaDiskon = (hitungSubtotalPerMalam() * 0.5) * sisaMalam;
           subtotal = biayaDuaMalamPertama + biayaDiskon;
        }


        // >>> KODE BARU DIMULAI <<<
        // Terapkan diskon manual
        let totalAkhir = subtotal;
        if (jenisDiskonManual === 'nominal') {
            totalAkhir = Math.max(0, subtotal - diskonManual);
        } else if (jenisDiskonManual === 'persentase') {
            const nilaiDiskon = (diskonManual / 100) * subtotal;
            totalAkhir = Math.max(0, subtotal - nilaiDiskon);
        }
        return totalAkhir;
        // <<< KODE BARU SELESAI >>>
    };

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
                const urutanKategori = ['Semua', 'Tenda', 'Shelter', 'Sleeping System', 'Cookware', 'Tas', 'Sepatu', 'Hardware', 'Lighting & Electrical', 'Accecoris & Support', 'Lain-lain'];
                const uniqueKategori = [...new Set(data.map(p => p.kategori))];

                const kategoriTerurut = urutanKategori.filter(kategori => uniqueKategori.includes(kategori));
                const kategoriLainnya = uniqueKategori.filter(kategori => !urutanKategori.includes(kategori));

                setSemuaKategori(['Semua', ...kategoriTerurut.concat(kategoriLainnya)]);
            }
        }
        fetchProduk();
    }, []);

    // Muat keranjang sementara dari checkout jika ada (agar tidak hilang saat kembali dari checkout)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nuevanesia-checkout-data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.keranjang)) {
                        setKeranjang(parsed.keranjang);
                    }
                } catch (err) {
                    console.error('Gagal parse nuevanesia-checkout-data', err);
                }
            }
        }
    }, []);


    if (!session) {
        return null;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const tambahKeKeranjang = (item) => {
        // Hitung newKeranjang secara deterministik lalu set state + sinkron ke localStorage
        let newKeranjang;
        const itemSudahAda = keranjang.find((i) => i.id === item.id);
        if (itemSudahAda) {
            newKeranjang = keranjang.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + 1 } : i
            );
        } else {
            newKeranjang = [...keranjang, { ...item, qty: 1 }];
        }
        setKeranjang(newKeranjang);

        // Sinkron ke localStorage (merge dengan apa yang sudah ada di checkout)
        if (typeof window !== 'undefined') {
            try {
                const savedRaw = localStorage.getItem('nuevanesia-checkout-data');
                const saved = savedRaw ? JSON.parse(savedRaw) : {};
                saved.keranjang = Array.isArray(saved.keranjang) ? saved.keranjang : [];

                const exists = saved.keranjang.find(i => i.id === item.id);
                if (exists) {
                    saved.keranjang = saved.keranjang.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                    toast.success('Produk berhasil ditambahkan ke barang sewa yang sudah ada.');
                    // tandai merge agar checkout menampilkan notifikasi saat kembali
                    localStorage.setItem('nuevanesia-just-merged', JSON.stringify({ id: item.id, nama: item.nama, qty: 1, time: Date.now() }));
                } else {
                    saved.keranjang.push({ ...item, qty: 1 });
                    toast.success('Produk baru berhasil ditambahkan ke barang sewa.');
                    // tandai merge agar checkout menampilkan notifikasi saat kembali
                    localStorage.setItem('nuevanesia-just-merged', JSON.stringify({ id: item.id, nama: item.nama, qty: 1, time: Date.now() }));
                }
                localStorage.setItem('nuevanesia-checkout-data', JSON.stringify(saved));
            } catch (err) {
                console.error('Gagal sinkron keranjang ke localStorage', err);
            }
        }

        setJustAddedProductId(item.id);
        setTimeout(() => {
            setJustAddedProductId(null);
        }, 1000);
    };

    const kurangDariKeranjang = (itemId) => {
        const item = keranjang.find((i) => i.id === itemId);
        if (item.qty === 1) {
            hapusItem(itemId);
        } else {
            const newKeranjang = keranjang.map((i) =>
                i.id === itemId ? { ...i, qty: i.qty - 1 } : i
            );
            setKeranjang(newKeranjang);

            // update localStorage
            if (typeof window !== 'undefined') {
                try {
                    const savedRaw = localStorage.getItem('nuevanesia-checkout-data');
                    const saved = savedRaw ? JSON.parse(savedRaw) : {};
                    saved.keranjang = Array.isArray(saved.keranjang) ? saved.keranjang : [];
                    saved.keranjang = saved.keranjang.map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0);
                    localStorage.setItem('nuevanesia-checkout-data', JSON.stringify(saved));
                } catch (err) {
                    console.error('Gagal update keranjang di localStorage', err);
                }
            }
        }
    };

    const hapusItem = (itemId) => {
        const newKeranjang = keranjang.filter((i) => i.id !== itemId);
        setKeranjang(newKeranjang);

        if (typeof window !== 'undefined') {
            try {
                const savedRaw = localStorage.getItem('nuevanesia-checkout-data');
                const saved = savedRaw ? JSON.parse(savedRaw) : {};
                saved.keranjang = Array.isArray(saved.keranjang) ? saved.keranjang : [];
                saved.keranjang = saved.keranjang.filter((i) => i.id !== itemId);
                localStorage.setItem('nuevanesia-checkout-data', JSON.stringify(saved));
            } catch (err) {
                console.error('Gagal hapus item di localStorage', err);
            }
        }
    };

    const handleProses = () => {
        if (keranjang.length === 0) {
            toast.error('Keranjang sewa masih kosong!');
            return;
        }
        if (typeof window !== 'undefined') {
            try {
                const savedRaw = localStorage.getItem('nuevanesia-checkout-data');
                const saved = savedRaw ? JSON.parse(savedRaw) : {};
                saved.keranjang = keranjang;
                localStorage.setItem('nuevanesia-checkout-data', JSON.stringify(saved));
            } catch (err) {
                console.error('Gagal menyimpan checkout data', err);
                localStorage.setItem('nuevanesia-checkout-data', JSON.stringify({ keranjang }));
            }
        }
        router.push('/checkout');
    };

    const produkTerfilter = produk.filter(item => {
        const kategoriCocok = kategoriTerpilih === 'Semua' || item.kategori === kategoriTerpilih;
        const pencarianCocok = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
        return kategoriCocok && pencarianCocok;
    });
    
    // --- FUNGSI BARU: Untuk membuka dan menutup popup produk ---
    const openProductPopup = (product) => {
        setSelectedProduct(product);
    };

    const closeProductPopup = () => {
        setSelectedProduct(null);
    };
    
    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-900 text-gray-200 font-sans">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#24252A',
                        color: '#e2e8f0',
                        border: '1px solid #2C2E33'
                    },
                }}
            />
            <Head>
                <title>Nuevanesia POS</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            
            <div className="w-full lg:w-120 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
                <div className="flex items-center justify-center mb-12 flex-col">
                    <img src="/images/logo-nuevanesia.png" alt="Nuevanesia Logo" className="h-20 mr-3" />
                    <p className="text-sm font-light text-blue-400 mt-2">Produce by GodByte</p>
                    <span className="hidden">NUEVANESIA</span>
                </div>

                {/* --- KODE KATEGORI BARU --- */}
                <div className="flex-grow lg:h-[85vh] overflow-y-auto scrollbar-hide">
                    <h2 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-widest">Kategori</h2>
                    <div className="space-y-2">
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
                                {kategoriTerpilih === kategori && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-teal-400 rounded-r-full"></div>
                                )}
                                <span className="mr-2">
                                    {CATEGORY_ICONS[kategori] || <IconOther />}
                                </span>
                                <span className="font-medium">{kategori}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* --- AKHIR KODE KATEGORI BARU --- */}
                
                {/* --- PENAMBAHAN KODE: Tombol Manajemen Produk --- */}
                <div className="space-y-3 mt-8">
                    <button
                        onClick={() => window.open('/manajemen-produk', '_blank')}
                        className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-yellow-500/30 hover:text-white transition-colors duration-200 w-full font-semibold"
                    >
                        <IconTool />
                        Manajemen Produk
                    </button>
                    <button
                        onClick={() => window.open('/laporan', '_blank')}
                        className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-blue-500/20 hover:text-white transition-colors duration-200 w-full font-semibold"
                    >
                        <IconChartBar />
                        Lihat Laporan
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center bg-gray-700 text-gray-300 p-3 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 w-full font-semibold"
                    >
                        <IconLogout />
                        Logout
                    </button>
                </div>
            </div>

            <div className="w-[110rem] p-8 bg-gray-900 overflow-y-auto scrollbar-hide">
                <h1 className="text-3xl font-bold mb-8 text-white text-center">PRODUK SEWA</h1>
                
                <div className="mb-8 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama produk..."
                        className="w-full p-4 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                    <IconSearch />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {produkTerfilter.length > 0 ? (
                        produkTerfilter.map(item => {
                            const isInCart = keranjang.some(cartItem => cartItem.id === item.id);

                            return (
                                <div 
                                    key={item.id} 
                                    // --- MODIFIKASI: Tambahkan event onClick untuk popup ---
                                    onClick={() => openProductPopup(item)}
                                    className={`bg-gray-800/50 border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden group transition-all duration-300 hover:border-teal-500/50 hover:shadow-teal-500/10 hover:scale-[1.02] cursor-pointer ${
                                        justAddedProductId === item.id ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-teal-400' : ''
                                    }`}
                                >
                                    <img src={item.url_gambar || '/images/placeholder.png'} alt={item.nama} className="w-full h-44 object-cover" />
                        <div className="p-4 flex flex-col flex-grow">
                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">{item.kategori}</p>
                        <h3 className="font-bold text-lg text-white mb-1">{item.nama}</h3>
                        <p className="text-sm text-gray-400">Rp{item.harga.toLocaleString('id-ID')} / Hari</p>
                        <p className={`text-xs mt-1 font-semibold ${item.stok > 10 ? 'text-green-400' : item.stok > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                            Stok: {item.stok}
                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Mencegah klik menyebar ke div parent
                                                tambahKeKeranjang(item);
                                            }}
                                            disabled={item.stok === 0}
                                            className={`font-semibold p-2.5 mt-auto rounded-lg w-full transition-all duration-200 flex items-center justify-center text-sm disabled:cursor-not-allowed ${
                                                isInCart 
                                                ? 'bg-green-600/20 text-green-300' 
                                                : 'bg-teal-600 text-white hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500'
                                            }`}
                                        >
                                            {isInCart ? (
                                                'Ditambahkan ✔'
                                            ) : (
                                                <>
                                                    <IconPlus />
                                                    <span>Tambah</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 col-span-full text-center py-16">Tidak ada produk yang cocok dengan pencarian Anda.</p>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-150 bg-gray-900 border-l border-gray-800 p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-white">Keranjang</h2>
                


                <div className="flex-grow bg-gray-800 rounded-xl mb-4 border border-gray-700 min-h-[200px] flex flex-col">
                    <div className="p-4 flex-grow overflow-y-auto">
                        {keranjang.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-center text-sm">Keranjang Anda kosong.</p>
                            </div>
                        ) : (
                            keranjang.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0">
                                    <div>
                                        <p className="font-medium text-white text-sm">{item.nama}</p>
                                        <p className="text-xs text-gray-400">Rp{item.harga.toLocaleString('id-ID')} x {item.qty}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => kurangDariKeranjang(item.id)} className="bg-gray-700 text-white w-7 h-7 rounded-md text-lg hover:bg-gray-600 transition-colors flex items-center justify-center">-</button>
                                        <span className="font-bold text-gray-200 text-sm w-4 text-center">{item.qty}</span>
                                        <button onClick={() => tambahKeKeranjang(item)} className="bg-gray-700 text-white w-7 h-7 rounded-md text-lg hover:bg-gray-600 transition-colors flex items-center justify-center">+</button>
                                        <button onClick={() => hapusItem(item.id)} className="text-gray-500 hover:text-red-500 ml-2 transition-colors">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-400">Total Harga Per Hari:</span>
                            <span className="font-semibold text-gray-200">Rp{(hitungSubtotalPerMalam()).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-700 pt-4 mt-4">
                        <p className="text-lg font-bold text-white">Total Produk:</p>
                        <p className="text-xl font-bold text-teal-400">{keranjang.reduce((sum, item) => sum + item.qty, 0)} Item</p>
                    </div>
                    <button onClick={handleProses} className="bg-gradient-to-r from-teal-500 to-green-500 text-white p-4 w-full mt-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity duration-200">
                        PROSES TRANSAKSI
                    </button>
                </div>
            </div>

            {/* --- PENAMBAHAN KODE: Komponen popup produk --- */}
            <ProductPopup product={selectedProduct} onClose={closeProductPopup} />

        </div>
    );
}