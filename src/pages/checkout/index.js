import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Ambil komponen sesuai dengan nama file fisik Anda (menggunakan spasi)
import CheckoutSewa from './components/CheckoutSewa';
import CheckoutPenjualan from './components/CheckoutPenjualan';
import CheckoutLaundry from './components/CheckoutLaundry';

export default function CheckoutRouter() {
    const router = useRouter();
    const [jenisTransaksi, setJenisTransaksi] = useState(null);
    const [pesanStatus, setPesanStatus] = useState('Sedang memuat data transaksi...');

    useEffect(() => {
        // 1. Cek apakah localStorage tersedia
        const savedData = window.localStorage.getItem('nuevanesia-checkout-data');
        console.log("[Router] Data dari localStorage:", savedData);
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Kita cek tipe transaksi, jika tidak ada kita default ke 'Sewa'
                const tipe = parsed.jenisTransaksi || parsed.jenis_transaksi || 'Sewa';
                console.log("[Router] Jenis transaksi terdeteksi:", tipe);
                setJenisTransaksi(tipe);
            } catch (error) {
                console.error("[Router] Gagal mencerna JSON:", error);
                setPesanStatus('Gagal membaca data belanja. Mengalihkan ke beranda...');
                setTimeout(() => router.replace('/'), 2000);
            }
        } else {
            console.warn("[Router] Tidak ada data keranjang di localStorage!");
            setPesanStatus('Keranjang belanja kosong. Mengalihkan ke beranda...');
            setTimeout(() => router.replace('/'), 2000);
        }
    }, [router]);

    // Jika jenis transaksi belum ditentukan, tampilkan status (tidak blank lagi)
    if (!jenisTransaksi) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center font-sans text-sm tracking-wide">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p>{pesanStatus}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Checkout {jenisTransaksi} - Nuevanesia POS</title>
            </Head>

            {/* LOGIKA PEMANGGILAN MODUL */}
            {jenisTransaksi === 'Sewa' && <CheckoutSewa />}
            {jenisTransaksi === 'Penjualan' && <CheckoutPenjualan />}
            {jenisTransaksi === 'Laundry' && <CheckoutLaundry />}
            
            {/* Antisipasi jika tipe data di luar Sewa & Penjualan */}
            {jenisTransaksi !== 'Sewa' && jenisTransaksi !== 'Penjualan' && (
                <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
                    <h1 className="text-xl font-bold text-red-500 mb-2">⚠️ Modul Tidak Dikenali</h1>
                    <p className="text-gray-400 text-sm mb-4">Tipe transaksi "{jenisTransaksi}" belum aktif atau salah ketik.</p>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-800 border border-gray-700 text-sm rounded-xl hover:bg-gray-700 transition-colors">
                        Kembali ke Beranda
                    </button>
                </div>
            )}
        </>
    );
}