import { useState, useEffect, useMemo, useRef } from 'react';
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
 
    // --- PENAMBAHAN KODE: State untuk produk yang dipilih ---
    const [selectedProduct, setSelectedProduct] = useState(null);

    // >>> KODE BARU DIMULAI <<<
    // State untuk diskon manual
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal'); // 'nominal' atau 'persentase'
    // <<< KODE BARU SELESAI >>>

    // --- PERBAIKAN: Pindahkan deklarasi fungsi ke atas ---
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
        return null;
    }

    const handleCetak = () => {
        const transaksiDataUntukStruk = {
            pelanggan: {
                nama: namaPelanggan,
                alamat: alamatPelanggan,
                noWhatsapp: noWhatsapp,
                jaminan: jaminan,
            },
            keranjang: keranjang,
            tanggalMulai: tanggalMulai,
            tanggalSelesai: tanggalSelesai,
            durasi: hitungDurasiHari(),
            subtotal: hitungSubtotalPerMalam() * hitungDurasiHari(),
            diskonOtomatis: diskon,
            // >>> KODE BARU DIMULAI <<<
            diskonManual: jenisDiskonManual === 'persentase' ? (diskonManual/100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon) : diskonManual,
            // <<< KODE BARU SELESAI >>>
            total: hitungTotalAkhir(),
            metodePembayaran: metodePembayaran,
            catatan: catatan,
        };

        localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(transaksiDataUntukStruk));
        window.open('/cetak-struk', '_blank');
        
        setKeranjang([]);
        setShowStrukPopup(false);
        setNamaPelanggan('');
        setAlamatPelanggan('');
        setNoWhatsapp('');
        setJaminan('');
        setTanggalMulai('');
        setTanggalSelesai('');
        setMetodePembayaran('Cash');
        setCatatan('');
        // >>> KODE BARU DIMULAI <<<
        setDiskonManual(0);
        setJenisDiskonManual('nominal');
        // <<< KODE BARU SELESAI >>>
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
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
            toast.error('Keranjang sewa masih kosong!');
            return;
        }
        if (!tanggalMulai || !tanggalSelesai) {
            toast.error('Mohon isi tanggal sewa terlebih dahulu!');
            return;
        }
        setShowPaymentPopup(true);
    };

    const handleSimpanPembayaran = async () => {
        if (!namaPelanggan || !alamatPelanggan || !noWhatsapp || !jaminan) {
            toast.error('Mohon lengkapi semua data pelanggan!');
            return;
        }

        const toastId = toast.loading('Menyimpan transaksi...');

        let pelangganId;

        const { data: existingPelanggan, error: fetchError } = await supabase
            .from('pelanggan')
            .select('id')
            .eq('no_whatsapp', noWhatsapp)
            .single();

        if (fetchError && fetchError.code === 'PGRST116') {
            const { data: newPelangganData, error: insertError } = await supabase
                .from('pelanggan')
                .insert([{
                    nama: namaPelanggan,
                    alamat: alamatPelanggan,
                    no_whatsapp: noWhatsapp,
                    jaminan: jaminan,
                }, ])
                .select();

            if (insertError) {
                console.error('Error menyimpan pelanggan baru:', insertError);
                toast.error('Gagal menyimpan pelanggan baru.', { id: toastId });
                return;
            }
            pelangganId = newPelangganData[0].id;
        } else if (existingPelanggan) {
            pelangganId = existingPelanggan.id;
        } else {
            console.error('Error saat mencari pelanggan:', fetchError);
            toast.error('Gagal mencari data pelanggan.', { id: toastId });
            return;
        }

        // >>> KODE BARU DIMULAI <<<
        // Hitung nilai diskon manual yang sebenarnya untuk disimpan di database
        let nilaiDiskonManual = 0;
        if (jenisDiskonManual === 'nominal') {
            nilaiDiskonManual = diskonManual;
        } else if (jenisDiskonManual === 'persentase') {
            const subtotalSetelahDiskonOtomatis = (hitungSubtotalPerMalam() * hitungDurasiHari()) - diskon;
            nilaiDiskonManual = (diskonManual / 100) * subtotalSetelahDiskonOtomatis;
        }
        
        const { data: transaksiData, error: transaksiError } = await supabase
            .from('transaksi')
            .insert([{
                pelanggan_id: pelangganId,
                tanggal_mulai: tanggalMulai,
                tanggal_selesai: tanggalSelesai,
                durasi_hari: hitungDurasiHari(),
                total_biaya: hitungTotalAkhir(),
                jenis_pembayaran: metodePembayaran,
                catatan: catatan,
                diskon_manual: nilaiDiskonManual, // Kolom baru
            }, ])
            .select();
        // <<< KODE BARU SELESAI >>>

        if (transaksiError) {
            console.error('Error menyimpan transaksi:', transaksiError);
            toast.error('Gagal menyimpan data transaksi.', { id: toastId });
            return;
        }

        const transaksiId = transaksiData[0].id;

        const itemsToInsert = keranjang.map((item) => ({
            transaksi_id: transaksiId,
            produk_id: item.id,
            nama_barang: item.nama,
            jumlah: item.qty,
        }));

        const { error: detailError } = await supabase
            .from('transaksi_detail')
            .insert(itemsToInsert);

        if (detailError) {
            console.error('Error menyimpan detail transaksi:', detailError);
            toast.error('Gagal menyimpan detail transaksi.', { id: toastId });
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

        toast.success('Data sewa berhasil disimpan!', { id: toastId });
        setShowPaymentPopup(false);
        setShowStrukPopup(true);
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
                <h1 className="text-3xl font-bold mb-8 text-white text-center">PLODUK PLODUK SEWAA</h1>
                
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
                
                <div className="bg-gray-800 p-4 rounded-xl mb-4 border border-gray-700">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tanggal Ambil Barang</label>
                    <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <label className="block text-sm font-medium text-gray-400 mt-4 mb-2">Tanggal Kembali Barang</label>
                    <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <p className="text-sm mt-4 text-gray-400">Durasi: <span className="font-semibold text-white">{hitungDurasiHari()} Malam</span></p>
                </div>

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
                            <span className="text-blue-400">Subtotal:</span>
                            <span className="font-semibold text-gray-200">Rp{(hitungSubtotalPerMalam()).toLocaleString('id-ID')}</span>
                        </div>
                        {hitungDurasiHari() >= 3 && (
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-400">Diskon(50%)Hari ke 3:</span>
                                <span className="font-semibold text-yellow-400">-Rp{diskon.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {/* >>> KODE BARU DIMULAI <<< */}
                        {diskonManual > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-red-400">Special Diskon:</span>
                                <span className="font-semibold text-red-400">
                                    -Rp{
                                        jenisDiskonManual === 'persentase' 
                                        ? ((diskonManual / 100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon)).toLocaleString('id-ID')
                                        : diskonManual.toLocaleString('id-ID')
                                    }
                                </span>
                            </div>
                        )}
                        {/* <<< KODE BARU SELESAI >>> */}
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-700 pt-4 mt-4">
                        <p className="text-xl font-bold text-white">Total:</p>
                        <p className="text-2xl font-bold text-teal-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={handleProses} className="bg-gradient-to-r from-teal-500 to-green-500 text-white p-4 w-full mt-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity duration-200">
                        PROSES TRANSAKSI
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
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Catatan</label>
                                        <textarea
                                            value={catatan}
                                            onChange={(e) => setCatatan(e.target.value)}
                                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            rows="3"
                                            placeholder="Tambahkan NAMA PELANGGAN disini..."
                                        ></textarea>
                                    </div>
                                </div>
                                
                                {/* >>> KODE BARU DIMULAI <<< */}
                                <div className="bg-gray-700 p-6 rounded-lg mb-6 shadow-inner mt-10">
                                <button
                                    onClick={() => setDiskonOtomatisAktif(!diskonOtomatisAktif)}
                                    className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 
                                        ${diskonOtomatisAktif 
                                            ? "flex items-center justify-center bg-red-600 text-white-300 p-3 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 w-full font-semiboldbg-red-600 text-white hover:bg-red-700" 
                                            : "bg-green-600 text-white hover:bg-green-700"}`}
                                >
                                    {diskonOtomatisAktif ? " Nonaktifkan Diskon 50% hari ke 3" : " Aktifkan Kembali Diskon 50% hari ke 3"}
                                </button>
                                
                                    <h3 className="text-xl font-semibold text-gray-200 mb-4 mt-5">Diskon Manual</h3>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex items-center">
                                            <input 
                                                type="radio" 
                                                id="nominal" 
                                                name="discount-type"
                                                value="nominal" 
                                                checked={jenisDiskonManual === 'nominal'}
                                                onChange={() => setJenisDiskonManual('nominal')}
                                                className="form-radio text-teal-500 h-4 w-4"
                                            />
                                            <label htmlFor="nominal" className="ml-2 text-gray-300">Nominal</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input 
                                                type="radio" 
                                                id="persentase" 
                                                name="discount-type"
                                                value="persentase" 
                                                checked={jenisDiskonManual === 'persentase'}
                                                onChange={() => setJenisDiskonManual('persentase')}
                                                className="form-radio text-teal-500 h-4 w-4"
                                            />
                                            <label htmlFor="persentase" className="ml-2 text-gray-300">Persentase</label>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{jenisDiskonManual === 'nominal' ? 'Rp' : '%'}</span>
                                        <input
                                            type="number"
                                            value={diskonManual === 0 ? '' : diskonManual}
                                            onChange={(e) => setDiskonManual(Number(e.target.value))}
                                            placeholder="Masukkan nilai diskon..."
                                            className="w-full p-2 pl-9 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>
                                {/* <<< KODE BARU SELESAI >>> */}
                                
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
                                                <div className="text-yellow-400 font-bold">Diskon (50%):</div>
                                                <div className="text-yellow-400 font-bold">-Rp{diskon.toLocaleString('id-ID')}</div>
                                            </>
                                        )}
                                        {/* >>> KODE BARU DIMULAI <<< */}
                                        {diskonManual > 0 && (
                                            <>
                                                <div className="text-red-400 font-bold">Diskon Manual:</div>
                                                <div className="text-red-400 font-bold">
                                                    -Rp{
                                                        jenisDiskonManual === 'persentase' 
                                                        ? ((diskonManual / 100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon)).toLocaleString('id-ID')
                                                        : diskonManual.toLocaleString('id-ID')
                                                    }
                                                </div>
                                            </>
                                        )}
                                        {/* <<< KODE BARU SELESAI >>> */}
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
                                    <p className="text-gray-300 mt-2">Catatan: <span className="font-semibold text-gray-200">{catatan || '-'}</span></p>
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
            
            {/* --- PENAMBAHAN KODE: Komponen popup produk --- */}
            <ProductPopup product={selectedProduct} onClose={closeProductPopup} />

        </div>
    );
}