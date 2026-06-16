import React, { useState, useEffect } from 'react';

import { GuideSelectionModal, AccommodationSelectionModal } from './SelectionModals';
import { sendNotificationEmail } from '../../lib/email';
import { api } from '../../lib/api';
import { ReservationDocumentEditor, type ReservationDocContent } from './ReservationDocumentEditor';
import { decodeTemplateDescription, mergeDocumentSettings } from '../../pages/AdminTemplateManage';

export interface QuoteRequest {
    id: string;
    type: 'personal' | 'business';
    name: string;
    destination: string;
    headcount: string;
    period: string;
    date: string;
    status: 'new' | 'processing' | 'completed' | 'converted' | 'reservation_requested' | 'answered';
    adminNote?: string;
    estimateUrl?: string;
    userId?: string;
    // Detailed fields
    phone: string;
    email: string;
    travelTypes: string[];
    accommodations: string[];
    vehicle: string;
    budget: string;
    additionalRequest: string;
    attachment?: File | Blob;
    createdAt: string;
    confirmed_price?: number;
    confirmed_start_date?: string;
    confirmed_end_date?: string;
    deposit?: number;
    deposit_status?: 'paid' | 'unpaid';
    balance_status?: 'paid' | 'unpaid';
    itineraryTemplateId?: string;
    itinerary_template_id?: string;
    documentContent?: ReservationDocContent | null;
    document_content?: any;
}

// Helper functions for currency formatting
const formatNumber = (num: number | string) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const unformatNumber = (str: string) => {
    return parseInt(str.replace(/,/g, '')) || 0;
};

