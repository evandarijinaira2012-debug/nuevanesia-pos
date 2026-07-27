import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../utils/supabaseClient'; 
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutPenjualan() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [keranjang, setKeranjang] = useState([]);
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [alamatPelanggan, setAlamatPelanggan] = useState('');
    const [noWhatsapp, setNoWhatsapp] = useState('');
    const [catatan, setCatatan] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');
    
    // State Pelanggan
    const [pelangganDitemukan, setPelangganDitemukan] = useState(false);
    const [pelangganBaru, setPelangganBaru] = useState(false);
    const [pencarianPelanggan, setPencarianPelanggan] = useState('');
    const [daftarPelanggan, setDaftarPelanggan] = useState([]);
    const [pelangganId, setPelangganId] = useState(null);
    const [showDropdownPelanggan, setShowDropdownPelanggan] = useState(false);
    
    // State Pembayaran
    const [statusPembayaran, setStatusPembayaran] = useState('Lunas');
    const [jumlahTerbayar, setJumlahTerbayar] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // SAKLAR BARU UNTUK LOADING

    const dropdownRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) router.push('/login');
        });
    }, [router]);

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
                    console.error('Gagal memuat data checkout', err);
                }
            }
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdownPelanggan(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (pencarianPelanggan.trim() === '') {
            setDaftarPelanggan([]);
            return;
        }
        const delayDebounce = setTimeout(async () => {
            const { data } = await supabase.from('pelanggan').select('*').ilike('nama', `%${pencarianPelanggan}%`).limit(5);
            if (data) setDaftarPelanggan(data);
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [pencarianPelanggan]);

    const handlePilihPelanggan = (p) => {
        setPelangganId(p.id);
        setNamaPelanggan(p.nama);
        setAlamatPelanggan(p.alamat || '');
        setNoWhatsapp(p.no_whatsapp || '');
        setPelangganDitemukan(true);
        setPelangganBaru(false);
        setShowDropdownPelanggan(false);
        setPencarianPelanggan('');
    };

    const handlePelangganBaru = () => {
        setPelangganId(null);
        setNamaPelanggan(pencarianPelanggan);
        setPelangganDitemukan(true);
        setPelangganBaru(true);
        setShowDropdownPelanggan(false);
    };

    const resetPelanggan = () => {
        setPelangganId(null);
        setNamaPelanggan('');
        setAlamatPelanggan('');
        setNoWhatsapp('');
        setPelangganDitemukan(false);
        setPelangganBaru(false);
        setPencarianPelanggan('');
    };

    const totalKotor = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const nominalDiskonManual = jenisDiskonManual === 'persen' ? (totalKotor * diskonManual) / 100 : Number(diskonManual) || 0;
    const totalBiayaAkhir = Math.max(0, totalKotor - nominalDiskonManual);

    const handleSimpanPembayaran = async () => {
        if (isSubmitting) return;    
        setIsSubmitting(true);
        try {
            let currentPelangganId = pelangganId;

            if (pelangganBaru) {
                const { data: newPelanggan, error: errPelanggan } = await supabase
                    .from('pelanggan')
                    .insert([{ nama: namaPelanggan, alamat: alamatPelanggan, no_whatsapp: noWhatsapp }])
                    .select()
                    .single();
                if (errPelanggan) throw new Error('Gagal simpan pelanggan: ' + errPelanggan.message);
                currentPelangganId = newPelanggan.id;
            }

            const finalJumlahTerbayar = statusPembayaran === 'Lunas' ? totalBiayaAkhir : (Number(jumlahTerbayar) || 0);

            // Simpan Transaksi 
            const { data: tx, error: errTx } = await supabase
                .from('transaksi')
                .insert([{
                    pelanggan_id: currentPelangganId,
                    jenis_transaksi: 'Penjualan', 
                    total_biaya: totalBiayaAkhir,
                    jenis_pembayaran: metodePembayaran,
                    catatan: catatan,
                    diskon_manual: diskonManual,
                    jenis_diskon_manual: jenisDiskonManual,
                    status_pembayaran: statusPembayaran,
                    jumlah_terbayar: finalJumlahTerbayar,
                    status_pengembalian: 'Selesai' // Langsung selesai
                }])
                .select()
                .single();

            if (errTx) throw new Error('Gagal buat transaksi: ' + errTx.message);

            // ===================================================================
            // 🔥 PERBAIKAN LOGIKA: Catat Pembayaran Penjualan ke Log Pembayaran
            // ===================================================================
            if (finalJumlahTerbayar > 0) {
                const { error: errLog } = await supabase
                    .from('log_pembayaran')
                    .insert([{
                        transaksi_id: tx.id,
                        nominal: finalJumlahTerbayar,
                        jenis_pembayaran: metodePembayaran,
                        tipe: statusPembayaran === 'Lunas' ? 'Lunas Langsung' : 'DP',
                        tanggal_bayar: new Date().toISOString() 
                    }]);

                if (errLog) throw new Error('Gagal mencatat riwayat uang masuk: ' + errLog.message);
            }
            // ===================================================================

            // Simpan Rincian
            const rincianInsert = keranjang.map(item => ({
                transaksi_id: tx.id,
                produk_id: item.id,
                nama_barang: item.nama,
                jumlah: item.qty,
                produk_variasi_id: item.produk_variasi_id || null, // PENTING: Untuk Variasi
                variasi_terpilih: item.variasi_terpilih || item.variasi || null, // <--- TAMBAHKAN INI
                harga_satuan: item.harga // <--- TAMBAHKAN INI
            }));
            await supabase.from('transaksi_detail').insert(rincianInsert);

            // Potong Stok secara akurat (Cek apakah barang itu punya variasi atau tidak)
            for (const item of keranjang) {
                if (item.produk_variasi_id) {
                    const { data: vData } = await supabase.from('produk_variasi').select('stok').eq('id', item.produk_variasi_id).single();
                    if (vData) {
                        await supabase.from('produk_variasi').update({ stok: Math.max(0, vData.stok - item.qty) }).eq('id', item.produk_variasi_id);
                    }
                } else {
                    const { data: pData } = await supabase.from('produk').select('stok').eq('id', item.id).single();
                    if (pData) {
                        await supabase.from('produk').update({ stok: Math.max(0, pData.stok - item.qty) }).eq('id', item.id);
                    }
                }
            }

            const dataUntukStruk = {
                transaksiData: {
                    jenis_transaksi: 'Penjualan',
                    tanggal_mulai: new Date().toLocaleDateString('id-ID'), 
                    total_biaya: totalBiayaAkhir,
                    status_pembayaran: statusPembayaran,
                    jumlah_terbayar: finalJumlahTerbayar,
                    jenis_pembayaran: metodePembayaran,
                    catatan: catatan
                },
                pelangganData: {
                    nama: namaPelanggan || 'Umum',
                    noWhatsapp: noWhatsapp,
                    alamat: alamatPelanggan
                },
                keranjang: keranjang
            };

            if (typeof window !== 'undefined') {
                window.localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(dataUntukStruk));
                window.open('/cetak-struk', '_blank'); // Buka Tab Print
                window.localStorage.removeItem('nuevanesia-checkout-data');
            }

            toast.success('Penjualan Berhasil!');
            router.push('/');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validasi tombol simpan
    const missingRequirements = [];
    if (!namaPelanggan) missingRequirements.push('Nama Pelanggan');
    if (statusPembayaran === 'DP' && jumlahTerbayar === '') missingRequirements.push('Nominal DP');
    const isSaveDisabled = missingRequirements.length > 0;

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans selection:bg-teal-500 selection:text-white">
            <Toaster position="top-center" />
            <Head><title>Checkout Penjualan - POS</title></Head>
            
            {/* Header Sederhana & Tegas */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">Checkout Penjualan</h1>
                <p className="text-gray-400 text-sm mt-2">Lengkapi data pembeli dan proses transaksi dengan cepat.</p>
            </div>

            {/* Perubahan Grid menjadi Rasio 60:40 (7:5) */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ============================================================== */}
                {/* KOLOM KIRI (60%): DATA PELANGGAN & RINCIAN BELANJA */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* 1. DATA PELANGGAN */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400 flex items-center">🛒 Pembeli (Penjualan)</h2>
                        {!pelangganDitemukan ? (
                            <div className="relative" ref={dropdownRef}>
                                <input type="text" value={pencarianPelanggan} onChange={(e) => { setPencarianPelanggan(e.target.value); setShowDropdownPelanggan(true); }} placeholder="Cari nama pelanggan..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow" />
                                {showDropdownPelanggan && pencarianPelanggan && (
                                    <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                        {daftarPelanggan.map(p => (
                                            <div key={p.id} onClick={() => handlePilihPelanggan(p)} className="p-4 hover:bg-teal-600/20 cursor-pointer border-b border-gray-700/50">
                                                <p className="font-bold text-white">{p.nama}</p>
                                            </div>
                                        ))}
                                        <div onClick={handlePelangganBaru} className="p-4 bg-gray-900 hover:bg-gray-700 cursor-pointer text-teal-400 font-semibold">
                                            ➕ Pembeli Baru: "{pencarianPelanggan}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-bold text-white">{namaPelanggan}</p>
                                    <p className="text-sm text-gray-400">{noWhatsapp || 'Tanpa No WA'}</p>
                                </div>
                                <button onClick={resetPelanggan} className="text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-xl transition-colors">Ganti</button>
                            </div>
                        )}
                        {pelangganBaru && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">NO WHATSAPP (OPSIONAL)</label>
                                    <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} placeholder="Contoh: 0812..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">ALAMAT (OPSIONAL)</label>
                                    <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} placeholder="Alamat lengkap..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. RINCIAN BELANJA (PINDAHAN DARI KANAN) */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400">📝 Rincian Barang</h2>
                        <div className="overflow-y-auto max-h-96 space-y-4 pr-2 mb-6">
                            {keranjang.map(item => (
                                <div key={item.cartItemId || item.id} className="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                                    <div>
                                        <p className="font-bold text-white text-base">{item.nama}</p>
                                        <p className="text-sm text-gray-400 mt-1">Rp{item.harga.toLocaleString('id-ID')} <span className="text-teal-500 font-bold mx-1">x</span> {item.qty}</p>
                                    </div>
                                    <p className="font-bold text-teal-400 text-lg">Rp{(item.harga * item.qty).toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>

                        {/* Catatan dipindah ke sini agar relevan dengan barang */}
                        <div className="border-t border-gray-700 pt-6">
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Catatan Transaksi</label>
                            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tulis catatan khusus (contoh: minta dibungkus kado, dll)..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* KOLOM KANAN (40%): SLIP PEMBAYARAN & TOTAL (STICKY) */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col sticky top-6">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 border-b border-gray-700 pb-4">Tagihan & Pembayaran</h2>
                    
                    {/* 1. RINGKASAN BIAYA */}
                    <div className="space-y-4 text-sm mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Subtotal Barang</span>
                            <span className="font-bold text-white text-base">Rp{totalKotor.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="pt-2 flex flex-col gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Potongan / Diskon Tambahan</span>
                            <div className="flex space-x-2">
                                <input type="number" value={diskonManual} onChange={(e) => setDiskonManual(e.target.value)} placeholder="0" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                <select value={jenisDiskonManual} onChange={(e) => setJenisDiskonManual(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl text-white px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                                    <option value="nominal">Rp</option>
                                    <option value="persen">%</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-700 pt-6 mt-4">
                            <span className="text-lg font-bold text-gray-300 uppercase">Total Akhir</span>
                            <span className="text-4xl font-black text-teal-400">Rp{totalBiayaAkhir.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* 2. METODE PEMBAYARAN (PINDAHAN DARI KIRI) */}
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 mb-8 mt-2">
                        <label className="block text-xs font-bold text-teal-400 mb-4 uppercase tracking-wider">Status Pembayaran</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => setStatusPembayaran('Lunas')} className={`p-3 rounded-xl font-bold transition-all ${statusPembayaran === 'Lunas' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>LUNAS</button>
                            <button onClick={() => setStatusPembayaran('DP')} className={`p-3 rounded-xl font-bold transition-all ${statusPembayaran === 'DP' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>DP / SEBAGIAN</button>
                        </div>
                        
                        {statusPembayaran === 'DP' && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Nominal DP yang dibayar (Rp)</label>
                                <input type="number" value={jumlahTerbayar} onChange={(e) => setJumlahTerbayar(e.target.value)} placeholder="Contoh: 50000" className="w-full p-4 bg-gray-800 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        )}
                        
                        <label className="block text-xs font-bold text-teal-400 mb-4 mt-6 uppercase tracking-wider">Metode Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Tombol QRIS - BIRU */}
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('QRIS')}
                                className={`p-3 rounded-xl font-bold text-sm transition-all border ${
                                    metodePembayaran === 'QRIS'
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-blue-400'
                                }`}
                            >
                                QRIS
                            </button>

                            {/* Tombol CASH - HIJAU */}
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('Cash')}
                                className={`p-3 rounded-xl font-bold text-sm transition-all border ${
                                    metodePembayaran === 'Cash'
                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-emerald-400'
                                }`}
                            >
                                CASH
                            </button>

                            {/* Tombol TRANSFER - ORANYE */}
                            <button
                                type="button"
                                onClick={() => setMetodePembayaran('Transfer Bank')}
                                className={`p-3 rounded-xl font-bold text-sm transition-all border ${
                                    metodePembayaran === 'Transfer Bank'
                                        ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-orange-400'
                                }`}
                            >
                                TRANSFER
                            </button>
                        </div>
                    </div>

                    {/* 3. TOMBOL EKSEKUSI UTAMA */}
                    <div className="mt-auto">
                        {isSaveDisabled && <div className="text-xs text-yellow-500 mb-3 text-center bg-yellow-500/10 p-2 rounded-lg">⚠️ Lengkapi: {missingRequirements.join(', ')}</div>}
                        <button 
                            onClick={handleSimpanPembayaran} 
                            disabled={isSaveDisabled || isSubmitting} 
                            className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-lg tracking-wide uppercase shadow-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-80 transition-all duration-300 transform active:scale-[0.98]"
                        >
                            {isSubmitting ? 'MEMPROSES...' : 'SIMPAN PENJUALAN'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}