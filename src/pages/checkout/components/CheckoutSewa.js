import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutSewa() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [keranjang, setKeranjang] = useState([]);
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [alamatPelanggan, setAlamatPelanggan] = useState('');
    const [noWhatsapp, setNoWhatsapp] = useState('');
    const [jaminan, setJaminan] = useState('');
    const [catatan, setCatatan] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
    const [diskonOtomatisAktif, setDiskonOtomatisAktif] = useState(true);
    const [diskon, setDiskon] = useState(0);
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');
    const [pelangganDitemukan, setPelangganDitemukan] = useState(false);
    const [pelangganBaru, setPelangganBaru] = useState(false);
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);
    
    // State Pembayaran
    const [statusPembayaran, setStatusPembayaran] = useState('Lunas');
    const [jumlahTerbayar, setJumlahTerbayar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false); // SAKLAR BARU UNTUK LOADING
    
    const noWhatsappTimeoutRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                router.replace('/login');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (!session) {
                router.replace('/login');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const rawData = window.localStorage.getItem('nuevanesia-checkout-data');
        if (!rawData) {
            router.replace('/');
            return;
        }

        try {
            const savedData = JSON.parse(rawData);
            if (!savedData?.keranjang || savedData.keranjang.length === 0) {
                router.replace('/');
                return;
            }
            setKeranjang(savedData.keranjang);
            setTanggalMulai(savedData.tanggalMulai || '');
            setTanggalSelesai(savedData.tanggalSelesai || '');
            
            setNamaPelanggan(savedData.namaPelanggan || '');
            setAlamatPelanggan(savedData.alamatPelanggan || '');
            setNoWhatsapp(savedData.noWhatsapp || '');
            setJaminan(savedData.jaminan || '');
            setCatatan(savedData.catatan || '');

            try {
                const mergedRaw = window.localStorage.getItem('nuevanesia-just-merged');
                if (mergedRaw) {
                    const merged = JSON.parse(mergedRaw);
                    if (merged && merged.nama) {
                        toast.success(`Produk "${merged.nama}" ditambahkan ke keranjang.`, { duration: 3500 });
                    } else {
                        toast.success('Produk baru ditambahkan ke keranjang.', { duration: 3500 });
                    }
                    window.localStorage.removeItem('nuevanesia-just-merged');
                }
            } catch (e) {}
        } catch (error) {
            console.error('Gagal membaca checkout data:', error);
            router.replace('/');
        }
    }, [router]);

    // --- FITUR BARU: Auto-Save ke LocalStorage setiap ada perubahan input ---
    useEffect(() => {
        if (keranjang.length > 0 && typeof window !== 'undefined') {
            window.localStorage.setItem('nuevanesia-checkout-data', JSON.stringify({
                keranjang,
                tanggalMulai,
                tanggalSelesai,
                namaPelanggan,
                alamatPelanggan,
                noWhatsapp,
                jaminan,
                catatan
            }));
        }
    }, [keranjang, tanggalMulai, tanggalSelesai, namaPelanggan, alamatPelanggan, noWhatsapp, jaminan, catatan]);
    // ------------------------------------------------------------------------

    const handleNoWhatsappChange = (value) => {
        setNoWhatsapp(value);
        if (!value.trim()) {
            setPelangganDitemukan(false);
            setPelangganBaru(false);
            setNamaPelanggan('');
            setAlamatPelanggan('');
            setJaminan('');
        }
    };

    const handleGunakanDataBaru = () => {
        setPelangganDitemukan(false);
        setPelangganBaru(true);
        setNamaPelanggan('');
        setAlamatPelanggan('');
        setJaminan('');
    };

    const cariPelangganByWhatsapp = async (whatsapp) => {
        setLoadingPelanggan(true);
        try {
            const { data: existingPelanggan, error } = await supabase
                .from('pelanggan')
                .select('nama, alamat, jaminan')
                .eq('no_whatsapp', whatsapp)
                .single();

            if (error && error.code === 'PGRST116') {
                setPelangganDitemukan(false);
                setPelangganBaru(true);
                setNamaPelanggan('');
                setAlamatPelanggan('');
                setJaminan('');
                return;
            }

            if (error) {
                console.error('Error mencari pelanggan:', error);
                toast.error('Gagal mencari data pelanggan.');
                setPelangganDitemukan(false);
                setPelangganBaru(false);
                return;
            }

            if (existingPelanggan) {
                setNamaPelanggan(existingPelanggan.nama || '');
                setAlamatPelanggan(existingPelanggan.alamat || '');
                setJaminan(existingPelanggan.jaminan || '');
                setPelangganDitemukan(true);
                setPelangganBaru(false);
            }
        } finally {
            setLoadingPelanggan(false);
        }
    };

    useEffect(() => {
        if (noWhatsappTimeoutRef.current) {
            clearTimeout(noWhatsappTimeoutRef.current);
        }

        const trimmed = noWhatsapp.trim();
        if (!trimmed || trimmed.length < 8) {
            setPelangganDitemukan(false);
            setPelangganBaru(false);
            return;
        }

        noWhatsappTimeoutRef.current = setTimeout(() => {
            cariPelangganByWhatsapp(trimmed);
        }, 500);

        return () => {
            if (noWhatsappTimeoutRef.current) {
                clearTimeout(noWhatsappTimeoutRef.current);
            }
        };
    }, [noWhatsapp]);

    // --- FITUR BARU: Fungsi Simpan Pelanggan Mandiri ---
    const handleSimpanPelangganDb = async () => {
        if (!noWhatsapp || !namaPelanggan || !alamatPelanggan || !jaminan) {
            toast.error('Mohon lengkapi No. WhatsApp, Nama, Alamat, dan Jaminan sebelum menyimpan pelanggan.');
            return;
        }

        const toastId = toast.loading('Menyimpan data pelanggan...');
        try {
            const { data: existing, error: fetchError } = await supabase
                .from('pelanggan')
                .select('id')
                .eq('no_whatsapp', noWhatsapp)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (existing) {
                const { error: updateError } = await supabase
                    .from('pelanggan')
                    .update({
                        nama: namaPelanggan,
                        alamat: alamatPelanggan,
                        jaminan: jaminan,
                    })
                    .eq('id', existing.id);
                
                if (updateError) throw updateError;
                toast.success('Data pelanggan berhasil diperbarui!', { id: toastId });
            } else {
                const { error: insertError } = await supabase
                    .from('pelanggan')
                    .insert([{
                        no_whatsapp: noWhatsapp,
                        nama: namaPelanggan,
                        alamat: alamatPelanggan,
                        jaminan: jaminan,
                    }]);
                
                if (insertError) throw insertError;
                toast.success('Pelanggan baru berhasil ditambahkan!', { id: toastId });
                setPelangganBaru(false);
                setPelangganDitemukan(true);
            }
        } catch (error) {
            console.error('Error menyimpan pelanggan:', error);
            toast.error('Terjadi kesalahan saat menyimpan data pelanggan.', { id: toastId });
        }
    };
    // ----------------------------------------------------

    const saveCheckoutData = (
        updatedKeranjang = keranjang, 
        updatedTanggalMulai = tanggalMulai, 
        updatedTanggalSelesai = tanggalSelesai,
        updatedNama = namaPelanggan,
        updatedAlamat = alamatPelanggan,
        updatedWhatsapp = noWhatsapp,
        updatedJaminan = jaminan,
        updatedCatatan = catatan
    ) => {
        if (typeof window === 'undefined') return;

        if (!updatedKeranjang || updatedKeranjang.length === 0) {
            window.localStorage.removeItem('nuevanesia-checkout-data');
            return;
        }

        window.localStorage.setItem('nuevanesia-checkout-data', JSON.stringify({
            keranjang: updatedKeranjang,
            tanggalMulai: updatedTanggalMulai,
            tanggalSelesai: updatedTanggalSelesai,
            namaPelanggan: updatedNama,
            alamatPelanggan: updatedAlamat,
            noWhatsapp: updatedWhatsapp,
            jaminan: updatedJaminan,
            catatan: updatedCatatan
        }));
    };

    const updateKeranjang = (updatedKeranjang) => {
        setKeranjang(updatedKeranjang);
        saveCheckoutData(updatedKeranjang);
    };

    const hapusItem = (itemId) => {
        const updatedKeranjang = keranjang.filter((item) => item.cartItemId !== itemId && item.id !== itemId);
        updateKeranjang(updatedKeranjang);
        if (updatedKeranjang.length === 0) {
            router.push('/');
        }
    };

    const tambahQty = (itemId) => {
        const updatedKeranjang = keranjang.map((item) =>
            (item.cartItemId === itemId || item.id === itemId) ? { ...item, qty: item.qty + 1 } : item
        );
        updateKeranjang(updatedKeranjang);
    };

    const kurangQty = (itemId) => {
        const item = keranjang.find((item) => item.cartItemId === itemId || item.id === itemId);
        if (!item) return;

        if (item.qty <= 1) {
            hapusItem(itemId);
            return;
        }

        const updatedKeranjang = keranjang.map((item) =>
            (item.cartItemId === itemId || item.id === itemId) ? { ...item, qty: item.qty - 1 } : item
        );
        updateKeranjang(updatedKeranjang);
    };

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

    const formatDateFull = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
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

        if (jenisDiskonManual === 'nominal') {
            return Math.max(0, subtotal - diskonManual);
        }

        if (jenisDiskonManual === 'persentase') {
            const nilaiDiskon = (diskonManual / 100) * subtotal;
            return Math.max(0, subtotal - nilaiDiskon);
        }

        return subtotal;
    };

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

    const missingRequirements = [];
    if (keranjang.length === 0) missingRequirements.push('Barang yang disewa kosong');
    if (!namaPelanggan) missingRequirements.push('Nama pelanggan');
    if (!alamatPelanggan) missingRequirements.push('Alamat pelanggan');
    if (!noWhatsapp) missingRequirements.push('No. Whatsapp');
    if (!jaminan) missingRequirements.push('Jaminan');
    if (!tanggalMulai || !tanggalSelesai) missingRequirements.push('Tanggal sewa');
    if (hitungDurasiHari() <= 0) missingRequirements.push('Durasi sewa tidak valid');

    const isSaveDisabled = missingRequirements.length > 0;

    const handleTambahProdukManual = () => {
        saveCheckoutData(keranjang, tanggalMulai, tanggalSelesai, namaPelanggan, alamatPelanggan, noWhatsapp, jaminan, catatan);
        toast('Silakan kembali ke beranda dan tambahkan produk. Setelah selesai, klik PROSES TRANSAKSI untuk kembali ke checkout.', { icon: 'ℹ️' });
        router.push('/');
    };

    const resetCheckoutState = () => {
        setKeranjang([]);
        setTanggalMulai('');
        setTanggalSelesai('');
        setNamaPelanggan('');
        setAlamatPelanggan('');
        setNoWhatsapp('');
        setJaminan('');
        setCatatan('');
        setMetodePembayaran('Cash');
        setDiskonOtomatisAktif(true);
        setDiskon(0);
        setDiskonManual(0);
        setJenisDiskonManual('nominal');
        setPelangganDitemukan(false);
        setPelangganBaru(false);
        setStatusPembayaran('Lunas');
        setJumlahTerbayar(0);
    };

    const handleSimpanPembayaran = async () => {
        if (isSubmitting) return;

        if (!namaPelanggan || !alamatPelanggan || !noWhatsapp || !jaminan) {
            toast.error('Mohon lengkapi semua data pelanggan!');
            return;
        }

        if (!tanggalMulai || !tanggalSelesai) {
            toast.error('Mohon lengkapi tanggal sewa terlebih dahulu!');
            return;
        }

        if (hitungDurasiHari() <= 0) {
            toast.error('Tanggal kembali harus setelah tanggal ambil!');
            return;
        }

        const totalBiayaAkhir = hitungTotalAkhir();
        const finalJumlahTerbayar = statusPembayaran === 'Lunas' ? totalBiayaAkhir : jumlahTerbayar;
        const finalStatus = statusPembayaran === 'Lunas' ? 'Lunas' : 'DP';
        const tipeLog = statusPembayaran === 'Lunas' ? 'Lunas Langsung' : 'DP';

        if (statusPembayaran === 'DP') {
            if (!finalJumlahTerbayar || finalJumlahTerbayar <= 0) {
                toast.error('Nominal DP harus diisi dan lebih dari 0!');
                return;
            }
            if (finalJumlahTerbayar >= totalBiayaAkhir) {
                toast.error('Nominal DP tidak boleh lebih besar atau sama dengan total. Pilih Lunas Langsung.');
                return;
            }
        }

        setIsSubmitting(true); // NYALAKAN SAKLAR (KUNCI TOMBOL)
        const toastId = toast.loading('Menyimpan transaksi...');
        
        try {
        // 1. Simpan/Update Pelanggan
        let pelangganId;
        const { data: existingPelanggan, error: fetchError } = await supabase
            .from('pelanggan')
            .select('id, nama, alamat, jaminan')
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
                }])
                .select();

            if (insertError) {
                console.error('Error menyimpan pelanggan baru:', insertError);
                toast.error('Gagal menyimpan pelanggan baru.', { id: toastId });
                return;
            }
            pelangganId = newPelangganData[0].id;
        } else if (existingPelanggan) {
            pelangganId = existingPelanggan.id;
            const harusUpdatePelanggan =
                existingPelanggan.nama !== namaPelanggan ||
                existingPelanggan.alamat !== alamatPelanggan ||
                existingPelanggan.jaminan !== jaminan;

            if (harusUpdatePelanggan) {
                const { error: updateError } = await supabase
                    .from('pelanggan')
                    .update({
                        nama: namaPelanggan,
                        alamat: alamatPelanggan,
                        jaminan: jaminan,
                    })
                    .eq('id', pelangganId);

                if (updateError) {
                    console.error('Error memperbarui data pelanggan:', updateError);
                    toast.error('Gagal memperbarui data pelanggan.', { id: toastId });
                    return;
                }
            }
        } else {
            console.error('Error saat mencari pelanggan:', fetchError);
            toast.error('Gagal mencari data pelanggan.', { id: toastId });
            return;
        }

        // 2. Hitung Diskon
        let nilaiDiskonManual = 0;
        if (jenisDiskonManual === 'nominal') {
            nilaiDiskonManual = diskonManual;
        } else if (jenisDiskonManual === 'persentase') {
            const subtotalSetelahDiskonOtomatis = (hitungSubtotalPerMalam() * hitungDurasiHari()) - diskon;
            nilaiDiskonManual = (diskonManual / 100) * subtotalSetelahDiskonOtomatis;
        }

        // 3. Simpan ke tabel Transaksi
        const { data: transaksiData, error: transaksiError } = await supabase
            .from('transaksi')
            .insert([{
                pelanggan_id: pelangganId,
                tanggal_mulai: tanggalMulai,
                tanggal_selesai: tanggalSelesai,
                durasi_hari: hitungDurasiHari(),
                total_biaya: totalBiayaAkhir,
                jenis_pembayaran: metodePembayaran,
                catatan: catatan,
                diskon_manual: nilaiDiskonManual,
                status_pembayaran: finalStatus,
                jumlah_terbayar: finalJumlahTerbayar
            }])
            .select();

        if (transaksiError) {
            console.error('Error menyimpan transaksi:', transaksiError);
            toast.error('Gagal menyimpan data transaksi.', { id: toastId });
            return;
        }

        const transaksiId = transaksiData[0].id;

        // 4. Simpan ke tabel Log Pembayaran
        if (finalJumlahTerbayar > 0) {
            const { error: logError } = await supabase
                .from('log_pembayaran')
                .insert([{
                    transaksi_id: transaksiId,
                    nominal: finalJumlahTerbayar,
                    jenis_pembayaran: metodePembayaran,
                    tipe: tipeLog,
                    tanggal_bayar: new Date().toISOString() // <--- TAMBAHAN INI
                }]);
        }

        // 5. Simpan ke tabel Transaksi Detail (Ditambahkan produk_variasi_id)
        const itemsToInsert = keranjang.map((item) => ({
            transaksi_id: transaksiId,
            produk_id: item.id,
            nama_barang: item.nama,
            jumlah: item.qty,
            produk_variasi_id: item.produk_variasi_id || null,
            variasi_terpilih: item.variasi_terpilih || item.variasi || null,
            harga_satuan: item.harga // <-- MENGUNCI HARGA SAAT TRANSAKSI TERJADI
        }));
        const { error: detailError } = await supabase
            .from('transaksi_detail')
            .insert(itemsToInsert);

        if (detailError) {
            console.error('Error menyimpan detail transaksi:', detailError);
            toast.error('Gagal menyimpan detail transaksi.', { id: toastId });
            return;
        }

        // 6. Potong Stok Produk & Variasi secara akurat
        await Promise.all(
            keranjang.map(async (item) => {
                if (item.produk_variasi_id) {
                    // Cek stok variasi saat ini
                    const { data: vData } = await supabase.from('produk_variasi').select('stok').eq('id', item.produk_variasi_id).single();
                    if (vData) {
                        return supabase.from('produk_variasi').update({ stok: Math.max(0, vData.stok - item.qty) }).eq('id', item.produk_variasi_id);
                    }
                } else {
                    // Cek stok produk utama jika bukan variasi
                    const { data: pData } = await supabase.from('produk').select('stok').eq('id', item.id).single();
                    if (pData) {
                        return supabase.from('produk').update({ stok: Math.max(0, pData.stok - item.qty) }).eq('id', item.id);
                    }
                }
            })
        );

        // 7. Siapkan Data untuk Struk
        const transaksiDataUntukStruk = {
            pelanggan: {
                nama: namaPelanggan,
                alamat: alamatPelanggan,
                noWhatsapp,
                jaminan,
            },
            keranjang,
            tanggalMulai,
            tanggalSelesai,
            durasi: hitungDurasiHari(),
            subtotal: hitungSubtotalPerMalam() * hitungDurasiHari(),
            diskonOtomatis: diskon,
            diskonManual: jenisDiskonManual === 'persentase'
                ? (diskonManual / 100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon)
                : diskonManual,
            total: totalBiayaAkhir,
            metodePembayaran,
            catatan,
            statusPembayaran: finalStatus,
            jumlahTerbayar: finalJumlahTerbayar
        };

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(transaksiDataUntukStruk));
            window.open('/cetak-struk', '_blank');
            window.localStorage.removeItem('nuevanesia-checkout-data');
        }

        resetCheckoutState();
        toast.success('Data sewa berhasil disimpan! Checkout siap untuk order berikutnya.', { id: toastId });
        router.push('/');
        
        } finally {
            setIsSubmitting(false); // MATIKAN SAKLAR (BUKA KUNCI TOMBOL) APAPUN YANG TERJADI
        }
    };

    if (!session) {
        return null;
    }

   return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans selection:bg-teal-500 selection:text-white">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#24252A', color: '#e2e8f0', border: '1px solid #2C2E33' } }} />
            <Head><title>Checkout Sewa - POS</title></Head>
            
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">Checkout Sewa</h1>
                    <p className="text-gray-400 text-sm mt-2">Lengkapi data penyewa, jaminan, dan durasi sewa.</p>
                </div>
                <button
                    onClick={() => {
                        saveCheckoutData(keranjang, tanggalMulai, tanggalSelesai, namaPelanggan, alamatPelanggan, noWhatsapp, jaminan, catatan);
                        router.push('/');
                    }}
                    className="hidden sm:block bg-gray-800 border border-gray-700 px-5 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    Kembali Tambah Barang
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ============================================================== */}
                {/* KOLOM KIRI (60%): DATA PENYEWA, DURASI, & BARANG */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* 1. DATA PELANGGAN & JAMINAN */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400 flex items-center">👤 Data Penyewa & Jaminan</h2>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">NO. WHATSAPP (WAJIB)</label>
                                    <input 
                                        type="number" 
                                        value={noWhatsapp} 
                                        onChange={(e) => handleNoWhatsappChange(e.target.value)} 
                                        placeholder="Contoh: 081234..." 
                                        className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                                    />
                                    {loadingPelanggan && <p className="text-xs text-gray-400 mt-2">Mencari data...</p>}
                                    {!loadingPelanggan && pelangganDitemukan && <p className="text-xs text-green-400 mt-2 font-bold">✓ Data otomatis terisi.</p>}
                                    {!loadingPelanggan && pelangganBaru && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-xs text-yellow-500 font-medium">⚠️ Nomor baru.</p>
                                            <button type="button" onClick={handleGunakanDataBaru} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg">Gunakan</button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">NAMA (WAJIB)</label>
                                    <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} placeholder="Nama lengkap..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">JAMINAN (WAJIB)</label>
                                    <input type="text" value={jaminan} onChange={(e) => setJaminan(e.target.value)} placeholder="KTP / SIM / STNK / Motor..." className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">ALAMAT (WAJIB)</label>
                                    <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} placeholder="Alamat domisili..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>

                            <button type="button" onClick={handleSimpanPelangganDb} className="w-full py-3 bg-gray-900 hover:bg-gray-700 border border-teal-600/50 text-teal-400 text-sm font-bold rounded-xl transition-colors">
                                Simpan / Update Data Pelanggan (Tanpa Transaksi)
                            </button>
                        </div>
                    </div>

                    {/* 2. TANGGAL SEWA */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-teal-400">📅 Tanggal Sewa</h2>
                            <div className="bg-teal-900/30 text-teal-400 border border-teal-500/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-inner">
                                {hitungDurasiHari()} Malam
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">TANGGAL AMBIL</label>
                                <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">TANGGAL KEMBALI</label>
                                <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>
                    </div>

                    {/* 3. BARANG DISEWA */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-teal-400">📝 Rincian Barang</h2>
                            <button type="button" onClick={handleTambahProdukManual} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors">
                                + Tambah Barang
                            </button>
                        </div>
                        <div className="space-y-4 pr-2 mb-6 max-h-96 overflow-y-auto">
                            {keranjang.map((item) => (
                                <div key={item.cartItemId || item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 gap-4">
                                    <div className="flex items-center gap-4">
                                        <img src={item.url_gambar || '/images/placeholder.png'} alt={item.nama} className="w-14 h-14 object-cover rounded-xl border border-gray-700" />
                                        <div>
                                            <p className="font-bold text-white text-base leading-tight">{item.nama}</p>
                                            <p className="text-xs text-gray-400 mt-1">Rp{Number(item.harga).toLocaleString('id-ID')} / malam</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                                        <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-1 border border-gray-700">
                                            <button type="button" onClick={() => kurangQty(item.cartItemId || item.id)} className="w-8 h-8 rounded-lg bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center font-bold">-</button>
                                            <span className="text-white font-bold w-4 text-center">{item.qty}</span>
                                            <button type="button" onClick={() => tambahQty(item.cartItemId || item.id)} className="w-8 h-8 rounded-lg bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center font-bold">+</button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-teal-400 text-lg">Rp{(item.harga * item.qty).toLocaleString('id-ID')}</p>
                                            <button type="button" onClick={() => hapusItem(item.cartItemId || item.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Hapus</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-700 pt-6">
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Catatan Transaksi</label>
                            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: tenda warna merah, tas ditaruh terpisah..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* KOLOM KANAN (40%): SLIP TAGIHAN & DISKON (STICKY) */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col sticky top-6">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 border-b border-gray-700 pb-4">Tagihan Sewa</h2>
                    
                    {/* 1. RINGKASAN BIAYA & DISKON */}
                    <div className="space-y-4 text-sm mb-6">
                        <div className="flex justify-between items-center text-gray-400">
                            <span>Subtotal ({hitungDurasiHari()} Malam)</span>
                            <span className="font-medium">Rp{(hitungSubtotalPerMalam() * hitungDurasiHari()).toLocaleString('id-ID')}</span>
                        </div>
                        
                        {/* DISKON OTOMATIS */}
                        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                            <div>
                                <p className="text-xs font-semibold text-gray-300 uppercase">Promo Hari ke-3 (50%)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {diskonOtomatisAktif && hitungDurasiHari() >= 3 && (
                                    <span className="text-red-400 font-bold">-Rp{diskon.toLocaleString('id-ID')}</span>
                                )}
                                <button type="button" onClick={() => setDiskonOtomatisAktif(!diskonOtomatisAktif)} className={`text-xs px-2 py-1 rounded font-bold ${diskonOtomatisAktif ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                    {diskonOtomatisAktif ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        {/* DISKON MANUAL */}
                        <div className="pt-2 flex flex-col gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Diskon Tambahan</span>
                            <div className="flex space-x-2">
                                <input type="number" value={diskonManual} onChange={(e) => setDiskonManual(Math.max(0, Number(e.target.value)))} placeholder="0" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                <select value={jenisDiskonManual} onChange={(e) => setJenisDiskonManual(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl text-white px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                                    <option value="nominal">Rp</option>
                                    <option value="persentase">%</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-700 pt-6 mt-4">
                            <span className="text-lg font-bold text-gray-300 uppercase">Total Akhir</span>
                            <span className="text-4xl font-black text-teal-400">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* 2. PEMBAYARAN & METODE (MENGGUNAKAN TOMBOL WARNA) */}
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 mb-8 mt-2">
                        <label className="block text-xs font-bold text-teal-400 mb-4 uppercase tracking-wider">Status Pembayaran</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => { setStatusPembayaran('Lunas'); setJumlahTerbayar(hitungTotalAkhir()); }} className={`p-3 rounded-xl font-bold transition-all ${statusPembayaran === 'Lunas' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>LUNAS</button>
                            <button onClick={() => { setStatusPembayaran('DP'); setJumlahTerbayar(''); }} className={`p-3 rounded-xl font-bold transition-all ${statusPembayaran === 'DP' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>DP (SEBAGIAN)</button>
                        </div>
                        
                        {statusPembayaran === 'DP' && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Nominal DP (Rp)</label>
                                <input type="number" value={jumlahTerbayar} onChange={(e) => setJumlahTerbayar(Number(e.target.value))} placeholder="Contoh: 50000" className="w-full p-4 bg-gray-800 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                {jumlahTerbayar > 0 && jumlahTerbayar < hitungTotalAkhir() && (
                                    <p className="text-xs text-yellow-500 mt-2 font-medium">Sisa Tagihan: Rp{(hitungTotalAkhir() - jumlahTerbayar).toLocaleString('id-ID')}</p>
                                )}
                            </div>
                        )}
                        
                        <label className="block text-xs font-bold text-teal-400 mb-4 mt-6 uppercase tracking-wider">Metode Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Tombol QRIS - BIRU */}
                            <button type="button" onClick={() => setMetodePembayaran('QRIS')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'QRIS' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-blue-400'}`}>QRIS</button>
                            
                            {/* Tombol CASH - HIJAU */}
                            <button type="button" onClick={() => setMetodePembayaran('Cash')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'Cash' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-emerald-400'}`}>CASH</button>
                            
                            {/* Tombol TRANSFER - ORANYE */}
                            <button type="button" onClick={() => setMetodePembayaran('Transfer')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'Transfer' ? 'bg-orange-600 text-white border-orange-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-orange-400'}`}>TRANSFER</button>
                        </div>
                    </div>

                    {/* 3. TOMBOL EKSEKUSI UTAMA */}
                    <div className="mt-auto space-y-3">
                        {isSaveDisabled && <div className="text-xs text-yellow-500 mb-3 text-center bg-yellow-500/10 p-2 rounded-lg">⚠️ Lengkapi: {missingRequirements.join(', ')}</div>}
                        <button 
                            onClick={handleSimpanPembayaran} 
                            disabled={isSaveDisabled || isSubmitting} 
                            className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-lg tracking-wide uppercase shadow-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-80 transition-all duration-300 transform active:scale-[0.98]"
                        >
                            {isSubmitting ? 'MEMPROSES...' : 'SIMPAN SEWA'}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => router.push('/')} className="py-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-xl transition-colors">Batal</button>
                            <button onClick={() => { if(typeof window !== 'undefined') window.localStorage.removeItem('nuevanesia-checkout-data'); router.push('/'); }} className="py-3 bg-red-900/50 hover:bg-red-800 border border-red-800 text-red-200 text-sm font-bold rounded-xl transition-colors">Hapus Data</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}