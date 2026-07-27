// Nama File: CheckoutLaundry.js
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient'; 
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutLaundry() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [keranjang, setKeranjang] = useState([]);
    
    // State Pelanggan Baru (Prioritas WhatsApp)
    const [noWhatsapp, setNoWhatsapp] = useState('');
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [alamatPelanggan, setAlamatPelanggan] = useState('');
    const [pelangganId, setPelangganId] = useState(null);
    const [isSearchingWA, setIsSearchingWA] = useState(false);

    const [catatan, setCatatan] = useState('');
    
    // Khusus Laundry: Tanggal Masuk (Hari ini) & Estimasi Selesai
    const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
    const [tanggalSelesai, setTanggalSelesai] = useState(''); 

    const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');
    
    const [statusPembayaran, setStatusPembayaran] = useState('Lunas');
    const [jumlahTerbayar, setJumlahTerbayar] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // --- LOGIKA PENCARIAN WHATSAPP OTOMATIS ---
    useEffect(() => {
        const checkWhatsapp = async () => {
            if (noWhatsapp.length >= 10) {
                setIsSearchingWA(true);
                
                const { data, error } = await supabase
                    .from('pelanggan')
                    .select('*')
                    .eq('no_whatsapp', noWhatsapp)
                    .maybeSingle(); 

                if (data) {
                    setPelangganId(data.id);
                    setNamaPelanggan(data.nama || '');
                    setAlamatPelanggan(data.alamat || '');
                } else {
                    setPelangganId(null);
                }
                
                setIsSearchingWA(false);
            } else {
                setPelangganId(null);
            }
        };

        const delayDebounce = setTimeout(() => {
            checkWhatsapp();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [noWhatsapp]);

    // --- PERHITUNGAN KHUSUS LAUNDRY ---
    const totalKotor = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const nominalDiskonManual = jenisDiskonManual === 'persen' ? (totalKotor * diskonManual) / 100 : Number(diskonManual) || 0;
    const totalBiayaAkhir = Math.max(0, totalKotor - nominalDiskonManual);

    const handleSimpanPembayaran = async () => {
        // CEGAH KLIK GANDA
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let currentPelangganId = pelangganId;

            if (!currentPelangganId) {
                const { data: newPelanggan, error: errPelanggan } = await supabase
                    .from('pelanggan')
                    .insert([{ 
                        nama: namaPelanggan, 
                        alamat: alamatPelanggan, 
                        no_whatsapp: noWhatsapp 
                    }])
                    .select()
                    .single();
                
                if (errPelanggan) throw new Error('Gagal simpan pelanggan: ' + errPelanggan.message);
                currentPelangganId = newPelanggan.id;
            }

            // LOGIKA PEMBAYARAN DIPERBARUI
            let finalJumlahTerbayar = 0;
            let finalStatusPembayaran = 'Belum Lunas';

            if (statusPembayaran === 'Lunas') {
                finalJumlahTerbayar = totalBiayaAkhir;
                finalStatusPembayaran = 'Lunas';
            } else if (statusPembayaran === 'DP') {
                finalJumlahTerbayar = Number(jumlahTerbayar) || 0;
                finalStatusPembayaran = 'DP';
            } else if (statusPembayaran === 'Bayar Nanti') {
                finalJumlahTerbayar = 0;
                finalStatusPembayaran = 'Belum Lunas';
            }
            
            // ... (KODE SEBELUMNYA: Proses insert ke tabel transaksi)
            const { data: tx, error: errTx } = await supabase
                .from('transaksi')
                .insert([{
                    pelanggan_id: currentPelangganId,
                    jenis_transaksi: 'Laundry',
                    tanggal_mulai: tanggalMulai,
                    tanggal_selesai: tanggalSelesai,
                    total_biaya: totalBiayaAkhir,
                    jenis_pembayaran: metodePembayaran,
                    catatan: catatan,
                    diskon_manual: diskonManual,
                    jenis_diskon_manual: jenisDiskonManual,
                    status_pembayaran: finalStatusPembayaran,
                    jumlah_terbayar: finalJumlahTerbayar,
                    status_pengembalian: 'Proses Cuci'
                }])
                .select()
                .single();

            if (errTx) throw new Error('Gagal buat transaksi: ' + errTx.message);

            // ===================================================================
            // 🔥 PERBAIKAN LOGIKA: Catat Pembayaran Awal (DP/Lunas) ke Log Pembayaran
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

                if (errLog) throw new Error('Gagal mencatat riwayat uang masuk awal: ' + errLog.message);
            }
            // ===================================================================

            // ... (KODE SELANJUTNYA: Proses insert ke tabel transaksi_detail)
            const rincianInsert = keranjang.map(item => ({
                transaksi_id: tx.id,
                produk_id: item.id,
                nama_barang: item.nama,
                jumlah: item.qty,
                produk_variasi_id: item.produk_variasi_id || null,
                variasi_terpilih: item.variasi_terpilih || item.variasi || null, // <--- TAMBAHKAN INI
                harga_satuan: item.harga // <--- TAMBAHKAN INI
            }));

            await supabase.from('transaksi_detail').insert(rincianInsert);

            const dataUntukStruk = {
                transaksiData: {
                    jenis_transaksi: 'Laundry',
                    tanggal_mulai: tanggalMulai,
                    tanggal_selesai: tanggalSelesai,
                    total_biaya: totalBiayaAkhir,
                    status_pembayaran: finalStatusPembayaran,
                    jumlah_terbayar: finalJumlahTerbayar,
                    jenis_pembayaran: metodePembayaran,
                    catatan: catatan
                },
                pelangganData: {
                    nama: namaPelanggan,
                    noWhatsapp: noWhatsapp,
                    alamat: alamatPelanggan
                },
                keranjang: keranjang
            };

            if (typeof window !== 'undefined') {
                window.localStorage.setItem('transaksiDataUntukStruk', JSON.stringify(dataUntukStruk));
                window.open('/cetak-struk', '_blank');
                window.localStorage.removeItem('nuevanesia-checkout-data');
            }

            toast.success('Nota Laundry Berhasil Dibuat!');
            router.push('/');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // LOGIKA VALIDASI DIPERBARUI
    const missingRequirements = [];
    if (!noWhatsapp) missingRequirements.push('No. WhatsApp');
    if (!namaPelanggan) missingRequirements.push('Nama Pelanggan');
    if (!tanggalSelesai) missingRequirements.push('Estimasi Selesai');
    // Hanya minta nominal jika memilih DP
    if (statusPembayaran === 'DP' && (!jumlahTerbayar || jumlahTerbayar <= 0)) missingRequirements.push('Nominal DP');
    
    const isSaveDisabled = missingRequirements.length > 0;

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans selection:bg-teal-500 selection:text-white">
            <Toaster position="top-center" />
            <Head><title>Checkout Laundry - POS</title></Head>
            
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">Checkout Laundry</h1>
                <p className="text-gray-400 text-sm mt-2">Lengkapi data pelanggan, estimasi selesai, dan proses nota laundry.</p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ============================================================== */}
                {/* KOLOM KIRI (60%): DATA PELANGGAN, ESTIMASI & RINCIAN */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* 1. DATA PELANGGAN (Prioritas WA) */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400 flex items-center">👤 Data Pelanggan</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">NO. WHATSAPP (WAJIB)</label>
                                <input 
                                    type="number" 
                                    value={noWhatsapp} 
                                    onChange={(e) => setNoWhatsapp(e.target.value)} 
                                    placeholder="Contoh: 08123456789" 
                                    className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                                />
                                {isSearchingWA && <p className="text-xs text-gray-400 mt-2">Mencari data...</p>}
                                {!isSearchingWA && noWhatsapp.length >= 10 && !pelangganId && (
                                    <p className="text-xs text-yellow-500 mt-2 font-medium">⚠️ Belum terdaftar. Akan dicatat sebagai pelanggan baru.</p>
                                )}
                                {!isSearchingWA && pelangganId && (
                                    <p className="text-xs text-green-400 mt-2 font-bold">✓ Pelanggan Ditemukan!</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">NAMA PELANGGAN (WAJIB)</label>
                                    <input 
                                        type="text" 
                                        value={namaPelanggan} 
                                        onChange={(e) => setNamaPelanggan(e.target.value)} 
                                        placeholder="Nama lengkap..." 
                                        className={`w-full p-4 bg-gray-900 border-2 ${pelangganId ? 'border-green-600/50' : 'border-gray-700'} rounded-xl text-white focus:outline-none focus:border-teal-500 transition-all`} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">ALAMAT (OPSIONAL)</label>
                                    <input 
                                        type="text" 
                                        value={alamatPelanggan} 
                                        onChange={(e) => setAlamatPelanggan(e.target.value)} 
                                        placeholder="Alamat lengkap..." 
                                        className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. ESTIMASI PENGERJAAN */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400">📅 Estimasi Pengerjaan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">TANGGAL MASUK</label>
                                <input type="date" value={tanggalMulai} disabled className="w-full p-4 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">ESTIMASI SELESAI (WAJIB)</label>
                                <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>
                    </div>

                    {/* 3. RINCIAN CUCIAN & CATATAN */}
                    <div className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-teal-400">📝 Rincian Cucian</h2>
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

                        <div className="border-t border-gray-700 pt-6">
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Catatan Cucian</label>
                            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catat detail barang: Jenis Barang, Merk, Seri, Kapasitas, Warna..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* KOLOM KANAN (40%): SLIP PEMBAYARAN & TOTAL (STICKY) */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col sticky top-6">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 border-b border-gray-700 pb-4">Tagihan Laundry</h2>
                    
                    {/* 1. RINGKASAN BIAYA */}
                    <div className="space-y-4 text-sm mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Subtotal Biaya</span>
                            <span className="font-bold text-white text-base">Rp{totalKotor.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="pt-2 flex flex-col gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Potongan / Diskon</span>
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

                    {/* 2. STATUS & METODE PEMBAYARAN */}
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 mb-8 mt-2">
                        <label className="block text-xs font-bold text-teal-400 mb-4 uppercase tracking-wider">Status Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <button onClick={() => setStatusPembayaran('Lunas')} className={`p-2 rounded-xl text-sm font-bold transition-all border ${statusPembayaran === 'Lunas' ? 'bg-teal-600 text-white border-teal-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>LUNAS</button>
                            <button onClick={() => setStatusPembayaran('DP')} className={`p-2 rounded-xl text-sm font-bold transition-all border ${statusPembayaran === 'DP' ? 'bg-teal-600 text-white border-teal-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>DP</button>
                            <button onClick={() => setStatusPembayaran('Bayar Nanti')} className={`p-2 rounded-xl text-sm font-bold transition-all border ${statusPembayaran === 'Bayar Nanti' ? 'bg-yellow-600 text-white border-yellow-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>NANTI</button>
                        </div>
                        
                        {statusPembayaran === 'DP' && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Nominal DP (Rp)</label>
                                <input type="number" value={jumlahTerbayar} onChange={(e) => setJumlahTerbayar(e.target.value)} placeholder="Contoh: 15000" className="w-full p-4 bg-gray-800 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        )}
                        
                        {/* Jika Bayar Nanti, tombol metode pembayaran disembunyikan */}
                        {statusPembayaran !== 'Bayar Nanti' && (
                            <>
                                <label className="block text-xs font-bold text-teal-400 mb-4 mt-6 uppercase tracking-wider">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Tombol QRIS - BIRU */}
                                    <button type="button" onClick={() => setMetodePembayaran('QRIS')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'QRIS' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-blue-400'}`}>QRIS</button>
                                    
                                    {/* Tombol CASH - HIJAU */}
                                    <button type="button" onClick={() => setMetodePembayaran('Cash')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'Cash' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-emerald-400'}`}>CASH</button>
                                    
                                    {/* Tombol TRANSFER - ORANYE */}
                                    <button type="button" onClick={() => setMetodePembayaran('Transfer Bank')} className={`p-3 rounded-xl font-bold text-sm transition-all border ${metodePembayaran === 'Transfer Bank' ? 'bg-orange-600 text-white border-orange-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-orange-400'}`}>TRANSFER</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 3. TOMBOL EKSEKUSI UTAMA */}
                    <div className="mt-auto">
                        {isSaveDisabled && <div className="text-xs text-yellow-500 mb-3 text-center bg-yellow-500/10 p-2 rounded-lg">⚠️ Lengkapi: {missingRequirements.join(', ')}</div>}
                        <button 
                            onClick={handleSimpanPembayaran} 
                            disabled={isSaveDisabled || isSubmitting} 
                            className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-lg tracking-wide uppercase shadow-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-80 transition-all duration-300 transform active:scale-[0.98]"
                        >
                            {isSubmitting ? 'MEMPROSES...' : 'SIMPAN NOTA LAUNDRY'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}