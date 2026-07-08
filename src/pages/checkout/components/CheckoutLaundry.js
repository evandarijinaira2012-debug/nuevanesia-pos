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

    const [metodePembayaran, setMetodePembayaran] = useState('Cash');
    const [diskonManual, setDiskonManual] = useState(0);
    const [jenisDiskonManual, setJenisDiskonManual] = useState('nominal');
    
    // State Pembayaran
    const [statusPembayaran, setStatusPembayaran] = useState('Lunas');
    const [jumlahTerbayar, setJumlahTerbayar] = useState('');

    // Cek Sesi Autentikasi
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) router.push('/login');
        });
    }, [router]);

    // Ambil Keranjang
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
            // Asumsi nomor WA minimal 10 digit untuk valid
            if (noWhatsapp.length >= 10) {
                setIsSearchingWA(true);
                
                const { data, error } = await supabase
                    .from('pelanggan')
                    .select('*')
                    .eq('no_whatsapp', noWhatsapp)
                    .maybeSingle(); // Cari data tunggal, tidak error jika kosong

                if (data) {
                    // Pelanggan Lama Ditemukan
                    setPelangganId(data.id);
                    setNamaPelanggan(data.nama || '');
                    setAlamatPelanggan(data.alamat || '');
                } else {
                    // Pelanggan Baru (Tidak mereset nama/alamat agar ketikan user tidak hilang)
                    setPelangganId(null);
                }
                
                setIsSearchingWA(false);
            } else {
                setPelangganId(null);
            }
        };

        // Gunakan Debounce agar tidak query ke DB tiap 1 huruf diketik
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
        try {
            let currentPelangganId = pelangganId;

            // Jika pelanggan belum ada di database, Insert pelanggan baru
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

            // Simpan Transaksi (Dengan Tanggal Selesai/Estimasi)
            const { data: tx, error: errTx } = await supabase
                .from('transaksi')
                .insert([{
                    pelanggan_id: currentPelangganId,
                    jenis_transaksi: 'Laundry', // Penanda nota Laundry
                    tanggal_mulai: tanggalMulai, // Tanggal Masuk
                    tanggal_selesai: tanggalSelesai, // Estimasi Diambil
                    total_biaya: totalBiayaAkhir,
                    jenis_pembayaran: metodePembayaran,
                    catatan: catatan,
                    diskon_manual: diskonManual,
                    jenis_diskon_manual: jenisDiskonManual,
                    status_pembayaran: statusPembayaran,
                    jumlah_terbayar: statusPembayaran === 'Lunas' ? totalBiayaAkhir : (Number(jumlahTerbayar) || 0),
                    status_pengembalian: 'Diproses' // Menandakan cucian masih dikerjakan
                }])
                .select()
                .single();

            if (errTx) throw new Error('Gagal buat transaksi: ' + errTx.message);

            const rincianInsert = keranjang.map(item => ({
                transaksi_id: tx.id,
                produk_id: item.id,
                nama_barang: item.nama,
                jumlah: item.qty
            }));

            await supabase.from('transaksi_detail').insert(rincianInsert);

            toast.success('Nota Laundry Berhasil Dibuat!');
            window.localStorage.removeItem('nuevanesia-checkout-data');
            router.push('/');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const missingRequirements = [];
    if (!noWhatsapp) missingRequirements.push('No. WhatsApp');
    if (!namaPelanggan) missingRequirements.push('Nama Pelanggan');
    if (!tanggalSelesai) missingRequirements.push('Estimasi Selesai');
    if (statusPembayaran === 'DP' && !jumlahTerbayar) missingRequirements.push('Nominal DP');
    
    const isSaveDisabled = missingRequirements.length > 0;

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            <Toaster position="top-center" />
            <Head><title>Checkout Laundry - POS</title></Head>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* KOLOM KIRI */}
                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">🧼 Data Pelanggan</h2>
                        
                        <div className="space-y-4">
                            {/* Input Nomor WA diletakkan paling atas untuk trigger awal */}
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-1">NO. WHATSAPP (WAJIB)</label>
                                <input 
                                    type="number" 
                                    value={noWhatsapp} 
                                    onChange={(e) => setNoWhatsapp(e.target.value)} 
                                    placeholder="Contoh: 08123456789" 
                                    className="w-full p-4 bg-gray-900 border-2 border-teal-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                                />
                                {isSearchingWA && <p className="text-xs text-gray-400 mt-1">Mencari data...</p>}
                                {!isSearchingWA && noWhatsapp.length >= 10 && !pelangganId && (
                                    <p className="text-xs text-yellow-500 mt-1">Belum terdaftar. Akan dicatat sebagai pelanggan baru.</p>
                                )}
                                {!isSearchingWA && pelangganId && (
                                    <p className="text-xs text-green-400 mt-1">✓ Pelanggan Ditemukan!</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-teal-400 mb-1">NAMA PELANGGAN (WAJIB)</label>
                                    <input 
                                        type="text" 
                                        value={namaPelanggan} 
                                        onChange={(e) => setNamaPelanggan(e.target.value)} 
                                        placeholder="Nama lengkap..." 
                                        className={`w-full p-3 bg-gray-900 border ${pelangganId ? 'border-green-600/50' : 'border-gray-700'} rounded-xl text-white text-sm focus:border-teal-500 outline-none`} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1">ALAMAT (OPSIONAL)</label>
                                    <input 
                                        type="text" 
                                        value={alamatPelanggan} 
                                        onChange={(e) => setAlamatPelanggan(e.target.value)} 
                                        placeholder="Alamat lengkap..." 
                                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estimasi Pengerjaan & Pembayaran tetap sama */}
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-teal-400">📅 Estimasi Pengerjaan</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">TANGGAL MASUK</label>
                                <input type="date" value={tanggalMulai} disabled className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-teal-400 mb-2">ESTIMASI SELESAI (WAJIB)</label>
                                <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full p-3 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-teal-400">💳 Pembayaran</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => setStatusPembayaran('Lunas')} className={`p-3 rounded-xl font-bold ${statusPembayaran === 'Lunas' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'}`}>LUNAS</button>
                            <button onClick={() => setStatusPembayaran('DP')} className={`p-3 rounded-xl font-bold ${statusPembayaran === 'DP' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'}`}>BELUM LUNAS / DP</button>
                        </div>
                        {statusPembayaran === 'DP' && (
                            <input type="number" value={jumlahTerbayar} onChange={(e) => setJumlahTerbayar(e.target.value)} placeholder="Nominal DP yang dibayar..." className="w-full p-3 mb-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white" />
                        )}
                        <select value={metodePembayaran} onChange={(e) => setMetodePembayaran(e.target.value)} className="w-full p-3 mb-4 bg-gray-900 border border-gray-700 rounded-xl text-white">
                            <option value="Cash">Tunai / Cash</option>
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="QRIS">QRIS</option>
                        </select>
                        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan kondisi barang saat diterima (misal: ada sobek di ujung tas)..." className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white h-20 resize-none" />
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl flex flex-col h-fit">
                    <h2 className="text-xl font-bold mb-4 text-teal-400">📝 Rincian Cucian</h2>
                    <div className="flex-grow overflow-y-auto max-h-64 space-y-3 pr-1 border-b border-gray-700/50 pb-4">
                        {keranjang.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <p className="font-semibold text-white">{item.nama}</p>
                                    <p className="text-xs text-gray-400">Rp{item.harga.toLocaleString('id-ID')} x {item.qty}</p>
                                </div>
                                <p className="font-bold text-teal-400">Rp{(item.harga * item.qty).toLocaleString('id-ID')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Subtotal Biaya:</span><span className="font-bold text-white">Rp{totalKotor.toLocaleString('id-ID')}</span></div>
                        <div className="pt-2 flex flex-col gap-2">
                            <span className="text-gray-400 text-xs">Potongan / Diskon Tambahan:</span>
                            <div className="flex space-x-2">
                                <input type="number" value={diskonManual} onChange={(e) => setDiskonManual(e.target.value)} placeholder="0" className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                                <select value={jenisDiskonManual} onChange={(e) => setJenisDiskonManual(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg text-white px-2">
                                    <option value="nominal">Rp</option><option value="persen">%</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-700 pt-4 mt-2">
                            <span className="text-lg font-bold text-white uppercase">Total Tagihan:</span>
                            <span className="text-3xl font-black text-teal-400">Rp{totalBiayaAkhir.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="mt-6">
                        {isSaveDisabled && <div className="text-xs text-yellow-500 mb-2">⚠️ Lengkapi: {missingRequirements.join(', ')}</div>}
                        <button onClick={handleSimpanPembayaran} disabled={isSaveDisabled} className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold disabled:bg-gray-700 disabled:text-gray-400 transition-all">SIMPAN NOTA LAUNDRY</button>
                    </div>
                </div>

            </div>
        </div>
    );
}