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
    const [metodePembayaran, setMetodePembayaran] = useState('Cash');
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

    // ... [Logika Pencarian Pelanggan Sama Seperti Sewa] ...
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

    // --- PERHITUNGAN KHUSUS PENJUALAN ---
    const totalKotor = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const nominalDiskonManual = jenisDiskonManual === 'persen' ? (totalKotor * diskonManual) / 100 : Number(diskonManual) || 0;
    const totalBiayaAkhir = Math.max(0, totalKotor - nominalDiskonManual);

    const handleSimpanPembayaran = async () => {
        try {
            let currentPelangganId = pelangganId;

            // Jika form diisi pelanggan baru
            if (pelangganBaru) {
                const { data: newPelanggan, error: errPelanggan } = await supabase
                    .from('pelanggan')
                    .insert([{ nama: namaPelanggan, alamat: alamatPelanggan, no_whatsapp: noWhatsapp }])
                    .select()
                    .single();
                if (errPelanggan) throw new Error('Gagal simpan pelanggan: ' + errPelanggan.message);
                currentPelangganId = newPelanggan.id;
            }

            // --- BUAT TANGGAL OTOMATIS HARI INI ---
            const tanggalHariIni = new Date().toISOString();

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
                    jumlah_terbayar: statusPembayaran === 'Lunas' ? totalBiayaAkhir : (Number(jumlahTerbayar) || 0),
                    status_pengembalian: 'Selesai',
                    
                    // Inject tanggal otomatis agar Supabase tidak error
                    tanggal_mulai: tanggalHariIni,
                    tanggal_kembali: tanggalHariIni 
                }])
                .select()
                .single();

            if (errTx) throw new Error('Gagal buat transaksi: ' + errTx.message);

            // Simpan Rincian
            const rincianInsert = keranjang.map(item => ({
                transaksi_id: tx.id,
                produk_id: item.id,
                nama_barang: item.nama,
                jumlah: item.qty
            }));

            await supabase.from('transaksi_detail').insert(rincianInsert);

            // Potong Stok
            for (const item of keranjang) {
                const { data: pData } = await supabase.from('produk').select('stok').eq('id', item.id).single();
                if (pData) {
                    await supabase.from('produk').update({ stok: Math.max(0, pData.stok - item.qty) }).eq('id', item.id);
                }
            }

            toast.success('Penjualan Berhasil!');
            window.localStorage.removeItem('nuevanesia-checkout-data');
            router.push('/');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Validasi tombol simpan
    const missingRequirements = [];
    if (!namaPelanggan) missingRequirements.push('Nama Pelanggan');
    if (statusPembayaran === 'DP' && jumlahTerbayar === '') missingRequirements.push('Nominal DP');
    const isSaveDisabled = missingRequirements.length > 0;

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            <Toaster position="top-center" />
            <Head><title>Checkout Penjualan - POS</title></Head>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* KOLOM KIRI: DATA PELANGGAN */}
                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">🛒 Pembeli (Penjualan)</h2>
                        {!pelangganDitemukan ? (
                            <div className="relative" ref={dropdownRef}>
                                <input type="text" value={pencarianPelanggan} onChange={(e) => { setPencarianPelanggan(e.target.value); setShowDropdownPelanggan(true); }} placeholder="Cari nama pelanggan..." className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
                                <button onClick={resetPelanggan} className="text-xs text-red-400 bg-red-500/10 px-4 py-2 rounded-xl">Ganti</button>
                            </div>
                        )}
                        {pelangganBaru && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} placeholder="No Whatsapp (Opsional)" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm" />
                                <input type="text" value={alamatPelanggan} onChange={(e) => setAlamatPelanggan(e.target.value)} placeholder="Alamat (Opsional)" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm" />
                            </div>
                        )}
                    </div>
                    
                    {/* Status Pembayaran & Catatan */}
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-teal-400">💳 Pembayaran</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => setStatusPembayaran('Lunas')} className={`p-3 rounded-xl font-bold ${statusPembayaran === 'Lunas' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'}`}>LUNAS</button>
                            <button onClick={() => setStatusPembayaran('DP')} className={`p-3 rounded-xl font-bold ${statusPembayaran === 'DP' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'}`}>DP / SEBAGIAN</button>
                        </div>
                        {statusPembayaran === 'DP' && (
                            <input type="number" value={jumlahTerbayar} onChange={(e) => setJumlahTerbayar(e.target.value)} placeholder="Nominal yang dibayar saat ini..." className="w-full p-3 mb-4 bg-gray-900 border-2 border-teal-600/50 rounded-xl text-white" />
                        )}
                        <select value={metodePembayaran} onChange={(e) => setMetodePembayaran(e.target.value)} className="w-full p-3 mb-4 bg-gray-900 border border-gray-700 rounded-xl text-white">
                            <option value="Cash">Tunai / Cash</option>
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="QRIS">QRIS</option>
                        </select>
                        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan transaksi..." className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white h-20 resize-none" />
                    </div>
                </div>

                {/* KOLOM KANAN: RINCIAN & TOTAL */}
                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-teal-400">📝 Rincian Belanja</h2>
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
                        <div className="flex justify-between"><span className="text-gray-400">Subtotal Barang:</span><span className="font-bold text-white">Rp{totalKotor.toLocaleString('id-ID')}</span></div>
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
                            <span className="text-lg font-bold text-white uppercase">Total Akhir:</span>
                            <span className="text-3xl font-black text-teal-400">Rp{totalBiayaAkhir.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="mt-6">
                        {isSaveDisabled && <div className="text-xs text-yellow-500 mb-2">⚠️ Lengkapi: {missingRequirements.join(', ')}</div>}
                        <button onClick={handleSimpanPembayaran} disabled={isSaveDisabled} className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold disabled:bg-gray-700 disabled:text-gray-400 transition-all">SIMPAN PENJUALAN</button>
                    </div>
                </div>

            </div>
        </div>
    );
}