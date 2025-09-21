import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/id';
import Link from 'next/link';
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
import { Download, Search, RefreshCcw, ArrowRight, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Settings, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Komponen Ikon Modern
const IconIncome = () => <DollarSign className="w-8 h-8 text-green-400" />;
const IconExpense = () => <TrendingDown className="w-8 h-8 text-red-400" />;
const IconProfit = () => <TrendingUp className="w-8 h-8 text-teal-400" />;
const IconCustomers = () => <Users className="w-8 h-8 text-blue-400" />;

// TransactionModal Component
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
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100 print:shadow-none print:border-0 print:bg-white print:text-black">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h3 className="text-2xl font-bold text-teal-400">Rincian Transaksi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl font-light">&times;</button>
                </div>
                <div className="space-y-4">
                    {Object.entries({
                        'ID Transaksi': transaction.id,
                        'Nama Pelanggan': transaction.pelanggan?.nama || 'Nama tidak ditemukan',
                        'Alamat': transaction.pelanggan?.alamat || 'Tidak ditemukan',
                        'Nomor WhatsApp': transaction.pelanggan?.no_whatsapp || 'Tidak ditemukan',
                        'Tanggal Mulai Sewa': moment(transaction.tanggal_mulai).format('dddd, DD MMMM YYYY'),
                        'Tanggal Selesai Sewa': moment(transaction.tanggal_selesai).format('dddd, DD MMMM YYYY'),
                        'Durasi Sewa': `${transaction.durasi_hari} malam`,
                        'Metode Pembayaran': transaction.jenis_pembayaran
                    }).map(([label, value]) => (
                        <div key={label} className="border-b border-gray-700 pb-2 print:border-black print:pb-0 last:border-0">
                            <p className="text-sm font-medium text-gray-400 print:text-black">{label}</p>
                            <p className="font-semibold text-gray-200 print:text-black">{value}</p>
                        </div>
                    ))}
                    {transaction.transaksi_detail && transaction.transaksi_detail.length > 0 && (
                        <div className="mt-4 print:mt-0">
                            <h4 className="text-lg font-bold text-gray-200 mb-2 print:text-black">Barang yang Disewa:</h4>
                            <ul className="space-y-1 text-gray-300 print:text-black">
                                {transaction.transaksi_detail.map((item, index) => (
                                    <li key={item.id || index} className="flex justify-between py-1 text-gray-300 print:text-black">
                                        <span>{item.nama_barang} ({item.jumlah})</span>
                                        <span>{formatRupiah(item.jumlah * item.produk?.harga)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="border-t border-gray-700 pt-4 print:border-black print:pt-0">
                        <div className="flex justify-between text-xl font-semibold mb-2">
                            <span className="text-gray-300">Subtotal:</span>
                            <span className="text-gray-200">{formatRupiah(transaction.total_biaya / transaction.durasi_hari)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-3xl">
                            <span className="text-teal-400">Total Biaya:</span>
                            <span className="text-teal-400">{formatRupiah(transaction.total_biaya)}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="w-full bg-teal-600 text-white p-4 rounded-xl font-bold hover:bg-teal-700 transition-all duration-300 mt-6 shadow-lg hover:shadow-xl print:hidden"
                >CETAK STRUK</button>
            </div>
        </div>
    );
};

// Main Laporan Component
export default function Laporan() {
    const [transaksiData, setTransaksiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [sortConfig, setSortConfig] = useState({ field: 'tanggal_mulai', direction: 'desc' });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [initialLoading, setInitialLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [pengeluaranData, setPengeluaranData] = useState([]);
    const [pengeluaranSearchQuery, setPengeluaranSearchQuery] = useState('');
    const [timeframe, setTimeframe] = useState('bulanan');
    const [showDailyIncome, setShowDailyIncome] = useState(false);
    const [showDailyExpenses, setShowDailyExpenses] = useState(false);
    const [showChart, setShowChart] = useState(true);

    const fetchLaporan = async (start, end) => {
        setLoading(true);
        let transaksiQuery = supabase.from('transaksi').select(`*, pelanggan(nama, alamat, no_whatsapp, jaminan), transaksi_detail(id, nama_barang, jumlah, produk(harga, nama)), status_pengembalian`).order('tanggal_mulai', { ascending: false });
        let pengeluaranQuery = supabase.from('pengeluaran').select(`*`).order('tanggal', { ascending: false });

        if (start) {
            transaksiQuery = transaksiQuery.gte('tanggal_mulai', start);
            pengeluaranQuery = pengeluaranQuery.gte('tanggal', start);
        }
        if (end) {
            transaksiQuery = transaksiQuery.lte('tanggal_mulai', end);
            pengeluaranQuery = pengeluaranQuery.lte('tanggal', end);
        }
        if (statusFilter !== 'Semua') {
            if (statusFilter === 'Terlambat') {
                transaksiQuery = transaksiQuery.lte('tanggal_selesai', moment().format('YYYY-MM-DD')).eq('status_pengembalian', 'Belum Kembali');
            } else {
                transaksiQuery = transaksiQuery.eq('status_pengembalian', statusFilter);
            }
        }
        
        const { data: transaksi, error: transaksiError } = await transaksiQuery;
        const { data: pengeluaran, error: pengeluaranError } = await pengeluaranQuery;

        if (transaksiError) console.error('Error fetching transaksi:', transaksiError);
        if (pengeluaranError) console.error('Error fetching pengeluaran:', pengeluaranError);

        setTransaksiData(transaksi || []);
        setPengeluaranData(pengeluaran || []);
        setLoading(false);
        setInitialLoading(false);
    };

    const handleTimeframeChange = (frame) => {
        setTimeframe(frame);
        let newStartDate, newEndDate;
        switch (frame) {
            case 'harian':
                newStartDate = moment().format('YYYY-MM-DD');
                newEndDate = moment().format('YYYY-MM-DD');
                break;
            case 'bulanan':
                newStartDate = moment().startOf('month').format('YYYY-MM-DD');
                newEndDate = moment().format('YYYY-MM-DD');
                break;
            case 'tahunan':
                newStartDate = moment().startOf('year').format('YYYY-MM-DD');
                newEndDate = moment().format('YYYY-MM-DD');
                break;
            default:
                newStartDate = '';
                newEndDate = '';
        }
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        fetchLaporan(newStartDate, newEndDate);
    };
    
    useEffect(() => {
        const checkSessionAndFetchData = async () => {
            const { data: { session } = {} } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                // Fetch initial data for the current month
                fetchLaporan(startDate, endDate);
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
    }, [router, startDate, endDate]);

    const handleSearchKeyDown = (e) => { if (e.key === 'Enter') fetchLaporan(startDate, endDate); };
    const handlePengeluaranSearchKeyDown = (e) => { if (e.key === 'Enter') fetchLaporan(startDate, endDate); };
    
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
    const getSortIcon = (field) => sortConfig.field === field ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : '';
    const handleRowClick = (transaction) => { setSelectedTransaction(transaction); setModalOpen(true); };

    const updateStatusPengembalian = async (transactionId, status) => {
        setLoading(true);
        const { error } = await supabase.from('transaksi').update({ status_pengembalian: status }).eq('id', transactionId);
        if (error) {
            console.error('Error updating status:', error);
            alert('Gagal memperbarui status!');
        } else {
            fetchLaporan(startDate, endDate);
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
        setSearchQuery(''); 
        setStatusFilter('Semua');
        handleTimeframeChange(timeframe); // Reset other filters but keep current timeframe
    };

    const handleResetPengeluaranFilters = () => {
        setPengeluaranSearchQuery('');
        fetchLaporan(startDate, endDate);
    };

    const totalIncome = useMemo(() => filteredTransaksi.reduce((sum, t) => sum + t.total_biaya, 0), [filteredTransaksi]);
    const totalTransactions = useMemo(() => filteredTransaksi.length, [filteredTransaksi]);
    const totalExpenses = useMemo(() => pengeluaranData.reduce((sum, e) => sum + e.jumlah, 0), [pengeluaranData]);
    const pendapatanBersih = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

    const aggregatedData = useMemo(() => {
        const dataMap = new Map();
        const format = 'YYYY-MM-DD';

        transaksiData.forEach(t => {
            const dateKey = moment(t.tanggal_mulai).format(format);
            const entry = dataMap.get(dateKey) || { date: dateKey, pemasukan: 0, pengeluaran: 0 };
            entry.pemasukan += t.total_biaya;
            dataMap.set(dateKey, entry);
        });

        pengeluaranData.forEach(e => {
            const dateKey = moment(e.tanggal).format(format);
            const entry = dataMap.get(dateKey) || { date: dateKey, pemasukan: 0, pengeluaran: 0 };
            entry.pengeluaran += e.jumlah;
            dataMap.set(dateKey, entry);
        });

        return Array.from(dataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [transaksiData, pengeluaranData]);

    const chartData = useMemo(() => {
        const labels = aggregatedData.map(d => moment(d.date).format('DD MMM'));
        const incomeData = aggregatedData.map(d => d.pemasukan);
        const expenseData = aggregatedData.map(d => d.pengeluaran);

        return {
            labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: 'rgba(52, 211, 153, 0.7)',
                    borderColor: 'rgba(52, 211, 153, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };
    }, [aggregatedData]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#e2e8f0',
                },
            },
            title: {
                display: false,
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
                },
                backgroundColor: '#1f2937',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e0',
                borderColor: '#4a5568',
                borderWidth: 1,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { color: '#334155' },
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

    const sortedDailyIncome = useMemo(() => {
        const incomeMap = {};
        transaksiData.forEach(t => {
            const date = moment(t.tanggal_mulai).format('YYYY-MM-DD');
            if (!incomeMap[date]) {
                incomeMap[date] = { count: 0, amount: 0 };
            }
            incomeMap[date].count += 1;
            incomeMap[date].amount += t.total_biaya;
        });
        return Object.entries(incomeMap).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transaksiData]);

    const sortedDailyExpenses = useMemo(() => {
        const expenseMap = {};
        pengeluaranData.forEach(e => {
            const date = moment(e.tanggal).format('YYYY-MM-DD');
            expenseMap[date] = (expenseMap[date] || 0) + e.jumlah;
        });
        return Object.entries(expenseMap).sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
    }, [pengeluaranData]);
    
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
        <div className="min-h-screen bg-gray-900 text-white p-8 md:p-12 font-sans antialiased">
            <Head><title>Dashboard Keuangan</title></Head>
    
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 print:hidden">
                <div>
                    <h1 className="text-4xl font-extrabold text-teal-400 drop-shadow-lg">Dashboard Keuangan</h1>
                    <p className="text-gray-400 mt-2 text-lg">Ringkasan analitik bisnis Anda</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
                    <Link href="/superadmin" className="flex items-center gap-2 bg-gray-700 text-gray-300 p-3 rounded-xl hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm font-semibold">
                        <Settings className="w-5 h-5" /> Edit Transaksi
                    </Link>
                    <Link href="/pengeluaran" className="flex items-center gap-2 bg-gray-700 text-gray-300 p-3 rounded-xl hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm font-semibold">
                        <ShoppingBag className="w-5 h-5" /> Pengeluaran
                    </Link>
                    <Link href="/manajemen-produk" className="flex items-center gap-2 bg-gray-700 text-gray-300 p-3 rounded-xl hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm font-semibold">
                        <ShoppingBag className="w-5 h-5" /> Manajemen Produk
                    </Link>
                </div>
            </div>
    
            {/* Ringkasan Keuangan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 print:hidden">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-6 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-green-500/20 rounded-full"><IconIncome /></div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Pemasukan</p>
                        <h3 className="text-3xl font-bold text-green-400">{formatRupiah(totalIncome)}</h3>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-6 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-red-500/20 rounded-full"><IconExpense /></div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Pengeluaran</p>
                        <h3 className="text-3xl font-bold text-red-400">{formatRupiah(totalExpenses)}</h3>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-6 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-teal-500/20 rounded-full"><IconProfit /></div>
                    <div>
                        <p className="text-gray-400 text-sm">Laba Bersih</p>
                        <h3 className="text-3xl font-bold text-teal-400">{formatRupiah(pendapatanBersih)}</h3>
                    </div>
                </div>
            </div>

            {/* Grafik Keuangan */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8 print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-200 mb-2 sm:mb-0">Perbandingan Pemasukan & Pengeluaran</h2>
                    <button onClick={() => setShowChart(!showChart)} className="bg-gray-700 text-gray-300 py-2 px-4 rounded-xl font-bold hover:bg-gray-600 transition-colors text-sm flex items-center gap-2">
                        {showChart ? <><ChevronUp className="w-4 h-4" /> Sembunyikan Grafik</> : <><ChevronDown className="w-4 h-4" /> Tampilkan Grafik</>}
                    </button>
                </div>
                {showChart && (
                    <div className="w-full h-80">
                        {aggregatedData.length > 0 ? (
                            <Bar data={chartData} options={options} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">Tidak ada data untuk periode ini.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Filter Waktu - Pindah ke Bawah Grafik */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 print:hidden">
                <h2 className="text-lg font-bold text-gray-200">Filter Berdasarkan Tanggal:</h2>
                <div className="flex flex-wrap justify-center md:justify-end gap-2">
                    <button onClick={() => handleTimeframeChange('harian')} className={`py-2 px-4 rounded-lg font-bold transition-colors text-sm ${timeframe === 'harian' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Hari Ini</button>
                    <button onClick={() => handleTimeframeChange('bulanan')} className={`py-2 px-4 rounded-lg font-bold transition-colors text-sm ${timeframe === 'bulanan' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Bulan Ini</button>
                    <button onClick={() => handleTimeframeChange('tahunan')} className={`py-2 px-4 rounded-lg font-bold transition-colors text-sm ${timeframe === 'tahunan' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Tahun Ini</button>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                fetchLaporan(e.target.value, endDate);
                            }}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 text-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="text-gray-400">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                fetchLaporan(startDate, e.target.value);
                            }}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 text-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>
            </div>
    
            {/* Laporan Harian */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700">
                    <button onClick={() => setShowDailyIncome(!showDailyIncome)} className="w-full text-left p-6 flex justify-between items-center text-xl font-semibold text-white hover:bg-gray-800 transition-colors rounded-t-2xl">
                        Laporan Pemasukan Harian
                        {showDailyIncome ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {showDailyIncome && (
                        <div className="p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            <div className="mb-4 text-center">
                                <span className="text-lg font-bold text-yellow-400">Total Transaksi Bulan Ini: {totalTransactions}</span>
                            </div>
                            <table className="w-full text-left table-auto">
                                <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-2">Tanggal</th>
                                        <th className="p-2">Jumlah Transaksi</th>
                                        <th className="p-2 text-right">Jumlah Pemasukan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDailyIncome.length > 0 ? (
                                        sortedDailyIncome.map((item) => (
                                            <tr key={item.date} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-2 text-sm text-gray-300">{moment(item.date).format('DD MMM YYYY')}</td>
                                                <td className="p-2 text-sm text-center text-teal-400">{item.count}</td>
                                                <td className="p-2 text-sm font-semibold text-green-400 text-right">{formatRupiah(item.amount)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-4 text-center text-gray-400">Tidak ada data pemasukan harian.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
    
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700">
                    <button onClick={() => setShowDailyExpenses(!showDailyExpenses)} className="w-full text-left p-6 flex justify-between items-center text-xl font-semibold text-white hover:bg-gray-800 transition-colors rounded-t-2xl">
                        Laporan Pengeluaran Harian
                        {showDailyExpenses ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {showDailyExpenses && (
                        <div className="p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
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
                                            <tr key={tanggal} className="border-b border-gray-700 hover:bg-gray-700/50">
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
    
            {/* Tabel Transaksi & Pengeluaran */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 print:hidden">
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Riwayat Pemasukan</h3>
                        <button onClick={handleExportCSV} className="bg-green-700 text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-colors text-sm flex items-center gap-2 font-semibold">
                            <Download className="w-4 h-4" /> Ekspor
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
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl py-2 px-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div className="flex gap-2 w-full">
                            <button onClick={() => fetchLaporan(startDate, endDate)} className="w-full bg-teal-600 text-white py-2 px-4 rounded-xl hover:bg-teal-700 transition-colors font-semibold">Terapkan</button>
                            <button onClick={handleResetFilters} className="bg-gray-600 text-white p-2 rounded-xl hover:bg-gray-500 transition-colors" title="Reset Filter">
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {loading ? <p>Memuat data...</p> : sortedTransaksi.length > 0 ? (
                        <div className="max-h-[60vh] overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 rounded-lg">
                            <table className="w-full text-left table-auto">
                                <thead className="bg-gray-700/50 text-xs uppercase text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSort('tanggal_mulai')}>Tanggal {getSortIcon('tanggal_mulai')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSort('pelanggan.nama')}>Pelanggan {getSortIcon('pelanggan.nama')}</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 cursor-pointer text-right" onClick={() => handleSort('total_biaya')}>Total {getSortIcon('total_biaya')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {sortedTransaksi.map(t => {
                                        const isLate = moment().isAfter(moment(t.tanggal_selesai), 'day') && t.status_pengembalian === 'Belum Kembali';
                                        return (
                                            <tr key={t.id} className="hover:bg-gray-700/50 transition-colors duration-200">
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
                        <button onClick={handleExportCSVpengeluaran} className="bg-green-700 text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-colors text-sm flex items-center gap-2 font-semibold">
                           <Download className="w-4 h-4" /> Ekspor
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
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl py-2 px-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => fetchLaporan(startDate, endDate)}
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-xl hover:bg-teal-700 transition-colors font-semibold"
                            >
                                Terapkan
                            </button>
                            <button onClick={handleResetPengeluaranFilters} className="bg-gray-600 text-white p-2 rounded-xl hover:bg-gray-500 transition-colors" title="Reset Filter">
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                     {loading ? <p>Memuat data...</p> : sortedPengeluaran.length > 0 ? (
                        <div className="max-h-[60vh] overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 rounded-lg">
                            <table className="w-full text-left table-auto">
                                 <thead className="bg-gray-700/50 text-xs uppercase text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('tanggal')}>Tanggal {getSortIcon('tanggal')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('jenis_pengeluaran')}>Jenis {getSortIcon('jenis_pengeluaran')}</th>
                                        <th className="p-4 cursor-pointer" onClick={() => handleSortPengeluaran('deskripsi')}>Deskripsi {getSortIcon('deskripsi')}</th>
                                        <th className="p-4 cursor-pointer text-right" onClick={() => handleSortPengeluaran('jumlah')}>Jumlah {getSortIcon('jumlah')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
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