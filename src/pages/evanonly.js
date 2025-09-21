import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';
import Link from 'next/link';

// START - PERUBAHAN: Import library Chart.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// END - PERUBAHAN

// START - PERUBAHAN: Registrasi komponen Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);
// END - PERUBAHAN

// Komponen Ikon LAMA
const IconExport = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);
const IconSort = () => (
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7l4-4m0 0l4 4m-4-4v12"></path></svg>
);
const IconSuperadmin = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinecap="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.82 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.82 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.82-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.82-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);
const IconManajemenProduk = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m-8 4h16"></path></svg>
);
const IconPengeluaran = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
);
const IconChevronDown = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);
const IconChevronUp = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
);
const IconRevenue = () => <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
const IconExpense = () => <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>;
const IconProfit = () => <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg>;


// TransactionModal Component (Tidak ada perubahan)
const TransactionModal = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction) return null;
    const formatRupiah = (angka) => `Rp${(angka || 0).toLocaleString('id-ID')}`;
    const handlePrint = () => {
        const printContent = `
            <style>
            @page { size: 80mm 100%; margin: 0; }
            body { font-family: 'monospace'; font-size: 12px; padding: 10px; color: black; line-height: 1.5; }
            .header, .footer, .divider { text-align: center; margin-bottom: 10px; }
            .divider { border-bottom: 1px dashed black; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 2px 0; }
            .text-right { text-align: right; }
            h3 { font-size: 16px; font-weight: bold; margin: 5px 0; }
            </style>
            <body>
            <div class="header">
                <h3>Nuevanesia</h3>
                <p>Komp. Sarijadi Blok 4 No 114 Bandung</p>
                <p>WhatsApp: 08180.208.9909</p>
            </div>
            <div class="divider"></div>
            <p><strong>ID Transaksi:</strong> ${transaction.id}</p>
            <p><strong>Pelanggan:</strong> ${transaction.pelanggan?.nama || 'N/A'}</p>
            <p><strong>Whatsapp:</strong> ${transaction.pelanggan?.no_whatsapp || 'N/A'}</p>
            <p><strong>Tanggal Mulai Sewa:</strong> ${moment(transaction.tanggal_mulai).format('dddd, DD MMMM YYYY')}</p>
            <p><strong>Tanggal Selesai Sewa:</strong> ${moment(transaction.tanggal_selesai).format('dddd, DD MMMM YYYY')}</p>
            <p><strong>Durasi Sewa:</strong> ${transaction.durasi_hari} malam</p>
            <p><strong>Metode Pembayaran:</strong> ${transaction.jenis_pembayaran}</p>
            <div class="divider"></div>
            <table>
                <thead>
                <tr>
                    <th>Barang</th>
                    <th class="text-right">Harga</th>
                </tr>
                </thead>
                <tbody>
                ${transaction.transaksi_detail.map(item => `
                    <tr>
                    <td>${item.nama_barang} (${item.jumlah})</td>
                    <td class="text-right">${formatRupiah(item.jumlah * item.produk?.harga)}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
            <div class="divider"></div>
            <p style="font-size: 14px; text-align: right;"><strong>Subtotal: ${formatRupiah(transaction.total_biaya / transaction.durasi_hari)}</strong></p>
            <p style="font-size: 18px; text-align: right; margin-top: 5px;"><strong>Total Biaya: ${formatRupiah(transaction.total_biaya)}</strong></p>
            <div class="divider"></div>
            <div class="footer">
                <p>Terima kasih telah menyewa!</p>
                <p>Barang yang disewa harus dikembalikan dalam kondisi baik.</p>
            </div>
            </body>
        `;
        const printWindow = window.open('', '_blank', 'width=300,height=400');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } else {
            alert('Pop-up window blocked. Please allow pop-ups for this site to print.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 print:bg-white print:text-black">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto print:shadow-none print:border-0">
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h3 className="text-xl font-bold text-teal-400">Rincian Transaksi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl">&times;</button>
                </div>
                <div className="space-y-4">
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">ID Transaksi:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.id}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Nama Pelanggan:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.nama || 'Nama tidak ditemukan'}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Alamat:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.alamat || 'Tidak ditemukan'}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Nomor WhatsApp:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.pelanggan?.no_whatsapp || 'Tidak ditemukan'}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Tanggal Mulai Sewa:</p><p className="font-semibold text-gray-200 print:text-black">{moment(transaction.tanggal_mulai).format('dddd, DD MMMM YYYY')}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Tanggal Selesai Sewa:</p><p className="font-semibold text-gray-200 print:text-black">{moment(transaction.tanggal_selesai).format('dddd, DD MMMM YYYY')}</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Durasi Sewa:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.durasi_hari} malam</p></div>
                    <div className="border-b border-gray-700 pb-2 print:border-black print:pb-0"><p className="text-sm text-gray-400 print:text-black">Metode Pembayaran:</p><p className="font-semibold text-gray-200 print:text-black">{transaction.jenis_pembayaran}</p></div>
                    {transaction.transaksi_detail && transaction.transaksi_detail.length > 0 && (<div className="mt-4 print:mt-0"><h4 className="text-lg font-bold text-gray-200 mb-2 print:text-black">Barang yang Disewa:</h4><ul className="space-y-1 text-gray-300 print:text-black">{transaction.transaksi_detail.map((item, index) => (<li key={item.id || index} className="flex justify-between py-1 text-gray-300 print:text-black"><span>{item.nama_barang} ({item.jumlah})</span><span>{formatRupiah(item.jumlah * item.produk?.harga)}</span></li>))}</ul></div>)}
                    <div className="border-t border-gray-700 pt-4 print:border-black print:pt-0"><div className="flex justify-between text-xl font-semibold mb-2"><span className="text-gray-300">Subtotal:</span><span className="text-gray-200">{formatRupiah(transaction.total_biaya / transaction.durasi_hari)}</span></div><div className="flex justify-between font-bold text-3xl"><span className="text-teal-400">Total Biaya:</span><span className="text-teal-400">{formatRupiah(transaction.total_biaya)}</span></div></div>
                </div>
                <button
                    onClick={handlePrint}
                    className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold hover:bg-teal-700 transition-colors mt-6 print:hidden"
                >CETAK STRUK</button>
            </div>
        </div>
    );
};

// Main Laporan Component
export default function Laporan() {
    const [laporan, setLaporan] = useState(null);
    const [transaksiData, setTransaksiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [sortConfig, setSortConfig] = useState({ field: 'tanggal_mulai', direction: 'desc' });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [initialLoading, setInitialLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [totalPengeluaranBulanIni, setTotalPengeluaranBulanIni] = useState(0);
    const [pendapatanBersihBulanIni, setPendapatanBersihBulanIni] = useState(0);
    const [laporanPengeluaran, setLaporanPengeluaran] = useState(null);
    const [pengeluaranData, setPengeluaranData] = useState([]);
    const [pengeluaranStartDate, setPengeluaranStartDate] = useState('');
    const [pengeluaranEndDate, setPengeluaranEndDate] = useState('');
    const [pengeluaranSearchQuery, setPengeluaranSearchQuery] = useState('');
    const [showDailyIncome, setShowDailyIncome] = useState(false);
    const [showDailyExpenses, setShowDailyExpenses] = useState(false);
    
    // START - PERUBAHAN: State untuk mengontrol tampilan grafik
    const [timeframe, setTimeframe] = useState('bulanan');
    // END - PERUBAHAN

    const fetchLaporan = async () => {
        setLoading(true);
        let query = supabase
            .from('transaksi')
            .select(`*, pelanggan(nama, alamat, no_whatsapp, jaminan), transaksi_detail(id, nama_barang, jumlah, produk(harga, nama)), status_pengembalian`)
            .order('tanggal_mulai', { ascending: false });
        if (startDate) query = query.gte('tanggal_mulai', startDate);
        if (endDate) query = query.lte('tanggal_mulai', endDate);
        if (statusFilter !== 'Semua') {
            if (statusFilter === 'Terlambat') {
                query = query.lte('tanggal_selesai', moment().format('YYYY-MM-DD')).eq('status_pengembalian', 'Belum Kembali');
            } else {
                query = query.eq('status_pengembalian', statusFilter);
            }
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching laporan:', error);
        } else {
            const laporanHarian = {}, laporanBulanan = {}, laporanTahunan = {};
            data.forEach(transaksi => {
                const tanggalMulai = moment(transaksi.tanggal_mulai);
                const hari = tanggalMulai.format('YYYY-MM-DD');
                const bulan = tanggalMulai.format('YYYY-MM');
                const tahun = tanggalMulai.format('YYYY');
                if (!laporanHarian[hari]) laporanHarian[hari] = 0;
                laporanHarian[hari] += transaksi.total_biaya;
                if (!laporanBulanan[bulan]) laporanBulanan[bulan] = 0;
                laporanBulanan[bulan] += transaksi.total_biaya;
                if (!laporanTahunan[tahun]) laporanTahunan[tahun] = 0;
                laporanTahunan[tahun] += transaksi.total_biaya;
            });
            setLaporan({ harian: laporanHarian, bulanan: laporanBulanan, tahunan: laporanTahunan });
            setTransaksiData(data);
        }
        setLoading(false);
        setInitialLoading(false);
    };

    const fetchPengeluaran = async (start, end) => {
        let query = supabase.from('pengeluaran').select('*').order('tanggal', { ascending: false });
        if (start) query = query.gte('tanggal', start);
        if (end) query = query.lte('tanggal', end);
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching pengeluaran:', error);
            setLaporanPengeluaran(null);
            setTotalPengeluaranBulanIni(0);
        } else {
            setPengeluaranData(data);
            const laporanHarianPengeluaran = {}, laporanBulananPengeluaran = {}, laporanTahunanPengeluaran = {};
            let totalBulanIni = 0;
            data.forEach(item => {
                const tanggal = moment(item.tanggal);
                const hari = tanggal.format('YYYY-MM-DD');
                const bulan = tanggal.format('YYYY-MM');
                const tahun = tanggal.format('YYYY');
                if (!laporanHarianPengeluaran[hari]) laporanHarianPengeluaran[hari] = 0;
                laporanHarianPengeluaran[hari] += item.jumlah;
                if (!laporanBulananPengeluaran[bulan]) laporanBulananPengeluaran[bulan] = 0;
                laporanBulananPengeluaran[bulan] += item.jumlah;
                if (!laporanTahunanPengeluaran[tahun]) laporanTahunanPengeluaran[tahun] = 0;
                laporanTahunanPengeluaran[tahun] += item.jumlah;
                if (bulan === moment().format('YYYY-MM')) totalBulanIni += item.jumlah;
            });
            setLaporanPengeluaran({ harian: laporanHarianPengeluaran, bulanan: laporanBulananPengeluaran, tahunan: laporanTahunanPengeluaran });
            setTotalPengeluaranBulanIni(totalBulanIni);
        }
    };
    
    useEffect(() => {
        const checkSessionAndFetchData = async () => {
            const { data: { session } = {} } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                await fetchLaporan();
                await fetchPengeluaran();
            } else {
                router.push('/login');
            }
            setInitialLoading(false);
        };
        checkSessionAndFetchData();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (!session) router.push('/login');
        });
        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        if (laporan && laporanPengeluaran) {
            const totalPemasukanBulanIni = laporan.bulanan[moment().format('YYYY-MM')] || 0;
            const totalPengeluaranBulanIni = laporanPengeluaran.bulanan[moment().format('YYYY-MM')] || 0;
            setPendapatanBersihBulanIni(totalPemasukanBulanIni - totalPengeluaranBulanIni);
        }
    }, [laporan, laporanPengeluaran]);

    const handleSearchKeyDown = (e) => { if (e.key === 'Enter') fetchLaporan(); };
    const handlePengeluaranSearchKeyDown = (e) => { if (e.key === 'Enter') fetchPengeluaran(pengeluaranStartDate, pengeluaranEndDate); };

    const handleSort = (field) => {
        let direction = (sortConfig.field === field && sortConfig.direction === 'asc') ? 'desc' : 'asc';
        setSortConfig({ field, direction });
    };
    
    const handleSortPengeluaran = (field) => {
        let direction = (sortConfig.field === field && sortConfig.direction === 'asc') ? 'desc' : 'asc';
        setSortConfig({ field, direction });
    };

    const filteredTransaksi = useMemo(() => {
        if (!transaksiData) return [];
        return transaksiData.filter(t => t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [transaksiData, searchQuery]);

    const sortedTransaksi = useMemo(() => {
        const sortableItems = [...filteredTransaksi];
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            switch (sortConfig.field) {
                case 'tanggal_mulai': aValue = new Date(a.tanggal_mulai); bValue = new Date(b.tanggal_mulai); break;
                case 'pelanggan.nama': aValue = a.pelanggan?.nama || ''; bValue = b.pelanggan?.nama || ''; break;
                case 'total_biaya': aValue = a.total_biaya; bValue = b.total_biaya; break;
                case 'jenis_pembayaran': aValue = a.jenis_pembayaran; bValue = b.jenis_pembayaran; break;
                default: return 0;
            }
            const isAsc = sortConfig.direction === 'asc';
            if (aValue < bValue) return isAsc ? -1 : 1;
            if (aValue > bValue) return isAsc ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredTransaksi, sortConfig]);

    const sortedPengeluaran = useMemo(() => {
        if (!pengeluaranData) return [];
        const filteredItems = pengeluaranData.filter(p => 
            p.jenis_pengeluaran?.toLowerCase().includes(pengeluaranSearchQuery.toLowerCase()) ||
            p.deskripsi?.toLowerCase().includes(pengeluaranSearchQuery.toLowerCase())
        );
        const sortableItems = [...filteredItems];
        sortableItems.sort((a, b) => {
            const isAsc = sortConfig.direction === 'asc';
            if (sortConfig.field === 'tanggal') {
                const dateA = new Date(a.tanggal);
                const dateB = new Date(b.tanggal);
                return isAsc ? dateA - dateB : dateB - dateA;
            }
            if (a[sortConfig.field] < b[sortConfig.field]) return isAsc ? -1 : 1;
            if (a[sortConfig.field] > b[sortConfig.field]) return isAsc ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [pengeluaranData, sortConfig, pengeluaranSearchQuery]);

    const formatRupiah = (angka) => `Rp${(angka || 0).toLocaleString('id-ID')}`;

    const getSortIcon = (field) => {
        if (sortConfig.field === field) return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
        return '';
    };

    const handleRowClick = (transaction) => {
        setSelectedTransaction(transaction);
        setModalOpen(true);
    };

    const updateStatusPengembalian = async (transactionId, status) => {
        setLoading(true);
        const { error } = await supabase.from('transaksi').update({ status_pengembalian: status }).eq('id', transactionId);
        if (error) {
            console.error('Error updating status:', error);
            alert('Gagal memperbarui status!');
            setLoading(false);
        } else {
            await fetchLaporan();
        }
    };

    const handleExportCSV = () => {
        if (sortedTransaksi.length === 0) { alert('Tidak ada data untuk diekspor!'); return; }
        const headers = ['ID Transaksi', 'Tanggal Mulai', 'Tanggal Selesai', 'Durasi (malam)', 'Nama Pelanggan', 'Alamat Pelanggan', 'No WhatsApp', 'Metode Pembayaran', 'Status Pengembalian', 'Total Biaya'];
        const csvRows = [headers.join(';')];
        sortedTransaksi.forEach(t => {
            const isLate = moment().isAfter(moment(t.tanggal_selesai), 'day') && t.status_pengembalian === 'Belum Kembali';
            const statusText = isLate ? 'Terlambat' : t.status_pengembalian;
            const row = [`"${t.id}"`, `"${moment(t.tanggal_mulai).format('YYYY-MM-DD')}"`, `"${moment(t.tanggal_selesai).format('YYYY-MM-DD')}"`, t.durasi_hari, `"${t.pelanggan?.nama || 'N/A'}"`, `"${t.pelanggan?.alamat || 'N/A'}"`, `"${t.pelanggan?.no_whatsapp || 'N/A'}"`, `"${t.jenis_pembayaran}"`, `"${statusText}"`, t.total_biaya].join(';');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'laporan-transaksi.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExportCSVpengeluaran = () => {
        if (pengeluaranData.length === 0) { alert('Tidak ada data untuk diekspor!'); return; }
        const headers = ['ID', 'Tanggal', 'Jenis Pengeluaran', 'Deskripsi', 'Jumlah'];
        const csvRows = [headers.join(';')];
        pengeluaranData.forEach(p => {
            const row = [`"${p.id}"`, `"${moment(p.tanggal).format('YYYY-MM-DD')}"`, `"${p.jenis_pengeluaran}"`, `"${p.deskripsi || ''}"`, p.jumlah].join(';');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'laporan-pengeluaran.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
        setStatusFilter('Semua');
        fetchLaporan();
    };

    const handleResetPengeluaranFilters = () => {
        setPengeluaranStartDate('');
        setPengeluaranEndDate('');
        setPengeluaranSearchQuery('');
        fetchPengeluaran('', '');
    };

    const sortedDailyIncome = useMemo(() => {
        if (!laporan?.harian) return [];
        return Object.entries(laporan.harian).sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
    }, [laporan]);

    const sortedDailyExpenses = useMemo(() => {
        if (!laporanPengeluaran?.harian) return [];
        return Object.entries(laporanPengeluaran.harian).sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
    }, [laporanPengeluaran]);
    
    // START - PERUBAHAN: Memoized data untuk grafik
    const chartData = useMemo(() => {
        if (!laporan || !laporanPengeluaran) return { labels: [], datasets: [] };
    
        let labels, incomeData, expenseData;
        
        const pemasukan = laporan[timeframe];
        const pengeluaran = laporanPengeluaran[timeframe];
    
        if (timeframe === 'harian' || timeframe === 'bulanan' || timeframe === 'tahunan') {
            const allKeys = new Set([
                ...Object.keys(pemasukan),
                ...Object.keys(pengeluaran),
            ]);
            labels = Array.from(allKeys).sort();
    
            incomeData = labels.map(key => pemasukan[key] || 0);
            expenseData = labels.map(key => pengeluaran[key] || 0);
        } else {
            labels = [];
            incomeData = [];
            expenseData = [];
        }
    
        // Format label untuk tampilan yang lebih baik
        const formattedLabels = labels.map(label => {
            switch(timeframe) {
                case 'harian': return moment(label).format('DD MMM');
                case 'bulanan': return moment(label, 'YYYY-MM').format('MMM YYYY');
                case 'tahunan': return label;
                default: return label;
            }
        });
    
        return {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: 'rgba(52, 211, 153, 0.7)',
                    borderColor: 'rgba(52, 211, 153, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [laporan, laporanPengeluaran, timeframe]);
    
    // Opsi untuk grafik
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#e2e8f0', // text-slate-200
                },
            },
            title: {
                display: true,
                text: 'Perbandingan Pemasukan & Pengeluaran',
                color: '#fff',
                font: {
                    size: 16,
                },
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatRupiah(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: '#334155' }, // bg-slate-700
                ticks: { color: '#e2e8f0' },
            },
            y: {
                grid: { color: '#334155' },
                ticks: {
                    color: '#e2e8f0',
                    callback: function(value) {
                        return formatRupiah(value);
                    }
                }
            }
        }
    };
    // END - PERUBAHAN

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <svg className="animate-spin h-10 w-10 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
            <Head>
                <title>Dashboard Analitik - Nuevanesia</title>
            </Head>
    
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Analitik - Evan Only</h1>
                    <p className="text-gray-400 mt-1">Ringkasan real-time Nuevanesia</p>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Link href="/superadmin" className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold">
                        <IconSuperadmin /> Edit Transaksi
                    </Link>
                    <Link href="/manajemen-produk" className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold">
                        <IconManajemenProduk /> Manajemen Produk
                    </Link>
                    <Link href="/pengeluaran" className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold">
                        <IconPengeluaran /> Catat Pengeluaran
                    </Link>
                </div>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-teal-500 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Pendapatan Bulan Ini</p>
                            <p className="text-2xl font-bold text-teal-400">{formatRupiah(laporan?.bulanan?.[moment().format('YYYY-MM')] || 0)}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg"><IconRevenue /></div>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-red-500 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Pengeluaran Bulan Ini</p>
                            <p className="text-2xl font-bold text-red-400">{formatRupiah(totalPengeluaranBulanIni)}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg"><IconExpense /></div>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-green-500 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Profit Bersih Bulan Ini</p>
                            <p className={`text-2xl font-bold ${pendapatanBersihBulanIni >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(pendapatanBersihBulanIni)}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg"><IconProfit /></div>
                    </div>
                </div>
            </div>

            {/* START - PERUBAHAN: Bagian Grafik Analisis */}
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2 sm:mb-0">Analisis Pemasukan & Pengeluaran</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setTimeframe('harian')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${timeframe === 'harian' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Harian
                        </button>
                        <button
                            onClick={() => setTimeframe('bulanan')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${timeframe === 'bulanan' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Bulanan
                        </button>
                        <button
                            onClick={() => setTimeframe('tahunan')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${timeframe === 'tahunan' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Tahunan
                        </button>
                    </div>
                </div>
                <div className="h-96">
                    {Object.keys(laporan[timeframe]).length > 0 || Object.keys(laporanPengeluaran[timeframe]).length > 0 ? (
                         <Bar data={chartData} options={options} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Tidak ada data untuk periode ini.</div>
                    )}
                </div>
            </div>
            {/* END - PERUBAHAN: Bagian Grafik Analisis */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700">
                    <button 
                        onClick={() => setShowDailyIncome(!showDailyIncome)} 
                        className="w-full text-left p-6 flex justify-between items-center text-xl font-semibold text-white hover:bg-gray-800 transition-colors rounded-t-2xl"
                    >
                        Laporan Pemasukan Harian
                        {showDailyIncome ? <IconChevronUp /> : <IconChevronDown />}
                    </button>
                    {showDailyIncome && (
                        <div className="p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                            <table className="w-full text-left table-auto">
                                <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-2">Tanggal</th>
                                        <th className="p-2 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDailyIncome.length > 0 ? (
                                        sortedDailyIncome.map(([tanggal, jumlah]) => (
                                            <tr key={tanggal} className="border-b border-gray-700">
                                                <td className="p-2 text-sm text-gray-300">{moment(tanggal).format('DD MMM YYYY')}</td>
                                                <td className="p-2 text-sm font-semibold text-green-400 text-right">{formatRupiah(jumlah)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="p-4 text-center text-gray-400">Tidak ada data pemasukan harian.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800/50 rounded-2xl border border-gray-700">
                    <button 
                        onClick={() => setShowDailyExpenses(!showDailyExpenses)} 
                        className="w-full text-left p-6 flex justify-between items-center text-xl font-semibold text-white hover:bg-gray-800 transition-colors rounded-t-2xl"
                    >
                        Laporan Pengeluaran Harian
                        {showDailyExpenses ? <IconChevronUp /> : <IconChevronDown />}
                    </button>
                    {showDailyExpenses && (
                        <div className="p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                            <table className="w-full text-left table-auto">
                                <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-2">Tanggal</th>
                                        <th className="p-2 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDailyExpenses.length > 0 ? (
                                        sortedDailyExpenses.map(([tanggal, jumlah]) => (
                                            <tr key={tanggal} className="border-b border-gray-700">
                                                <td className="p-2 text-sm text-gray-300">{moment(tanggal).format('DD MMM YYYY')}</td>
                                                <td className="p-2 text-sm font-semibold text-red-400 text-right">{formatRupiah(jumlah)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="p-4 text-center text-gray-400">Tidak ada data pengeluaran harian.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Riwayat Pemasukan</h3>
                        <button onClick={handleExportCSV} className="bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2 font-semibold">
                            <IconExport /> Ekspor
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
                        <div className="lg:col-span-1">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">Cari Pelanggan</label>
                            <input 
                                type="text" 
                                id="search" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                onKeyDown={handleSearchKeyDown} 
                                placeholder="Nama pelanggan..." 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Dari Tanggal</label>
                            <input 
                                type="date" 
                                id="startDate" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                id="endDate" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3"
                            />
                        </div>
                        <div className="flex gap-2 w-full">
                            <button onClick={fetchLaporan} className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-semibold">Terapkan</button>
                            <button onClick={handleResetFilters} className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-500 transition-colors" title="Reset Filter">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>
                            </button>
                        </div>
                    </div>
                    {loading && !initialLoading ? <p>Memuat data...</p> : sortedTransaksi.length > 0 ? (
                        <div className="max-h-[60vh] overflow-auto scrollbar-hide">
                            <table className="w-full text-left table-auto">
                                <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSort('tanggal_mulai')}>Tanggal {getSortIcon('tanggal_mulai')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSort('pelanggan.nama')}>Pelanggan {getSortIcon('pelanggan.nama')}</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 cursor-pointer text-right" onClick={() => handleSort('total_biaya')}>Total {getSortIcon('total_biaya')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTransaksi.map(t => {
                                        const isLate = moment().isAfter(moment(t.tanggal_selesai), 'day') && t.status_pengembalian === 'Belum Kembali';
                                        return (
                                            <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors group">
                                                <td className="p-4 align-middle text-sm text-gray-300">{moment(t.tanggal_mulai).format('DD MMM YYYY')}</td>
                                                <td className="p-4 align-middle font-semibold text-teal-400 cursor-pointer hover:underline" onClick={() => handleRowClick(t)}>{t.pelanggan?.nama || 'N/A'}</td>
                                                <td className="p-4 align-middle">
                                                    {t.status_pengembalian === 'Sudah Kembali' ? 
                                                        <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full">Selesai</span> :
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isLate ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{isLate ? 'Terlambat' : 'Disewa'}</span>
                                                    }
                                                </td>
                                                <td className="p-4 align-middle font-semibold text-green-400 text-right text-sm">{formatRupiah(t.total_biaya)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-400 text-center py-8">Tidak ada data transaksi.</p>}
                </div>
    
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Riwayat Pengeluaran</h3>
                        <button onClick={handleExportCSVpengeluaran} className="bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2 font-semibold">
                           <IconExport /> Ekspor
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
                        <div className="lg:col-span-1">
                            <label htmlFor="pengeluaranSearch" className="block text-sm font-medium text-gray-400 mb-1">Cari Pengeluaran</label>
                            <input 
                                type="text" 
                                id="pengeluaranSearch" 
                                value={pengeluaranSearchQuery} 
                                onChange={(e) => setPengeluaranSearchQuery(e.target.value)} 
                                onKeyDown={handlePengeluaranSearchKeyDown}
                                placeholder="Jenis atau deskripsi..." 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="pengeluaranStartDate" className="block text-sm font-medium text-gray-400 mb-1">Dari Tanggal</label>
                            <input 
                                type="date" 
                                id="pengeluaranStartDate" 
                                value={pengeluaranStartDate} 
                                onChange={(e) => setPengeluaranStartDate(e.target.value)} 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3"
                            />
                        </div>
                        <div>
                            <label htmlFor="pengeluaranEndDate" className="block text-sm font-medium text-gray-400 mb-1">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                id="pengeluaranEndDate" 
                                value={pengeluaranEndDate} 
                                onChange={(e) => setPengeluaranEndDate(e.target.value)} 
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg py-2 px-3"
                            />
                        </div>
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={() => fetchPengeluaran(pengeluaranStartDate, pengeluaranEndDate)} 
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                            >
                                Terapkan
                            </button>
                            <button onClick={handleResetPengeluaranFilters} className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-500 transition-colors" title="Reset Filter">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>
                            </button>
                        </div>
                    </div>
                     {loading && !initialLoading ? <p>Memuat data...</p> : sortedPengeluaran.length > 0 ? (
                        <div className="max-h-[60vh] overflow-auto scrollbar-hide">
                            <table className="w-full text-left table-auto">
                                 <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('tanggal')}>Tanggal {getSortIcon('tanggal')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('jenis_pengeluaran')}>Jenis {getSortIcon('jenis_pengeluaran')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('deskripsi')}>Deskripsi {getSortIcon('deskripsi')}</th>
                                        <th className="p-4 cursor-pointer text-right" onClick={() => handleSortPengeluaran('jumlah')}>Jumlah {getSortIcon('jumlah')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPengeluaran.map(p => (
                                        <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                            <td className="p-4 align-middle text-sm text-gray-300">{moment(p.tanggal).format('DD MMM YYYY')}</td>
                                            <td className="p-4 align-middle text-sm">{p.jenis_pengeluaran}</td>
                                            <td className="p-4 align-middle text-sm text-gray-300">{p.deskripsi || '-'}</td>
                                            <td className="p-4 align-middle font-semibold text-red-400 text-right text-sm">{formatRupiah(p.jumlah)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-400 text-center py-8">Belum ada data pengeluaran.</p>}
                </div>
            </div>
    
            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                transaction={selectedTransaction}
            />
        </div>
    );
    
}