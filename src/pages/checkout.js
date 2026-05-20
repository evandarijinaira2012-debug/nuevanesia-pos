import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function Checkout() {
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
    const [metodePembayaran, setMetodePembayaran] = useState('Cash');
    const [diskonOtomatisAktif, setDiskonOtomatisAktif] = useState(true);
    const [diskon, setDiskon] = useState(0);
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');
    const [pelangganDitemukan, setPelangganDitemukan] = useState(false);
    const [pelangganBaru, setPelangganBaru] = useState(false);
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);
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
            // Jika ada flag merge dari halaman utama, tampilkan notifikasi singkat
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
            } catch (e) {
                // ignore
            }
        } catch (error) {
            console.error('Gagal membaca checkout data:', error);
            router.replace('/');
        }
    }, [router]);

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

    const saveCheckoutData = (updatedKeranjang = keranjang, updatedTanggalMulai = tanggalMulai, updatedTanggalSelesai = tanggalSelesai) => {
        if (typeof window === 'undefined') return;

        if (!updatedKeranjang || updatedKeranjang.length === 0) {
            window.localStorage.removeItem('nuevanesia-checkout-data');
            return;
        }

        window.localStorage.setItem('nuevanesia-checkout-data', JSON.stringify({
            keranjang: updatedKeranjang,
            tanggalMulai: updatedTanggalMulai,
            tanggalSelesai: updatedTanggalSelesai,
        }));
    };

    const updateKeranjang = (updatedKeranjang) => {
        setKeranjang(updatedKeranjang);
        saveCheckoutData(updatedKeranjang);
    };

    const hapusItem = (itemId) => {
        const updatedKeranjang = keranjang.filter((item) => item.id !== itemId);
        updateKeranjang(updatedKeranjang);
        if (updatedKeranjang.length === 0) {
            router.push('/');
        }
    };

    const tambahQty = (itemId) => {
        const updatedKeranjang = keranjang.map((item) =>
            item.id === itemId ? { ...item, qty: item.qty + 1 } : item
        );
        updateKeranjang(updatedKeranjang);
    };

    const kurangQty = (itemId) => {
        const item = keranjang.find((item) => item.id === itemId);
        if (!item) return;

        if (item.qty <= 1) {
            hapusItem(itemId);
            return;
        }

        const updatedKeranjang = keranjang.map((item) =>
            item.id === itemId ? { ...item, qty: item.qty - 1 } : item
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
        // Save current checkout state and navigate back to homepage so shopkeeper
        // can add products from the product list, then return to checkout.
        saveCheckoutData(keranjang, tanggalMulai, tanggalSelesai);
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
    };

    const handleSimpanPembayaran = async () => {
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

        const toastId = toast.loading('Menyimpan transaksi...');

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
                diskon_manual: nilaiDiskonManual,
            }])
            .select();

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
            total: hitungTotalAkhir(),
            metodePembayaran,
            catatan,
        };

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(transaksiDataUntukStruk));
            window.open('/cetak-struk', '_blank');
            window.localStorage.removeItem('nuevanesia-checkout-data');
        }

        resetCheckoutState();
        toast.success('Data sewa berhasil disimpan! Checkout siap untuk order berikutnya.', { id: toastId });
        router.push('/');
    };

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#24252A', color: '#e2e8f0', border: '1px solid #2C2E33' } }} />
            <Head>
                <title>Checkout - Nuevanesia POS</title>
            </Head>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Checkout</h1>
                        <p className="text-gray-400 mt-1">Periksa kembali detail pelanggan dan barang sebelum menyimpan transaksi.</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gray-700 px-5 py-3 rounded-lg text-white hover:bg-gray-600 transition-colors"
                    >
                        Kembali ke Halaman Utama
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-inner">
                        <h2 className="text-2xl font-semibold text-teal-400 mb-4">Detail Pelanggan</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">No. WhatsApp</label>
                                <input
                                    type="text"
                                    value={noWhatsapp}
                                    onChange={(e) => handleNoWhatsappChange(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="+62..."
                                />
                                {loadingPelanggan && <p className="text-sm text-teal-300 mt-2">Mencari data pelanggan...</p>}
                                {!loadingPelanggan && pelangganDitemukan && <p className="text-sm text-green-300 mt-2">Pelanggan ditemukan, nama dan alamat terisi otomatis.</p>}
                                {!loadingPelanggan && pelangganBaru && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm text-yellow-300">Nomor belum terdaftar, ini pelanggan baru.</p>
                                        <button
                                            type="button"
                                            onClick={handleGunakanDataBaru}
                                            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg"
                                        >
                                            Gunakan Data Baru
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Nama Pelanggan</label>
                                <input
                                    type="text"
                                    value={namaPelanggan}
                                    onChange={(e) => setNamaPelanggan(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Nama Lengkap"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Alamat</label>
                                <input
                                    type="text"
                                    value={alamatPelanggan}
                                    onChange={(e) => setAlamatPelanggan(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Alamat Lengkap"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Jaminan</label>
                                <input
                                    type="text"
                                    value={jaminan}
                                    onChange={(e) => setJaminan(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="KTP/SIM/Lainnya"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Catatan</label>
                                <textarea
                                    rows="4"
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Catatan tambahan untuk transaksi"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-inner">
                        <h2 className="text-2xl font-semibold text-teal-400 mb-4">Tanggal Sewa</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tanggal Ambil Barang</label>
                                <input
                                    type="date"
                                    value={tanggalMulai}
                                    onChange={(e) => setTanggalMulai(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tanggal Kembali Barang</label>
                                <input
                                    type="date"
                                    value={tanggalSelesai}
                                    onChange={(e) => setTanggalSelesai(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Durasi Sewa</label>
                                <div className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                                    <span className="font-semibold">{hitungDurasiHari()} Malam</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-teal-400">Barang yang Disewa</h2>
                        <button
                            type="button"
                            onClick={handleTambahProdukManual}
                            className="text-sm bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-lg"
                        >
                            Tambah Produk
                        </button>
                    </div>
                    <div className="space-y-3">
                        {keranjang.map((item) => (
                            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-900 p-4 rounded-3xl border border-gray-700 items-center">
                                <div className="flex items-center gap-3">
                                    <img src={item.url_gambar || '/images/placeholder.png'} alt={item.nama} className="w-12 h-12 object-cover rounded" />
                                    <div>
                                        <p className="text-gray-300 text-sm">{item.nama}</p>
                                        <p className="text-gray-400 text-xs mt-1">Rp{Number(item.harga).toLocaleString('id-ID')} / unit</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => kurangQty(item.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600"
                                        >
                                            -
                                        </button>
                                        <span className="text-white font-semibold text-lg">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => tambahQty(item.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-gray-300 text-sm mt-3">Total: <span className="font-semibold text-white">Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span></p>
                                    <button
                                        type="button"
                                        onClick={() => hapusItem(item.id)}
                                        className="mt-3 text-xs text-red-400 hover:text-red-300"
                                    >
                                        Hapus Produk
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-inner">
                    <h2 className="text-2xl font-semibold text-teal-400 mb-4">Diskon</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">Diskon Otomatis (50% hari ke-3+)</label>
                            <button
                                type="button"
                                onClick={() => setDiskonOtomatisAktif(!diskonOtomatisAktif)}
                                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${diskonOtomatisAktif ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            >
                                {diskonOtomatisAktif ? 'Aktif' : 'Nonaktif'}
                            </button>
                        </div>
                        {diskonOtomatisAktif && hitungDurasiHari() >= 3 && (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-600">
                                <p className="text-sm text-yellow-300">Diskon Otomatis: -Rp{diskon.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        
                        <div className="border-t border-gray-600 pt-4 mt-4">
                            <label className="block text-sm text-gray-400 mb-2">Diskon Manual</label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setJenisDiskonManual('nominal')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${jenisDiskonManual === 'nominal' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                    Nominal (Rp)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJenisDiskonManual('persentase')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${jenisDiskonManual === 'persentase' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                    Persentase (%)
                                </button>
                            </div>
                            <input
                                type="number"
                                value={diskonManual}
                                onChange={(e) => setDiskonManual(Math.max(0, Number(e.target.value)))}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder={jenisDiskonManual === 'nominal' ? 'Masukkan nominal diskon' : 'Masukkan persentase diskon'}
                            />
                            {diskonManual > 0 && (
                                <div className="bg-gray-900 p-3 rounded-lg border border-gray-600 mt-2">
                                    <p className="text-sm text-red-300">
                                        Diskon Manual: -Rp{
                                            jenisDiskonManual === 'nominal' 
                                                ? diskonManual.toLocaleString('id-ID')
                                                : ((diskonManual / 100) * (hitungSubtotalPerMalam() * hitungDurasiHari() - diskon)).toLocaleString('id-ID')
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-inner">
                    <h2 className="text-2xl font-semibold text-teal-400 mb-4">Ringkasan Sewa</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-gray-300">
                            <div>Tanggal Ambil</div>
                            <div className="font-semibold text-gray-100">{formatDateFull(tanggalMulai)}</div>
                            <div>Tanggal Kembali</div>
                            <div className="font-semibold text-gray-100">{formatDateFull(tanggalSelesai)}</div>
                            <div>Subtotal / malam</div>
                            <div className="font-semibold text-gray-100">Rp{hitungSubtotalPerMalam().toLocaleString('id-ID')}</div>
                            <div>Durasi</div>
                            <div className="font-semibold text-gray-100">{hitungDurasiHari()} malam</div>
                            <div>Total (subtotal x durasi)</div>
                            <div className="font-semibold text-gray-100">Rp{(hitungSubtotalPerMalam() * hitungDurasiHari()).toLocaleString('id-ID')}</div>
                            <div>Diskon</div>
                            <div className="font-semibold text-red-300">
                                -Rp{(() => {
                                    const subtotal = hitungSubtotalPerMalam() * hitungDurasiHari();
                                    const manual = jenisDiskonManual === 'persentase' ? ((diskonManual / 100) * (subtotal - (diskonOtomatisAktif ? diskon : 0))) : diskonManual;
                                    const totalDiskon = (diskonOtomatisAktif ? diskon : 0) + (manual || 0);
                                    return totalDiskon.toLocaleString('id-ID');
                                })()}
                            </div>
                            <div>Grand Total</div>
                            <div className="font-semibold text-gray-100">Rp{hitungTotalAkhir().toLocaleString('id-ID')}</div>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-900 p-4 rounded-2xl border border-gray-700">
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('QRIS')}
                                className={`w-full p-3 rounded-xl text-left ${metodePembayaran === 'QRIS' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                QRIS
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('Transfer')}
                                className={`w-full p-3 rounded-xl text-left ${metodePembayaran === 'Transfer' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                TRANSFER
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('Cash')}
                                className={`w-full p-3 rounded-xl text-left ${metodePembayaran === 'Cash' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                CASH
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {isSaveDisabled && (
                        <div className="col-span-full text-sm text-yellow-300">
                            Lengkapi dahulu: {missingRequirements.join(' · ')}
                        </div>
                    )}
                    <button
                        onClick={handleSimpanPembayaran}
                        disabled={isSaveDisabled}
                        className={`${isSaveDisabled ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'} py-4 rounded-3xl font-bold transition-colors`}
                    >
                        SIMPAN TRANSAKSI
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-3xl font-bold transition-colors"
                    >
                        BATAL
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem('nuevanesia-checkout-data');
                            }
                            router.push('/');
                        }}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white py-4 rounded-3xl font-bold transition-colors"
                    >
                        HAPUS DATA & KEMBALI
                    </button>
                </div>
            </div>
        </div>
    );
}