// Conversion Modal Component
export const ConvertSelectionModal: React.FC<{
    request: QuoteRequest | null;
    onClose: () => void;
    onConvert: (data: { startDate: string; endDate: string; totalAmount: number; deposit: number }) => void;
}> = ({ request, onClose, onConvert }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalAmount, setTotalAmount] = useState(0);
    const [deposit, setDeposit] = useState(0);

    useEffect(() => {
        if (!request) return;

        // 1순위: 이미 견적서에서 확정된 금액/날짜가 있으면 우선 사용
        if (request.confirmed_start_date) setStartDate(request.confirmed_start_date.substring(0, 10));
        if (request.confirmed_end_date) setEndDate(request.confirmed_end_date.substring(0, 10));
        if (request.confirmed_price) {
            setTotalAmount(request.confirmed_price);
            setDeposit(request.deposit || Math.floor(request.confirmed_price * 0.1));
            return;
        }

        // 2순위: 확정 데이터 없으면 period 문자열 파싱
        if (!request.confirmed_start_date && request.period && request.period.includes('~')) {
            const parts = request.period.split('~').map(p => p.trim());
            if (parts.length === 2) {
                if (parts[0].includes('-') && parts[0].length >= 10) {
                    setStartDate(parts[0].substring(0, 10));
                    setEndDate(parts[1].substring(0, 10));
                } else if (parts[0].includes('.')) {
                    const year = new Date().getFullYear();
                    const [startMonth, startDay] = parts[0].split('.').map(n => n.padStart(2, '0'));
                    const [endMonth, endDay] = parts[1].split('.').map(n => n.padStart(2, '0'));
                    setStartDate(`${year}-${startMonth}-${startDay}`);
                    setEndDate(`${year}-${endMonth}-${endDay}`);
                }
            }
        }

        // 3순위: 금액은 예산 문자열에서 파싱
        if (!request.confirmed_price && request.budget) {
            const budgetMatch = request.budget.match(/(\d+)/);
            if (budgetMatch) {
                const budgetNum = parseInt(budgetMatch[1]) * 10000;
                setTotalAmount(budgetNum);
                setDeposit(Math.floor(budgetNum * 0.1));
            }
        }
    }, [request]);

    if (!request) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">sync_alt</span>
                        Захиалга баталгаажуулах ба шилжүүлэх
                    </h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200 text-sm rounded-lg mb-4">
                        <b>{request.name}</b>-н үнийн саналын хүсэлтийг албан ёсны захиалга болгон шилжүүлнэ.<br />
                        Баталгаажсан хөтөлбөр болон үнийн дүнг оруулна уу.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Аяллын эхлэх өдөр</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Аяллын дуусах өдөр</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Нийт баталгаажсан үнэ (원)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={formatNumber(totalAmount)}
                                    onChange={e => {
                                        const val = unformatNumber(e.target.value);
                                        setTotalAmount(val);
                                        if (deposit === 0) setDeposit(Math.floor(val * 0.1));
                                    }}
                                    className="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary font-bold text-right pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                            </div>
                            {totalAmount > 0 && (
                                <p className="text-[10px] font-bold text-primary/70 ml-1">
                                    ≈ {typeof totalAmount === 'number' && !isNaN(totalAmount) ? (totalAmount / 10000).toLocaleString() : 0}만원
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Урьдчилгаа (원)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={formatNumber(deposit)}
                                    onChange={e => setDeposit(unformatNumber(e.target.value))}
                                    className="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary font-bold text-right text-primary pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                            </div>
                            {deposit > 0 && (
                                <p className="text-[10px] font-bold text-primary/70 ml-1">
                                    ≈ {typeof deposit === 'number' && !isNaN(deposit) ? (deposit / 10000).toLocaleString() : 0}만원
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Balance Preview */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${totalAmount - deposit < 0 ? 'bg-red-50 border-red-100' : 'bg-primary/5 border-primary/10'}`}>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${totalAmount - deposit < 0 ? 'text-red-600' : 'text-primary'}`}>Тооцоолсон газар дээр төлөх үлдэгдэл</span>
                            {totalAmount - deposit < 0 && (
                                <span className="text-[9px] text-red-500 font-bold mt-0.5 animate-pulse">! Урьдчилгаа нийт дүнгээс хэтэрсэн байна</span>
                            )}
                        </div>
                        <span className={`text-base font-extrabold ${totalAmount - deposit < 0 ? 'text-red-600' : 'text-primary'}`}>
                            {typeof totalAmount === 'number' && typeof deposit === 'number' && !isNaN(totalAmount) && !isNaN(deposit) ? (totalAmount - deposit).toLocaleString() : 0}원
                        </span>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm"
                    >
                        Цуцлах
                    </button>
                    <button
                        onClick={() => {
                            if (!startDate || !endDate || totalAmount <= 0) {
                                alert('Огноо болон үнийн дүнг бүгдийг оруулна уу.');
                                return;
                            }
                            onConvert({ startDate, endDate, totalAmount, deposit });
                        }}
                        className="px-4 py-2 bg-primary-dark hover:bg-primary-dark text-white font-bold rounded-lg text-sm shadow-lg shadow-primary/20"
                    >
                        Захиалга үүсгэх ба баталгаажуулах
                    </button>
                </div>
            </div>
        </div>
    );
};

// Quote Detail Modal (Updated to receive onOpenConvert)
export const QuoteDetailModal: React.FC<{
    request: QuoteRequest | null;
    onClose: () => void;
    onSendEstimate: (url: string, note: string, priceDetail: any, startDate: string, endDate: string, itineraryTemplateId?: string) => void;
    onOpenConvert: () => void;
    onUpdateQuote: (id: string, updates: Partial<QuoteRequest>) => Promise<void>;
}> = ({ request, onClose, onSendEstimate, onOpenConvert, onUpdateQuote }) => {
    const [estimateUrl, setEstimateUrl] = useState(request?.estimateUrl || '');
    const [adminNote, setAdminNote] = useState(request?.adminNote || '');
    const [copiedEstimateUrl, setCopiedEstimateUrl] = useState(false);

    // 맞춤 일정표 — 고객 견적 페이지에 함께 보낼 일정표 템플릿
    const [templatesList, setTemplatesList] = useState<any[]>([]);
    const [itineraryTemplateId, setItineraryTemplateId] = useState<string>(request?.itineraryTemplateId || request?.itinerary_template_id || '');
    const [docEditorOpen, setDocEditorOpen] = useState(false);
    useEffect(() => {
        api.itineraryTemplates.list().then((d: any) => { if (Array.isArray(d)) setTemplatesList(d); }).catch(() => {});
    }, []);

    // --- Added for Centralized UI Integration ---
    const [priceDetail, setPriceDetail] = useState({
        totalAmount: request?.confirmed_price || 0,
        deposit: request?.deposit || 0,
        depositStatus: request?.deposit_status || 'unpaid',
        balanceStatus: request?.balance_status || 'unpaid'
    });
    const [assignedGuide, setAssignedGuide] = useState<any>(null);
    const [dailyAccommodations, setDailyAccommodations] = useState<any[]>([]);

    // Confirmed Dates
    const [confirmedStartDate, setConfirmedStartDate] = useState(request?.confirmed_start_date || '');
    const [confirmedEndDate, setConfirmedEndDate] = useState(request?.confirmed_end_date || '');

    // UI Toggles
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showAccommodationModal, setShowAccommodationModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(1);
    const [extraDays, setExtraDays] = useState(0);

    const getTripDays = () => (1 + extraDays);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        destination: '',
        headcount: '',
        period: '',
        budget: '',
        travelTypes: [] as string[],
        accommodations: [] as string[],
        vehicle: '',
        confirmedPrice: 0,
        deposit: 0
    });

    useEffect(() => {
        if (request) {
            setEstimateUrl(request.estimateUrl || '');
            setAdminNote(request.adminNote || '');
            setEditForm({
                destination: request.destination,
                headcount: request.headcount,
                period: request.period,
                budget: request.budget,
                travelTypes: request.travelTypes,
                accommodations: request.accommodations,
                vehicle: request.vehicle,
                confirmedPrice: request.confirmed_price || 0,
                deposit: request.deposit || 0
            });
            // Reset priceDetail when request changes
            setPriceDetail({
                totalAmount: request.confirmed_price || 0,
                deposit: request.deposit || 0,
                depositStatus: request.deposit_status || 'unpaid',
                balanceStatus: request.balance_status || 'unpaid'
            });
            setConfirmedStartDate(request.confirmed_start_date || '');
            setConfirmedEndDate(request.confirmed_end_date || '');
            setItineraryTemplateId(request.itineraryTemplateId || request.itinerary_template_id || '');
        }
    }, [request]);

    const handleGuideAssign = (guide: any) => {
        setAssignedGuide({ ...guide });
    };

    const handleAccommodationAssign = (accommodation: any) => {
        const existingIndex = dailyAccommodations.findIndex(d => d.day === selectedDay);
        const newDaily = {
            day: selectedDay,
            accommodation: {
                id: accommodation.id,
                name: accommodation.name,
                type: accommodation.type
            }
        };
        const updated = existingIndex >= 0
            ? dailyAccommodations.map((d, i) => i === existingIndex ? newDaily : d)
            : [...dailyAccommodations, newDaily].sort((a, b) => a.day - b.day);
        setDailyAccommodations(updated);
    };

    const handleSendGuideInfo = async () => {
        if (!assignedGuide || !request) return;
        if (!confirm('Хөтчийн хуваарилалтын мэдээллийг үйлчлүүлэгчид имэйлээр илгээх үү?')) return;
        try {
            await sendNotificationEmail(
                request.email,
                'GUIDE_ASSIGNED',
                {
                    customerName: request.name,
                    productName: request.destination,
                    guideName: assignedGuide.name,
                    guidePhone: assignedGuide.phone
                }
            );
            alert('Хөтчийн хуваарилалтын мэдээлэл илгээгдлээ.');
        } catch (e) {
            console.error(e);
            alert('Илгээж чадсангүй');
        }
    };

    const handleSaveEdit = async () => {
        if (!request) return;

        await onUpdateQuote(request.id, {
            ...editForm
        } as any);
        setIsEditing(false);
    };

    if (!request) return null;

    // 문서 편집기 (견적용) — 고객 데이터 자동 채움, document_content 저장
    const quotePeople = parseInt(String(request.headcount || '').replace(/[^0-9]/g, '')) || 0;
    const docTripLength = (() => {
        if (!confirmedStartDate || !confirmedEndDate) return '';
        const s = new Date(confirmedStartDate); const e = new Date(confirmedEndDate);
        const ms = e.getTime() - s.getTime();
        if (isNaN(ms) || ms < 0) return '';
        const nights = Math.round(ms / 86400000);
        return `${nights}박${nights + 1}일`;
    })();
    const docCustomer = {
        tripNumber: request.id.slice(0, 8).toUpperCase(),
        period: request.period || '',
        tripLength: docTripLength || undefined,
        headcount: request.headcount || '',
        name: request.name,
        tripType: request.destination,
        totalAmount: priceDetail.totalAmount || undefined,
        deposit: priceDetail.deposit || undefined,
        localAmount: priceDetail.totalAmount ? (priceDetail.totalAmount - (priceDetail.deposit || 0)) : undefined,
        peopleCount: quotePeople || undefined,
    };
    const docInitialContent: ReservationDocContent | null = (() => {
        const dc = request.documentContent || request.document_content;
        if (dc && (Array.isArray(dc.days) || dc.documentSettings)) {
            return { name: dc.name || '', description: dc.description || '', days: dc.days || [], documentSettings: mergeDocumentSettings(dc.documentSettings) };
        }
        const tpl = templatesList.find((t: any) => t.id === itineraryTemplateId);
        if (tpl) {
            const decoded = decodeTemplateDescription(tpl.description || '');
            let tDays: any[] = [];
            try { tDays = typeof tpl.days === 'string' ? JSON.parse(tpl.days || '[]') : (tpl.days || []); } catch { tDays = []; }
            return { name: tpl.name || '', description: decoded.description || '', days: tDays, documentSettings: decoded.documentSettings };
        }
        return null;
    })();
    const saveQuoteDoc = async (content: ReservationDocContent) => {
        await (api.quotes as any).update(request.id, { document_content: JSON.stringify(content) });
        await onUpdateQuote(request.id, { documentContent: content } as any);
    };

    const quoteStatusMeta: Record<string, { label: string; tone: string }> = {
        new: { label: 'Шинэ хүсэлт', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
        processing: { label: 'Үнийн санал боловсруулж байна', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
        answered: { label: 'Үнийн санал илгээгдсэн', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
        reservation_requested: { label: 'Захиалгын хүсэлт', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
        converted: { label: 'Захиалга болгон шилжүүлсэн', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
        completed: { label: 'Дууссан', tone: 'bg-teal-50 text-teal-700 border-teal-200' },
    };

    const workflowSteps = [
        { key: 'new', label: 'Хүсэлт шалгах', icon: 'fact_check' },
        { key: 'processing', label: 'Үнийн санал бэлтгэх', icon: 'edit_note' },
        { key: 'answered', label: 'Үйлчлүүлэгчид илгээх', icon: 'outgoing_mail' },
        { key: 'reservation_requested', label: 'Захиалгын хүсэлт', icon: 'event_available' },
        { key: 'converted', label: 'Захиалга болгох', icon: 'task_alt' },
    ];

    const currentStepIndex = Math.max(0, workflowSteps.findIndex((step) => step.key === request.status));
    const statusMeta = quoteStatusMeta[request.status] || quoteStatusMeta.new;
    // 발송 조건: Google 견적서 URL이 있으면 그것만으로 발송 가능.
    // URL이 없을 때만 기존처럼 확정 일정 + 견적 금액(금액 ≥ 예약금)을 요구 — 빈 견적 발송 방지.
    const hasEstimateUrl = Boolean((estimateUrl || '').trim());
    const hasConfirmedPlan = Boolean(confirmedStartDate && confirmedEndDate)
        && priceDetail.totalAmount > 0
        && priceDetail.totalAmount >= priceDetail.deposit;
    const canSendEstimate = hasEstimateUrl || hasConfirmedPlan;
    const quickNotes = [
        {
            label: 'Үндсэн заавар',
            text: '견적 내용을 확인해 주세요. 일정과 요금에 문제가 없으시면 예약 상담으로 진행해 주시기 바랍니다.',
        },
        {
            label: 'Зөвлөгөө өгөх',
            text: '요청하신 조건에 맞추어 일정과 요금을 조정하였습니다. 궁금하신 점이나 변경을 원하시는 부분이 있으시면 언제든 편하게 문의해 주시기 바랍니다.',
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-gray-100 font-sans">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full bg-primary"></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Захиалгат үнийн саналын удирдлага</h2>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">No. {request.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <span className={`ml-2 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusMeta.tone}`}>
                            {statusMeta.label}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="grid gap-3 md:grid-cols-5">
                            {workflowSteps.map((step, index) => {
                                const isActive = index === currentStepIndex;
                                const isDone = index < currentStepIndex;

                                return (
                                    <div
                                        key={step.key}
                                        className={`rounded-xl border p-3 transition-colors ${isActive
                                            ? 'border-primary/30 bg-white text-primary shadow-sm dark:bg-slate-800'
                                            : isDone
                                                ? 'border-teal-100 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300'
                                                : 'border-slate-100 bg-white/70 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60'
                                            }`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="material-symbols-outlined text-[18px]">{isDone ? 'check_circle' : step.icon}</span>
                                            <span className="text-[10px] font-black">STEP {index + 1}</span>
                                        </div>
                                        <p className="text-xs font-black">{step.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span className="material-symbols-outlined text-base text-primary">summarize</span>
                                    Хүсэлтийн товч
                                </h3>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    Мэдээлэл засах
                                </button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Үйлчлүүлэгч</p>
                                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{request.name}</p>
                                    <p className="mt-1 truncate text-xs text-slate-500">{request.phone || request.email}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Аяллын нөхцөл</p>
                                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{request.destination || 'Очих газар тодорхойгүй'}</p>
                                    <p className="mt-1 text-xs text-slate-500">{request.headcount || 'Хүний тоо тодорхойгүй'} · {request.period || 'Хөтөлбөр тодорхойгүй'}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Төсөв/тээврийн хэрэгсэл</p>
                                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{request.budget || 'Төсөв тодорхойгүй'}</p>
                                    <p className="mt-1 text-xs text-slate-500">{request.vehicle || 'Тээврийн хэрэгсэл/хөтөч тодорхойгүй'}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Үнийн санал</p>
                                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{priceDetail.totalAmount ? `${priceDetail.totalAmount.toLocaleString()}엔` : 'Оруулаагүй'}</p>
                                    <p className="mt-1 text-xs text-slate-500">Урьдчилгаа {priceDetail.deposit ? `${priceDetail.deposit.toLocaleString()}엔` : '0엔'}</p>
                                </div>
                            </div>
                        </div>

                    {/* Quote Workspace */}
                    <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm dark:border-teal-500/20 dark:bg-slate-800">
                        <div className="flex flex-col gap-3 border-b border-teal-100 bg-teal-50/70 px-6 py-5 dark:border-teal-500/20 dark:bg-teal-500/10 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[22px] text-primary">contract_edit</span>
                                    Үнийн санал боловсруулах ажлын талбар
                                </h3>
                                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Google үнийн саналын холбоос оруулбал шууд илгээх боломжтой. Холбоосгүй бол баталгаажсан хөтөлбөр, үнэ·урьдчилгааг оруулна уу.
                                </p>
                            </div>
                            {request.status === 'reservation_requested' && (
                                <button
                                    onClick={onOpenConvert}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-700"
                                >
                                    <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                                    Захиалга болгон шилжүүлэх
                                </button>
                            )}
                        </div>

                        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
                            <div className="space-y-5 border-b border-slate-100 p-6 dark:border-slate-700 lg:border-b-0 lg:border-r">
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="material-symbols-outlined text-base text-primary">event</span>
                                        1. Баталгаажсан хөтөлбөр
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="mb-1.5 block text-[10px] font-bold text-slate-400">Эхлэх өдөр</span>
                                            <input
                                                type="date"
                                                value={confirmedStartDate}
                                                onChange={(e) => setConfirmedStartDate(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-[10px] font-bold text-slate-400">Дуусах өдөр</span>
                                            <input
                                                type="date"
                                                value={confirmedEndDate}
                                                onChange={(e) => setConfirmedEndDate(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="material-symbols-outlined text-base text-primary">payments</span>
                                        2. Үнэ оруулах
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Нийт төлбөр</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={formatNumber(priceDetail.totalAmount)}
                                                    onChange={(e) => {
                                                        const total = unformatNumber(e.target.value);
                                                        // 예약금이 비어 있으면 10% 자동 제안
                                                        setPriceDetail(prev => ({
                                                            ...prev,
                                                            totalAmount: total,
                                                            deposit: prev.deposit ? prev.deposit : Math.floor(total * 0.1),
                                                        }));
                                                    }}
                                                    className="w-full bg-transparent text-right text-2xl font-black text-slate-900 outline-none dark:text-white"
                                                    placeholder="0"
                                                />
                                                <span className="text-sm font-bold text-slate-400">엔</span>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Урьдчилгаа</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={formatNumber(priceDetail.deposit)}
                                                    onChange={(e) => setPriceDetail({ ...priceDetail, deposit: unformatNumber(e.target.value) })}
                                                    className="w-full bg-transparent text-right text-2xl font-black text-primary outline-none dark:text-teal-300"
                                                    placeholder="0"
                                                />
                                                <span className="text-sm font-bold text-teal-500">엔</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 ${priceDetail.totalAmount - priceDetail.deposit < 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
                                        <span className="text-xs font-bold">Тооцоолсон үлдэгдэл</span>
                                        <span className="text-base font-black">
                                            {typeof priceDetail.totalAmount === 'number' && typeof priceDetail.deposit === 'number' && !isNaN(priceDetail.totalAmount) && !isNaN(priceDetail.deposit) ? (priceDetail.totalAmount - priceDetail.deposit).toLocaleString() : 0}엔
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="material-symbols-outlined text-base text-primary">link</span>
                                        3. Үнийн саналын хуудасны холбоос
                                        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">сонголт</span>
                                    </h4>
                                    <p className="mb-2 text-[11px] font-medium text-slate-400">
                                        Хоосон орхивол үйлчлүүлэгч системийн үнийн саналын хуудсаар хүлээн авна. Гадны үнийн саналын хуудас хавсаргах үед л оруулна уу.
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            type="url"
                                            value={estimateUrl}
                                            onChange={(e) => setEstimateUrl(e.target.value)}
                                            placeholder="https://docs.google.com/... (сонголт)"
                                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => estimateUrl && window.open(estimateUrl, '_blank')}
                                                disabled={!estimateUrl}
                                                className={`h-[46px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${estimateUrl ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'}`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                Харах
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!estimateUrl) return;
                                                    await navigator.clipboard.writeText(estimateUrl);
                                                    setCopiedEstimateUrl(true);
                                                    setTimeout(() => setCopiedEstimateUrl(false), 1500);
                                                }}
                                                disabled={!estimateUrl}
                                                className={`h-[46px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${estimateUrl ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'}`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">{copiedEstimateUrl ? 'check' : 'content_copy'}</span>
                                                {copiedEstimateUrl ? 'Хуулсан' : 'Хуулах'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <span className="material-symbols-outlined text-base text-primary">chat</span>
                                            4. Үйлчлүүлэгчид зориулсан тэмдэглэл
                                            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">сонголт</span>
                                        </h4>
                                        <div className="flex gap-1.5">
                                            {quickNotes.map((note) => (
                                                <button
                                                    key={note.label}
                                                    type="button"
                                                    onClick={() => setAdminNote(note.text)}
                                                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition-colors hover:bg-teal-50 hover:text-primary dark:bg-slate-900 dark:text-slate-300"
                                                >
                                                    {note.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Үйлчлүүлэгчийн дэлгэцэнд солонгос хэлээр харагдах тул солонгос хэлээр тэмдэглэл оруулна уу."
                                        className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="material-symbols-outlined text-base text-primary">event_note</span>
                                        5. Захиалгат хөтөлбөр
                                        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">сонголт</span>
                                    </h4>
                                    <p className="mb-2 text-[11px] font-medium text-slate-400">
                                        Сонговол үйлчлүүлэгчийн үнийн саналын дэлгэцэнд <b>зурагтай дэлгэрэнгүй хөтөлбөр</b> зардлын хамт харагдана.
                                    </p>
                                    <select
                                        value={itineraryTemplateId}
                                        onChange={(e) => setItineraryTemplateId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Хөтөлбөргүй (зөвхөн зардал)</option>
                                        {templatesList.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {templatesList.length === 0 && (
                                        <p className="mt-1.5 text-[11px] font-medium text-amber-600">Бүртгэгдсэн хөтөлбөр алга. [Загвар удирдлага] хэсэгт эхлээд үүсгэнэ үү.</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setDocEditorOpen(true)}
                                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-5 py-3 text-sm font-black text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-700 dark:bg-slate-800 dark:text-teal-300"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                                    Хөтөлбөр засах · нэр·огноо·хүн·үнэ автоматаар бөглөгдөнө
                                </button>
                                <button
                                    onClick={() => onSendEstimate(estimateUrl, adminNote, priceDetail, confirmedStartDate, confirmedEndDate, itineraryTemplateId)}
                                    disabled={!canSendEstimate}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark px-5 py-4 text-sm font-black text-white shadow-lg shadow-primary-dark/20 transition-all hover:bg-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700"
                                    title={!canSendEstimate ? 'Google үнийн саналын холбоос эсвэл баталгаажсан хөтөлбөр+үнэ·урьдчилгааг оруулбал илгээнэ.' : undefined}
                                >
                                    <span className="material-symbols-outlined text-[20px]">send</span>
                                    Үнийн санал илгээх
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Guide Assignment (NEW) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">hail</span>
                                Хөтөч хуваарилах
                            </h3>
                        </div>

                        {assignedGuide ? (
                            <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 dark:border-primary/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{assignedGuide.name}</p>
                                        <p className="text-xs text-slate-500">{assignedGuide.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSendGuideInfo}
                                        className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-primary/20 text-primary rounded-lg hover:bg-primary/5 font-bold"
                                    >
                                        Мэдээлэл илгээх
                                    </button>
                                    <button
                                        onClick={() => setShowGuideModal(true)}
                                        className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-sm transition-all"
                                    >
                                        Солих
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowGuideModal(true)}
                                className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-dark hover:border-primary/20 hover:bg-primary/5 transition-all"
                            >
                                <span className="material-symbols-outlined text-3xl">add_circle</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Хөтөч хуваарилах</span>
                            </button>
                        )}
                    </div>

                    {/* Accommodation Assignment (NEW) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">hotel</span>
                                Байр хуваарилах
                            </h3>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setExtraDays(Math.max(0, extraDays - 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 shadow-sm text-slate-500"
                                >-</button>
                                <span className="text-[10px] font-bold px-2 text-slate-600 dark:text-slate-300">{getTripDays()} дэх өдөр</span>
                                <button
                                    onClick={() => setExtraDays(extraDays + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 shadow-sm text-slate-500"
                                >+</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from({ length: getTripDays() }).map((_, i) => {
                                const dayNum = i + 1;
                                const assigned = dailyAccommodations.find(d => d.day === dayNum);
                                return (
                                    <div
                                        key={dayNum}
                                        className={`p-3 rounded-xl border transition-all ${assigned ? 'border-primary/10 bg-primary/10' : 'border-slate-100 bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dayNum} дэх өдөр</span>
                                            {assigned && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(dayNum);
                                                        setShowAccommodationModal(true);
                                                    }}
                                                    className="text-[10px] text-primary-dark font-bold"
                                                >Солих</button>
                                            )}
                                        </div>
                                        {assigned ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-primary-dark">
                                                    <span className="material-symbols-outlined text-sm">home</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{assigned.accommodation.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{assigned.accommodation.type}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedDay(dayNum);
                                                    setShowAccommodationModal(true);
                                                }}
                                                className="w-full py-3 border border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-1 text-slate-400 hover:text-primary hover:bg-white transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Хуваарилах</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Customer Info Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">person</span>
                                Хүсэлт гаргагчийн мэдээлэл
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Нэр</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.name}</p>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Холбоо барих</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.phone}</p>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Имэйл</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={request.email}>{request.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Travel Info Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">explore</span>
                                Аяллын үндсэн мэдээлэл
                            </h3>
                            <button
                                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                                className={`text-[10px] px-3 py-1 rounded-lg font-bold transition-all ${isEditing ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900/80 dark:text-slate-400'}`}
                            >
                                {isEditing ? 'Хадгалах' : 'Мэдээлэл засах'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs text-slate-500">Аялах газар</span>
                                    {isEditing ? (
                                        <input
                                            value={editForm.destination}
                                            onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                                            className="text-right text-sm font-bold bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-primary/20 dark:border-primary/30 outline-none focus:border-primary transition-all"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-primary dark:text-primary-dark">{request.destination}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs text-slate-500">Хүний тоо</span>
                                    {isEditing ? (
                                        <input
                                            value={editForm.headcount}
                                            onChange={e => setEditForm({ ...editForm, headcount: e.target.value })}
                                            className="text-right text-sm font-bold bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-primary/20 dark:border-primary/30 outline-none focus:border-primary transition-all"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.headcount}</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs text-slate-500">Хүссэн хөтөлбөр</span>
                                    {isEditing ? (
                                        <input
                                            value={editForm.period}
                                            onChange={e => setEditForm({ ...editForm, period: e.target.value })}
                                            className="text-right text-sm font-bold bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-primary/20 dark:border-primary/30 outline-none focus:border-primary transition-all"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.period}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs text-slate-500">Төсөв (нэг хүнд)</span>
                                    {isEditing ? (
                                        <input
                                            value={editForm.budget}
                                            onChange={e => setEditForm({ ...editForm, budget: e.target.value })}
                                            className="text-right text-sm font-bold bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-primary/20 dark:border-primary/30 outline-none focus:border-primary transition-all"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.budget}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail Requirements Section */}
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-primary">format_list_bulleted</span>
                            Дэлгэрэнгүй хүсэлт
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Аяллын төрөл</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {request.travelTypes.map(t => (
                                        <span key={t} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Хүссэн байр</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {request.accommodations.map(t => (
                                        <span key={t} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Тээврийн хэрэгсэл/хөтөч</span>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{request.vehicle}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Бусад хүсэлт</span>
                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{request.additionalRequest || 'Нэмэлт хүсэлт байхгүй.'}</div>
                        </div>
                    </div>

                    {/* Attachment Section */}
                    {request.attachment && (
                        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">attach_file</span>
                                Хавсралт файл
                            </h3>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/5 dark:bg-primary/20 flex items-center justify-center text-primary/50">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{(request.attachment as File).name}</p>
                                        <p className="text-xs text-slate-400">{(request.attachment as File).size ? `${((request.attachment as File).size / 1024).toFixed(1)} KB` : ''}</p>
                                    </div>
                                </div>
                                <a
                                    href={URL.createObjectURL(request.attachment)}
                                    download={(request.attachment as File).name}
                                    className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                                >
                                    Файл татаж авах
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between sticky bottom-0 z-10">
                    <p className="text-[10px] font-medium text-slate-400">Хүсэлтийн огноо: {request.date} ({request.createdAt})</p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                        >
                            Хаах
                        </button>
                    </div>
                </div>
            </div>

            <ReservationDocumentEditor
                open={docEditorOpen}
                onClose={() => setDocEditorOpen(false)}
                title={`${request.name || 'Үйлчлүүлэгч'} · Үнийн саналын хуудас`}
                customer={docCustomer}
                initialContent={docInitialContent}
                onSave={saveQuoteDoc}
            />

            {/* Selection Modals */}
            {showGuideModal && (
                <GuideSelectionModal
                    isOpen={showGuideModal}
                    onClose={() => setShowGuideModal(false)}
                    onSelect={handleGuideAssign}
                />
            )}
            {showAccommodationModal && (
                <AccommodationSelectionModal
                    isOpen={showAccommodationModal}
                    day={selectedDay}
                    onClose={() => setShowAccommodationModal(false)}
                    onSelect={handleAccommodationAssign}
                />
            )}
        </div>
    );
};
