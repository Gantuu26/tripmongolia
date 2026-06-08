import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

/**
 * Editor for the site-wide "tour common FAQ" — the FAQ block displayed at
 * the bottom of every product detail page. Rendered as a tab inside
 * AdminFAQManage so the admin sees one unified "FAQ 관리" menu instead of
 * two confusing entries. No sidebar / header chrome — that's the host
 * page's job.
 */

interface FAQRow {
    id?: string;
    question: string;
    answer: string;
}

const STARTER_ROWS: FAQRow[] = [
    { question: '출발 전에 무엇을 준비하면 되나요?', answer: '국제선 항공권, 여권(유효기간 6개월 이상), 몽골 비자가 필요합니다. 비자 신청은 저희 회사에서도 지원해 드립니다. 일교차가 크기 때문에 계절과 관계없이 겉옷은 필수입니다.' },
    { question: '취소 규정을 알려 주세요.', answer: '출발일 31일 전까지: 전액 환불. 30~15일 전: 투어 요금의 30%. 14~8일 전: 50%. 7일 전 이후: 100%. 자세한 내용은 이용약관을 확인해 주시기 바랍니다.' },
    { question: '게르 숙박 시 침구가 제공되나요?', answer: '모든 게르 캠프에 침대, 매트리스, 담요, 타월을 완비하고 있습니다. 겨울철에는 전기담요도 준비해 드립니다.' },
    { question: '혼자 여행해도 참가할 수 있나요?', answer: '물론 가능합니다. 1인 참가 추가 요금 ₩180,000을 받고 있습니다(개인실 추가 요금분). 동행자 모집 게시판도 이용해 주시기 바랍니다.' },
    { question: '식사 알레르기 대응이 가능한가요?', answer: '사전에 알려 주시면 음식 알레르기나 종교상의 식사 제한에 개별적으로 대응해 드립니다. 채식주의자, 비건 대응도 가능합니다.' },
    { question: '현지에서의 통신 수단은 무엇인가요?', answer: '울란바토르 시내는 4G를 완비하고 있습니다. 고비, 테렐지에서는 전파가 약한 곳도 있습니다. 가이드가 위성전화를 소지하고 있어 긴급 연락은 가능합니다.' },
];

export const TourFAQEditor: React.FC = () => {
    const [rows, setRows] = useState<FAQRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.tourFaqs.list();
                if (Array.isArray(data) && data.length > 0) {
                    setRows(data.map((d) => ({ id: d.id, question: d.question, answer: d.answer })));
                } else {
                    setRows(STARTER_ROWS);
                }
            } catch (e) {
                console.error('Tour FAQ load failed:', e);
                setRows(STARTER_ROWS);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (idx: number, patch: Partial<FAQRow>) => {
        setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };
    const move = (idx: number, dir: -1 | 1) => {
        setRows((rs) => {
            const next = [...rs];
            const j = idx + dir;
            if (j < 0 || j >= next.length) return rs;
            [next[idx], next[j]] = [next[j], next[idx]];
            return next;
        });
    };
    const removeRow = (idx: number) => {
        if (!confirm('Энэ асуултыг устгах уу?')) return;
        setRows((rs) => rs.filter((_, i) => i !== idx));
    };
    const addRow = () => {
        setRows((rs) => [...rs, { question: '', answer: '' }]);
    };

    const handleSave = async () => {
        const clean = rows
            .map((r) => ({ id: r.id, question: r.question.trim(), answer: r.answer.trim() }))
            .filter((r) => r.question || r.answer);
        if (clean.length === 0) {
            if (!confirm('Бүртгэгдсэн FAQ алга байна. Хоосон хадгалбал бараа бүтээгдэхүүний дэлгэрэнгүй хуудсанд үндсэн FAQ харагдана. Үргэлжлүүлэх үү?')) return;
        }
        setSaving(true);
        try {
            await api.tourFaqs.saveBulk(clean);
            setSavedAt(new Date().toLocaleTimeString('ja-JP'));
            const refreshed = await api.tourFaqs.list();
            if (Array.isArray(refreshed)) {
                setRows(refreshed.map((d) => ({ id: d.id, question: d.question, answer: d.answer })));
            }
        } catch (e: any) {
            alert('Хадгалахад алдаа гарлаа: ' + (e?.message || 'Тодорхойгүй алдаа'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-slate-500">Ачаалж байна...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3 items-start text-sm text-blue-800 dark:text-blue-200">
                    <span className="material-symbols-outlined text-base mt-0.5">info</span>
                    <div>
                        <div className="font-semibold mb-1">Бараа бүтээгдэхүүний хуудасны доод хэсгийн FAQ — нэг удаа бичвэл бүх бараанд хэрэглэгдэнэ</div>
                        <ul className="space-y-1 text-xs leading-relaxed">
                            <li>• Энд бүртгэсэн FAQ нь <strong>бүх бараа бүтээгдэхүүний дэлгэрэнгүй хуудасны</strong> 「ご注意・よくある質問」хэсэгт автоматаар харагдана.</li>
                            <li>• Зөвхөн тодорхой бараанд өөр FAQ харуулахыг хүсвэл тухайн барааны засварлах хуудаснаас тусад нь оруулна (тэр бараан дээр давуу хэрэглэгдэнэ).</li>
                            <li>• 「FAQ жагсаалт」/「Ангилал удирдах」 таб нь <strong>үйлчлүүлэгчийн төв хуудас (/faq)</strong>-ны агуулгыг хариуцдаг. Эдгээр нь өөр өөр зүйл.</li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {savedAt && (
                        <span className="text-xs text-teal-600 dark:text-teal-400">
                            Хадгалагдсан ({savedAt})
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-bold bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        {saving ? 'Хадгалж байна...' : 'Бүгдийг хадгалах'}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {rows.map((row, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                Q{i + 1}.
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(i, -1)}
                                    disabled={i === 0}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Дээш"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(i, 1)}
                                    disabled={i === rows.length - 1}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Доош"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeRow(i)}
                                    className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center"
                                    title="Устгах"
                                >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                            </div>
                        </div>

                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                            Асуулт (Япон хэл)
                        </label>
                        <input
                            type="text"
                            value={row.question}
                            onChange={(e) => update(i, { question: e.target.value })}
                            placeholder="예) 출발 전에 무엇을 준비하면 되나요?"
                            className="w-full px-3 py-2 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />

                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                            Хариулт (Япон хэл)
                        </label>
                        <textarea
                            value={row.answer}
                            onChange={(e) => update(i, { answer: e.target.value })}
                            rows={3}
                            placeholder="예) 국제선 항공권, 여권(유효기간 6개월 이상), 몽골 비자가 필요합니다..."
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-y min-h-[80px]"
                        />
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        Бүртгэгдсэн FAQ алга байна. Доорх "Асуулт нэмэх" товчоор эхлүүлнэ үү.
                    </div>
                )}

                <button
                    type="button"
                    onClick={addRow}
                    className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Асуулт нэмэх
                </button>
            </div>
        </div>
    );
};

export default TourFAQEditor;
