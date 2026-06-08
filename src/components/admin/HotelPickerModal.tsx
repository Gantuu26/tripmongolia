import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import type { Hotel } from '../../types/hotel';

interface HotelPickerModalProps {
    /** Whether the modal is open. */
    open: boolean;
    /** Called with the selected hotel; consumer decides what to store. */
    onPick: (hotel: Hotel) => void;
    /** Close without picking. */
    onClose: () => void;
    /** Optional title override (default: "Зочид буудлын сангаас сонгох"). */
    title?: string;
}

/**
 * Reusable hotel picker. Opens over the admin product editor (or anywhere
 * else that wants to attach a hotel) and lets the admin search the master
 * library. Returns the full Hotel object so callers can snapshot whatever
 * fields they want.
 */
export const HotelPickerModal: React.FC<HotelPickerModalProps> = ({
    open,
    onPick,
    onClose,
    title = 'Зочид буудлын сангаас сонгох',
}) => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await api.hotels.list({ active: true });
                if (!cancelled) setHotels(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Hotel picker load failed:', e);
                if (!cancelled) setHotels([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        setQ('');
        return () => { cancelled = true; };
    }, [open]);

    const filtered = useMemo(() => {
        return hotels.filter((h) => {
            if (q) {
                const needle = q.toLowerCase();
                const hay = `${h.name_kr} ${h.name_local || ''}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
    }, [hotels, q]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Хайсны дараа мөр дээр дарвал тухайн зочид буудал хөтөлбөрт оруулагдана.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Filter bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Зочид буудлын нэрээр хайх"
                        autoFocus
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="py-20 text-center text-slate-500">Ачаалж байна...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
                            {hotels.length === 0
                                ? 'Одоогоор бүртгэгдсэн зочид буудал алга байна. Хажуугийн цэс → "Зочид буудлын сан" цэснээс эхлээд зочид буудал бүртгэнэ үү.'
                                : 'Нөхцөлд тохирох зочид буудал алга байна.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                <tr className="text-xs text-slate-500 dark:text-slate-400">
                                    <th className="text-left px-4 py-2.5 font-medium w-16">Үндсэн</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Зочид буудлын нэр</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Хаяг</th>
                                    <th className="text-center px-4 py-2.5 font-medium w-16">Зураг</th>
                                    <th className="text-right px-4 py-2.5 font-medium w-24">Сонгох</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((h) => {
                                    const thumb = (h.images || []).find((url) => !!url);
                                    return (
                                        <tr
                                            key={h.id}
                                            onClick={() => onPick(h)}
                                            className="border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-colors"
                                        >
                                            <td className="px-4 py-2">
                                                <div className="w-12 h-12 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    {thumb ? (
                                                        <img src={thumb} alt={h.name_kr} loading="lazy" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-400 text-sm">hotel</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                {h.name_kr}
                                                {h.name_local && (
                                                    <span className="ml-2 text-xs font-normal text-slate-500">{h.name_local}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                                                {h.address || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-slate-500">
                                                {(h.images || []).length} ширхэг
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-3 py-1 rounded bg-teal-500 text-white text-xs font-bold">
                                                    Сонгох
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
