import { useState, useEffect } from 'react';
// Pastikan path ini benar mengarah ke file supabaseClient kamu
import { supabase } from '../utils/supabaseClient';

export default function TombolNotifOrderWeb({ session }) {
    const [waitingCount, setWaitingCount] = useState(0);

    useEffect(() => {
        const fetchWaitingCount = async () => {
            const { count, error } = await supabase
                .from('transaksi')
                .select('*', { count: 'exact', head: true })
                .eq('status_validasi', 'Menunggu');
            
            if (!error && count !== null) {
                setWaitingCount(count);
            }
        };

        if (session) {
            fetchWaitingCount();
            // Cek otomatis ke database setiap 10 detik (10000 milidetik)
            const intervalId = setInterval(fetchWaitingCount, 10000); 
            return () => clearInterval(intervalId);
        }
    }, [session]);

    return (
        <button 
            onClick={() => window.open('/orderweb', '_blank')} 
            className="relative flex items-center justify-center bg-teal-600/20 border border-teal-500/30 text-teal-300 p-3 rounded-lg hover:bg-teal-500/40 hover:text-white transition-colors duration-200 w-full font-semibold text-sm"
        >
            <span className="mr-2">🔔</span> Order Web
            
            {waitingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-2 border-gray-900 shadow-md animate-pulse">
                    {waitingCount}
                </span>
            )}
        </button>
    );
}