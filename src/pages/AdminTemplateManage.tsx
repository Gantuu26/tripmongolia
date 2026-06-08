import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';
import { TouristSpotPickerModal } from '../components/admin/TouristSpotPickerModal';
import { HotelPickerModal } from '../components/admin/HotelPickerModal';
import type { TouristSpot } from '../types/touristSpot';
import type { Hotel } from '../types/hotel';
import mongoliaHero from '../assets/login_bg_3.jpg';

// ─── Types ───────────────────────────────────────────────
export type ActivityType = 'pickup' | 'transport' | 'meal' | 'sightseeing' | 'activity' | 'checkin' | 'free' | 'other';
export interface Activity { time?: string; type?: ActivityType; title: string; description: string; images?: string[]; }
export interface TemplateDay { day: number; title: string; region?: string; activities: Activity[]; }
export interface DocumentSettings {
    overview: {
        subtitle: string;
        heroTagline: string;
        intro: string;
        included: { icon: string; label: string }[];
        includedText: string;
        excludedText: string;
        pricePerPerson: string;
        paymentNote: string;
    };
    contract: {
        intro: string;
        paymentMethod: string;
        paymentDeadline: string;
        bankInfo: string;
        includedText: string;
        excludedText: string;
        cancellationRows: { period: string; fee: string }[];
        signatureNote: string;
    };
    detail: {
        title: string;
        note: string;
        footerBadges: string[];
    };
    guide: {
        notices: { title: string; body: string }[];
        conditions: string;
        paymentInfo: string;
        guideName: string;
        guidePhone: string;
        accommodationInfo: string;
        emergencyPhone: string;
        emergencyEmail: string;
        closingMessage: string;
        qrLabel: string;
    };
}
interface ItineraryTemplate { id: string; name: string; description: string; days: TemplateDay[]; createdAt: string; documentSettings: DocumentSettings; }

const DOC_SETTINGS_MARKER = '\n\n__MILKYWAY_DOCUMENT_SETTINGS__=';

export const defaultDocumentSettings = (): DocumentSettings => ({
    overview: {
        subtitle: '은하수 아래에서 대자연과 문화를 체험하는 특별한 여행으로',
        heroTagline: '전통의상 체험·승마 체험·낙타 체험·게르 체험 모두 포함',
        intro: '예약 내용을 바탕으로 여행 개요·일정·요금을 정리한 확인용 여행 일정표입니다.',
        included: [
            { icon: 'hiking', label: '몽골 전통의상 체험' },
            { icon: 'pets', label: '승마 체험' },
            { icon: 'local_taxi', label: '전용차·기사' },
            { icon: 'hotel', label: '숙박' },
            { icon: 'restaurant', label: '식사 포함' },
            { icon: 'support_agent', label: '한국어 가이드' },
        ],
        includedText: '전용차·기사\n숙박(호텔·게르)\n식사 포함\n한국어 가이드\n전통의상·승마·낙타 체험',
        excludedText: '국제 항공권\n해외여행자보험\n개인 경비\n일정표에 기재되지 않은 식사',
        pricePerPerson: '128000',
        paymentNote: '위 요금에는 일정표에 기재된 서비스가 포함되어 있습니다.',
    },
    contract: {
        intro: '본 여행 조건서 및 아래 여행 조건에 따라 모집형 기획여행 계약을 체결합니다.',
        paymentMethod: '은행 송금',
        paymentDeadline: '안내 메일에 기재된 기일까지',
        bankInfo: '은행명 지점명(보통예금) 1234567\n몽골 은하수 여행사',
        includedText: '숙박비, 식사비, 전용차, 기사, 한국어 가이드, 일정표 기재 체험 요금',
        excludedText: '국제 항공권, 해외여행자보험, 개인 경비, 일정표에 기재되지 않은 식사',
        cancellationRows: [
            { period: '30일~15일 전까지', fee: '여행 대금의 10%' },
            { period: '14일~8일 전까지', fee: '여행 대금의 20%' },
            { period: '7일~3일 전까지', fee: '여행 대금의 30%' },
            { period: '2일 전~당일', fee: '여행 대금의 50%' },
            { period: '연락 없이 불참', fee: '여행 대금의 100%' },
        ],
        signatureNote: '위 내용을 확인하고 동의한 후 본 계약을 체결합니다.',
    },
    detail: {
        title: '여행 일정표(상세)',
        note: '날씨·교통 상황에 따라 일정이 변경될 수 있습니다.',
        footerBadges: ['추가 요금 없는 올인클루시브 플랜', '일정 조정 가능', '전세 전용차로 편안한 이동', '한국어 가이드가 전 일정 지원'],
    },
    guide: {
        notices: [
            { title: '복장 안내', body: '아침저녁으로 쌀쌀할 수 있으므로 걸쳐 입을 수 있는 겉옷을 준비해 주세요.' },
            { title: '숙박 안내', body: '호텔 및 게르 숙박은 현지 사정에 따라 동급으로 변경될 수 있습니다.' },
            { title: '식사 안내', body: '알레르기나 식사 제한이 있는 경우 사전에 알려 주세요.' },
            { title: '준비물 안내', body: '여권, 보험증권, 상비약, 충전기 등을 준비해 주세요.' },
        ],
        conditions: '본 여행은 당사 여행 조건서 및 여행업 약관에 따라 진행됩니다.',
        paymentInfo: '결제 방법: 은행 송금\n결제 기한: 안내 메일에 기재된 기일까지',
        guideName: '',
        guidePhone: '',
        accommodationInfo: '',
        emergencyPhone: '+976-80-1234-5678',
        emergencyEmail: 'info@mongolryokou.com',
        closingMessage: '몽골의 대자연과 문화를 마음껏 즐기시기 바랍니다.',
        qrLabel: '고객 전용 페이지',
    },
});

export const mergeDocumentSettings = (value: any): DocumentSettings => {
    const base = defaultDocumentSettings();
    if (!value || typeof value !== 'object') return base;
    return {
        overview: { ...base.overview, ...(value.overview || {}), included: Array.isArray(value.overview?.included) ? value.overview.included : base.overview.included },
        contract: { ...base.contract, ...(value.contract || {}), cancellationRows: Array.isArray(value.contract?.cancellationRows) ? value.contract.cancellationRows : base.contract.cancellationRows },
        detail: { ...base.detail, ...(value.detail || {}), footerBadges: Array.isArray(value.detail?.footerBadges) ? value.detail.footerBadges : base.detail.footerBadges },
        guide: { ...base.guide, ...(value.guide || {}), notices: Array.isArray(value.guide?.notices) ? value.guide.notices : base.guide.notices },
    };
};

export const decodeTemplateDescription = (raw = '') => {
    const [description, encoded] = raw.split(DOC_SETTINGS_MARKER);
    if (!encoded) return { description: raw, documentSettings: defaultDocumentSettings() };
    try {
        return { description, documentSettings: mergeDocumentSettings(JSON.parse(encoded)) };
    } catch {
        return { description, documentSettings: defaultDocumentSettings() };
    }
};

// 줄 단위 텍스트 → 일정 항목 배열 (전체 텍스트 편집용)
const inferTypeForText = (text: string): ActivityType => {
    const v = (text || '').toLowerCase();
    if (/(공항|픽업|도착|미팅|arrival|airport)/i.test(v)) return 'pickup';
    if (/(이동|출발|전용차|차량|버스|transfer|drive)/i.test(v)) return 'transport';
    if (/(식사|조식|중식|석식|점심|저녁|아침|meal|lunch|dinner|breakfast)/i.test(v)) return 'meal';
    if (/(숙박|호텔|게르|체크인|hotel|stay|check[-\s]?in)/i.test(v)) return 'checkin';
    if (/(체험|승마|낙타|트레킹|공연|activity|experience)/i.test(v)) return 'activity';
    if (/(자유|휴식|free)/i.test(v)) return 'free';
    return 'sightseeing';
};
export const parseDayActivitiesText = (text: string): Activity[] =>
    (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
        const m = line.match(/^(\d{1,2}:\d{2})\s+(.*)$/);
        const title = m ? m[2] : line;
        return { time: m ? m[1] : '', type: inferTypeForText(title), title, description: '' };
    });

const encodeTemplateDescription = (description: string, documentSettings: DocumentSettings) =>
    `${description || ''}${DOC_SETTINGS_MARKER}${JSON.stringify(documentSettings)}`;

const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: string }[] = [
    { id: 'pickup', label: 'Угтах', icon: 'flight_land' },
    { id: 'transport', label: 'Шилжилт', icon: 'directions_car' },
    { id: 'meal', label: 'Хоол', icon: 'restaurant' },
    { id: 'sightseeing', label: 'Аялал жуулчлал', icon: 'photo_camera' },
    { id: 'activity', label: 'Туршлага', icon: 'sports_handball' },
    { id: 'checkin', label: 'Бүртгүүлэх', icon: 'hotel' },
    { id: 'free', label: 'Чөлөөт цаг', icon: 'park' },
    { id: 'other', label: 'Бусад', icon: 'more_horiz' },
];
const TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(t => [t.id, t]));

// 항목 유형별 액센트 색 (목업 디자인: 관광=teal, 숙박=violet, 이동=blue, 식사=amber)
const typeAccent = (type?: ActivityType): { c: string; cb: string } => {
    switch (type) {
        case 'checkin': return { c: '#6a55d6', cb: '#efedfd' };
        case 'pickup':
        case 'transport': return { c: '#2767cf', cb: '#e8f0fd' };
        case 'meal': return { c: '#c97a16', cb: '#fcf2e0' };
        default: return { c: '#0e9c84', cb: '#e4f6f1' };
    }
};

interface Guide {
    id: string; name: string; image: string; introduction: string;
    phone: string; languages: string[]; specialties: string[]; status: string; experienceYears: number;
}

interface Accommodation {
    id: string; name: string; images: string[]; description: string;
    type: string; location: string;
}

const LANGUAGES = ['한국어', '영어', '몽골어', '중국어', '일본어'];
const SPECIALTIES = ['고비사막', '홉스골', '테를지', '승마', '문화체험', '사진촬영'];
const ACCOM_TYPES = { '호텔': ['2성급 호텔', '3성급 호텔', '4성급 호텔', '5성급 호텔'], '게르': ['일반 게르', '고급 게르', '럭셔리 게르'], '게스트하우스': ['게스트하우스'] };

// 모듈 스코프 컴포넌트 — 컴포넌트 내부에 정의하면 입력마다 리마운트되어 포커스·스크롤이 튐
const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-[960px] rounded-[22px] border border-[#8FE7DE] bg-white shadow-sm">{children}</div>
);

// ─── Live Preview (editable PC document preview) ───
type TemplatePreviewProps = {
    name: string;
    description: string;
    days: TemplateDay[];
    documentSettings: DocumentSettings;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onDocSection: <K extends keyof DocumentSettings>(section: K, patch: Partial<DocumentSettings[K]>) => void;
    onIncluded: (idx: number, field: 'icon' | 'label', value: string) => void;
    onCancellation: (idx: number, field: 'period' | 'fee', value: string) => void;
    onGuideNotice: (idx: number, field: 'title' | 'body', value: string) => void;
    // 일정 직접 편집
    onDayChange: (dayIdx: number, field: 'title' | 'region', value: string) => void;
    onActivityChange: (dayIdx: number, actIdx: number, field: 'time' | 'title' | 'description', value: string) => void;
    onAddDay: () => void;
    onAddActivity: (dayIdx: number) => void;
    onRemoveDay: (dayIdx: number) => void;
    onRemoveActivity: (dayIdx: number, actIdx: number) => void;
    onDayActivitiesText?: (dayIdx: number, text: string) => void;
    // 예약/견적에서 열 때 실제 고객 데이터 자동 표시 (없으면 샘플)
    customer?: {
        tripNumber?: string;
        period?: string;
        tripLength?: string;
        headcount?: string;
        name?: string;
        tripType?: string;
        totalAmount?: number;
        deposit?: number;
        localAmount?: number;
        peopleCount?: number;
    } | null;
    assignedGuide?: { name?: string; phone?: string; image?: string } | null;
    dailyAccommodations?: Array<{ day: number; accommodation: { name?: string; type?: string; location?: string } }>;
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ name, description, days, documentSettings, customer, assignedGuide, dailyAccommodations, onNameChange, onDescriptionChange, onDocSection, onIncluded, onCancellation, onGuideNotice, onDayChange, onActivityChange, onAddDay, onAddActivity, onRemoveDay, onRemoveActivity, onDayActivitiesText }) => {
    const [activePage, setActivePage] = useState<'overview' | 'contract' | 'detail' | 'guide'>('overview');
    const [textDays, setTextDays] = useState<Set<number>>(new Set());
    const toggleTextDay = (i: number) => setTextDays(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
    const totalDays = days.length;
    const nights = Math.max(0, totalDays - 1);
    const settings = mergeDocumentSettings(documentSettings);
    const peopleCount = customer?.peopleCount || 2;
    const samplePrice = (customer?.totalAmount && peopleCount) ? Math.round(customer.totalAmount / peopleCount) : (Number(settings.overview.pricePerPerson || 0) || 128000);
    const sampleTotal = customer?.totalAmount ?? samplePrice * peopleCount;
    const sampleDeposit = customer?.deposit ?? Math.floor(sampleTotal * 0.1);
    const sampleLocal = customer?.localAmount ?? (sampleTotal - sampleDeposit);
    const tripLength = customer?.tripLength || `${nights}박 ${totalDays || 0}일`;
    const guideText = assignedGuide?.name
        ? `${assignedGuide.name}${assignedGuide.phone ? `（${assignedGuide.phone}）` : ''}`
        : '한국어 가이드가 전 일정 동행합니다';
    const getAccommodation = (day: number) => dailyAccommodations?.find(item => item.day === day)?.accommodation;
    const accommodationSummary = dailyAccommodations?.length
        ? dailyAccommodations
            .filter(item => item.accommodation?.name)
            .sort((a, b) => a.day - b.day)
            .map(item => `${item.day}일차: ${item.accommodation.name}`)
            .join(' / ')
        : '출발 전까지 안내해 드립니다';
    const pages = [
        { id: 'overview' as const, label: 'Аялалын хуваарь', icon: 'article' },
        { id: 'contract' as const, label: 'Гэрээ', icon: 'contract' },
        { id: 'detail' as const, label: 'Дэлгэрэнгүй', icon: 'route' },
        { id: 'guide' as const, label: 'Заавар', icon: 'info' },
    ];
    const rows = [
        ['여행 번호', customer?.tripNumber || 'QT-20240604-001'],
        ['여행 기간', `${customer?.period || '2026년 6월 10일(화) ~ 2026년 6월 13일(금)'} ${tripLength}`],
        ['참가 인원', customer?.headcount || '성인 2명 / 아동 0명'],
        ['고객명', `${customer?.name || '홍길동'} 님`],
        ['여행 형태', customer?.tripType || '전세 프라이빗 투어'],
    ];
    const fieldClass = 'w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-[#8FE7DE] hover:bg-white/80 focus:border-[#39C4B7] focus:bg-white focus:ring-2 focus:ring-[#39C4B7]/15';
    // Frame은 모듈 스코프로 이동 (입력마다 리마운트되어 스크롤·포커스가 튀던 문제 수정)

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#F7FAFA] dark:bg-slate-900">
            <div className="border-b border-[#8FE7DE]/60 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <span className="material-symbols-outlined text-[15px]">edit_note</span>PDF дэлгэцэн дээр шууд засах
                    </p>
                    <span className="rounded-full bg-[#39C4B7]/10 px-3 py-1 text-[11px] font-black text-[#0F8F84]">Дарж засах</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-[#EAF8F7] p-1">
                    {pages.map(page => (
                        <button key={page.id} onClick={() => setActivePage(page.id)} className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black transition-colors ${activePage === page.id ? 'bg-white text-[#0F8F84] shadow-sm' : 'text-slate-500 hover:bg-white/60'}`} title={page.label}>
                            <span className="material-symbols-outlined text-[15px]">{page.icon}</span><span className="truncate">{page.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            {customer ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-teal-200 bg-teal-50 px-4 py-2 text-[11px] font-bold text-[#0F8F84] dark:border-teal-800 dark:bg-teal-900/20">
                    <span className="material-symbols-outlined text-[15px]">person</span>
                    <span>{customer.name || 'Үйлчлүүлэгч'}-н баримт — үйлчлүүлэгчийн мэдээлэл, дүн автоматаар тусгагдсан</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5"><span className="material-symbols-outlined text-[13px]">badge</span>{guideText}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5"><span className="material-symbols-outlined text-[13px]">hotel</span>{dailyAccommodations?.length ? `${dailyAccommodations.length} өдрийн байр хуваарилагдсан` : 'Байр хуваарилагдаагүй'}</span>
                </div>
            ) : (
                <div className="flex items-start gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    <span>Жишээ (загвар) харагдац. Бодит үйлчлүүлэгчийн мэдээллийг <b>Захиалгын нэгдсэн удирдлага → Захиалга/Үнийн санал → «Баримт засах»</b>-аар нээвэл автоматаар бөглөгдөнө.</span>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
                {activePage === 'overview' && <Frame>
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-2 text-[#0F8F84]"><span className="material-symbols-outlined text-[28px]">landscape</span><div><p className="text-[12px] font-black">몽골 은하수 여행사</p><p className="text-[8px] font-bold tracking-widest">MILKYWAY JAPAN</p></div></div>
                        <div className="text-right"><p className="text-[22px] font-black tracking-[0.12em] text-[#0F8F84]">여행 일정표</p><input value={settings.overview.subtitle} onChange={e => onDocSection('overview', { subtitle: e.target.value })} className={`${fieldClass} max-w-[260px] text-right text-[10px] font-semibold leading-snug text-slate-400`} /></div>
                    </div>
                    <div className="relative h-[220px] overflow-hidden"><img src={mongoliaHero} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#00796F]/90 via-[#0F8F84]/45 to-transparent" /><div className="absolute bottom-5 left-5 right-5 text-white"><span className="rounded-xl bg-[#0F8F84] px-3 py-2 text-xs font-black">{tripLength}</span><input value={name} onChange={e => onNameChange(e.target.value)} placeholder="은하수·대자연 패키지" className={`${fieldClass} mt-3 block max-w-[520px] text-[28px] font-black leading-tight text-white placeholder:text-white/70`} /><input value={description || settings.overview.heroTagline} onChange={e => onDescriptionChange(e.target.value)} className={`${fieldClass} mt-1 max-w-[560px] text-xs font-semibold text-white/90`} /></div></div>
                    <div className="p-5"><h4 className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#0F8F84]"><span className="material-symbols-outlined text-base">check_circle</span>여행 개요</h4><textarea value={settings.overview.intro} onChange={e => onDocSection('overview', { intro: e.target.value })} rows={3} className={`${fieldClass} mb-3 resize-none text-[11px] font-semibold leading-relaxed text-slate-500`} /><div className="overflow-hidden rounded-xl border border-[#8FE7DE] text-xs">{[...rows, ['담당 가이드', guideText], ['숙박', accommodationSummary]].map(([label, value]) => <div key={label} className="grid grid-cols-[112px_1fr] border-b border-[#8FE7DE] last:border-b-0"><div className="bg-[#F7FAFA] px-3 py-2 font-black text-[#0F8F84]">{label}</div><div className="px-3 py-2 font-semibold text-slate-700">{value}</div></div>)}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3"><div><h4 className="mb-1 text-sm font-black text-[#0F8F84]">포함 사항</h4><textarea value={settings.overview.includedText} onChange={e => onDocSection('overview', { includedText: e.target.value })} rows={5} className={`${fieldClass} resize-none text-[11px] font-semibold leading-relaxed text-slate-600`} placeholder="한 줄에 한 항목" /></div><div><h4 className="mb-1 text-sm font-black text-slate-500">불포함 사항</h4><textarea value={settings.overview.excludedText} onChange={e => onDocSection('overview', { excludedText: e.target.value })} rows={5} className={`${fieldClass} resize-none text-[11px] font-semibold leading-relaxed text-slate-600`} placeholder="한 줄에 한 항목" /></div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#8FE7DE] bg-white p-3 text-center"><p className="text-[9px] font-black text-slate-400">참가 인원</p><p className="text-base font-black text-slate-700">{peopleCount}명</p></div><div className="rounded-xl bg-gradient-to-br from-[#0F8F84] to-[#39C4B7] p-3 text-center text-white"><p className="text-[9px] font-black">청구 금액(합계)</p><p className="text-xl font-black">{sampleTotal.toLocaleString()}원</p></div></div><div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#39C4B7] bg-[#EAF8F7] p-3 text-center"><p className="text-[9px] font-black text-[#0F8F84]">예약금(신청 시 결제)</p><p className="text-lg font-black text-[#0F8F84]">{sampleDeposit.toLocaleString()}원</p></div><div className="rounded-xl border border-[#8FE7DE] bg-white p-3 text-center"><p className="text-[9px] font-black text-slate-400">현지 결제 잔금</p><p className="text-lg font-black text-slate-700">{sampleLocal.toLocaleString()}원</p></div></div></div>
                </Frame>}
                {activePage === 'contract' && <Frame><div className="p-5"><div className="mb-5 flex items-start justify-between"><div className="text-[#0F8F84]"><p className="text-[12px] font-black">몽골 은하수 여행사</p><p className="text-[8px] font-bold tracking-widest">MILKYWAY JAPAN</p></div><div className="rounded-lg bg-[#39C4B7]/10 px-3 py-2 text-[9px] font-black text-[#0F8F84]">계약일: 2026년 6월 4일</div></div><h3 className="text-center text-[30px] font-black tracking-[0.18em] text-[#0F8F84]">여행 계약서</h3><p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Travel Contract</p><textarea value={settings.contract.intro} onChange={e => onDocSection('contract', { intro: e.target.value })} rows={3} className={`${fieldClass} mx-auto mt-4 block max-w-[520px] resize-none text-center text-[11px] font-semibold leading-relaxed text-slate-500`} /><div className="mt-5 overflow-hidden rounded-xl border border-[#8FE7DE] text-xs">{[['여행명', name || '은하수·대자연 패키지'], ['여행 기간', tripLength], ['여행 대금', `${samplePrice.toLocaleString()}원(1인)`], ['합계 금액', `${sampleTotal.toLocaleString()}원`], ['가이드', guideText], ['숙박', accommodationSummary]].map(([label, value]) => <div key={label} className="grid grid-cols-[112px_1fr] border-b border-[#8FE7DE] last:border-b-0"><div className="bg-[#F7FAFA] px-3 py-2 font-black text-[#0F8F84]">{label}</div><div className="px-3 py-2 font-semibold text-slate-700">{value}</div></div>)}</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[#8FE7DE] p-3"><p className="text-xs font-black text-[#0F8F84]">취소 규정</p><div className="mt-2 space-y-1">{settings.contract.cancellationRows.slice(0, 5).map((row, idx) => <div key={idx} className="grid grid-cols-[1fr_90px] gap-1"><input value={row.period} onChange={e => onCancellation(idx, 'period', e.target.value)} className={`${fieldClass} text-[10px] font-semibold text-slate-500`} /><input value={row.fee} onChange={e => onCancellation(idx, 'fee', e.target.value)} className={`${fieldClass} text-[10px] font-semibold text-slate-500`} /></div>)}</div></div><div className="rounded-xl border border-[#8FE7DE] p-3"><p className="text-xs font-black text-[#0F8F84]">결제 안내</p><input value={settings.contract.paymentMethod} onChange={e => onDocSection('contract', { paymentMethod: e.target.value })} className={`${fieldClass} mt-2 text-[10px] font-semibold text-slate-500`} /><input value={settings.contract.paymentDeadline} onChange={e => onDocSection('contract', { paymentDeadline: e.target.value })} className={`${fieldClass} mt-1 text-[10px] font-semibold text-slate-500`} /><textarea value={settings.contract.bankInfo} onChange={e => onDocSection('contract', { bankInfo: e.target.value })} rows={3} placeholder="입금 계좌·결제 안내(자유 입력)" className={`${fieldClass} mt-1 resize-none text-[10px] font-semibold leading-relaxed text-slate-500`} /><div className="mt-4 border-b border-slate-300 pb-1 text-[10px] text-slate-400">여행자 서명</div></div></div></div></Frame>}
                {activePage === 'detail' && <Frame><div className="p-5"><div className="mb-5 flex items-center justify-between"><input value={settings.detail.title} onChange={e => onDocSection('detail', { title: e.target.value })} className={`${fieldClass} text-[24px] font-black tracking-[0.12em] text-[#0F8F84]`} /><span className="rounded-full bg-[#39C4B7]/10 px-3 py-1 text-xs font-black text-[#0F8F84]">{totalDays || 0}일간</span></div>
                    <div className="space-y-3">{days.map((day, dayIdx) => { const inText = textDays.has(dayIdx); return (<div key={dayIdx} className="grid grid-cols-[64px_1fr] gap-3">
                        <div className="flex flex-col items-center rounded-xl bg-gradient-to-b from-[#0F8F84] to-[#39C4B7] px-2 py-4 text-center text-white"><p className="text-[10px] font-black">DAY {day.day}</p><p className="mt-1 text-[11px] font-bold">{day.day}일차</p><button onClick={() => onRemoveDay(dayIdx)} className="mt-2 text-white/60 hover:text-white" title="Энэ өдрийг устгах"><span className="material-symbols-outlined text-[15px]">delete</span></button></div>
                        <div className="rounded-xl border border-[#8FE7DE] p-3">
                            <input value={day.title} onChange={e => onDayChange(dayIdx, 'title', e.target.value)} placeholder={`${day.day}일차 제목`} className={`${fieldClass} text-sm font-black text-[#0F8F84]`} />
                            <input value={day.region || ''} onChange={e => onDayChange(dayIdx, 'region', e.target.value)} placeholder="지역(예: 울란바토르)" className={`${fieldClass} mt-0.5 text-[10px] font-semibold text-slate-400`} />
                            {getAccommodation(day.day)?.name && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-[#0F8F84]"><span className="material-symbols-outlined text-[13px]">hotel</span>숙박: {getAccommodation(day.day)?.name}</div>}
                            <div className="mt-2 flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400">일정</span>{onDayActivitiesText && <button onClick={() => toggleTextDay(dayIdx)} className="text-[10px] font-bold text-[#0F8F84] hover:text-[#0a7d6a]">{inText ? '↩ Нүд тус бүрээр засах' : '✎ Текстээр нэг дор'}</button>}</div>
                            {inText && onDayActivitiesText ? (
                                <textarea value={day.activities.map(a => `${a.time ? a.time + ' ' : ''}${a.title}`).join('\n')} onChange={e => onDayActivitiesText(dayIdx, e.target.value)} rows={Math.max(4, day.activities.length + 1)} placeholder={'09:00 울란바토르 도착\n12:00 점심\n숙박: 호텔\n(нэг мөрөнд нэг зүйл, эхэнд цаг)'} className={`${fieldClass} mt-1 resize-y text-[11px] font-semibold leading-relaxed text-slate-700`} />
                            ) : (
                                <div className="relative mt-1 border-l-2 border-dashed border-[#8FE7DE] pl-4">{day.activities.map((activity, index) => <div key={index} className="relative pb-1.5 last:pb-0"><span className="absolute -left-[23px] top-2 h-3 w-3 rounded-full bg-[#0F8F84] ring-2 ring-white" /><div className="flex items-center gap-1"><input value={activity.time || ''} onChange={e => onActivityChange(dayIdx, index, 'time', e.target.value)} placeholder="--:--" className={`${fieldClass} w-[58px] font-mono text-[11px] font-bold text-slate-400`} /><input value={activity.title} onChange={e => onActivityChange(dayIdx, index, 'title', e.target.value)} placeholder="항목명(예: 거북바위 관광)" className={`${fieldClass} flex-1 text-[11px] font-semibold text-slate-700`} /><button onClick={() => onRemoveActivity(dayIdx, index)} className="shrink-0 text-slate-300 hover:text-red-500" title="Устгах"><span className="material-symbols-outlined text-[15px]">close</span></button></div></div>)}
                                    <button onClick={() => onAddActivity(dayIdx)} className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-black text-[#0F8F84] hover:text-[#0a7d6a]"><span className="material-symbols-outlined text-[14px]">add</span>Зүйл нэмэх</button>
                                </div>
                            )}
                        </div>
                    </div>); })}
                        {days.length === 0 && <p className="rounded-xl border border-dashed border-[#8FE7DE] py-6 text-center text-[11px] font-bold text-slate-400">доорх «Өдөр (DAY) нэмэх»-ээр хуваарь үүсгэж эхлээрэй.</p>}
                        <button onClick={onAddDay} className="w-full rounded-xl border-2 border-dashed border-[#8FE7DE] py-3 text-xs font-black text-[#0F8F84] transition-colors hover:bg-[#EAF8F7]"><span className="material-symbols-outlined align-middle text-[16px]">add</span> Өдөр (DAY) нэмэх</button>
                    </div>
                    <textarea value={settings.detail.note} onChange={e => onDocSection('detail', { note: e.target.value })} rows={2} className={`${fieldClass} mt-4 resize-none text-[11px] font-semibold leading-relaxed text-slate-500`} /></div></Frame>}
                {activePage === 'guide' && <Frame><div className="grid gap-4 p-5 sm:grid-cols-2"><div className="rounded-xl border border-[#8FE7DE] p-4"><h3 className="text-sm font-black text-[#0F8F84]">안내·주의 사항</h3>{settings.guide.notices.slice(0, 5).map((item, idx) =><div key={idx} className="mt-3 flex gap-2"><span className="material-symbols-outlined text-[20px] text-[#0F8F84]">info</span><div className="flex-1"><input value={item.title} onChange={e => onGuideNotice(idx, 'title', e.target.value)} className={`${fieldClass} text-xs font-black text-[#0F8F84]`} /><textarea value={item.body} onChange={e => onGuideNotice(idx, 'body', e.target.value)} rows={2} className={`${fieldClass} mt-1 resize-none text-[10px] font-semibold leading-relaxed text-slate-500`} /></div></div>)}</div><div className="rounded-xl border border-[#8FE7DE] p-4"><h3 className="text-sm font-black text-[#0F8F84]">여행 조건(요약)</h3><textarea value={settings.guide.conditions} onChange={e => onDocSection('guide', { conditions: e.target.value })} rows={4} className={`${fieldClass} mt-2 resize-none text-[10px] font-semibold leading-relaxed text-slate-500`} /><h3 className="mt-5 text-sm font-black text-[#0F8F84]">여행 대금 결제</h3><textarea value={settings.guide.paymentInfo} onChange={e => onDocSection('guide', { paymentInfo: e.target.value })} rows={3} className={`${fieldClass} mt-2 resize-none text-[10px] font-semibold leading-relaxed text-slate-500`} /><h3 className="mt-5 text-sm font-black text-[#0F8F84]">긴급 연락처</h3><input value={settings.guide.emergencyPhone} onChange={e => onDocSection('guide', { emergencyPhone: e.target.value })} className={`${fieldClass} mt-2 text-[10px] font-semibold text-slate-500`} /><input value={settings.guide.emergencyEmail} onChange={e => onDocSection('guide', { emergencyEmail: e.target.value })} className={`${fieldClass} text-[10px] font-semibold text-slate-500`} /></div></div><div className="relative h-[104px] overflow-hidden"><img src={mongoliaHero} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-transparent" /><input value={settings.guide.closingMessage} onChange={e => onDocSection('guide', { closingMessage: e.target.value })} className={`${fieldClass} absolute left-5 top-7 max-w-[360px] text-sm font-black text-[#0F8F84]`} /><div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[#0F8F84] px-5 py-2 text-[10px] font-bold text-white"><span>몽골 은하수 여행사</span><span>{settings.guide.emergencyEmail}</span></div></div></Frame>}
            </div>
        </div>
    );
};

// ─── Tab: Itinerary Templates ────────────────────────────
const TemplatesTab: React.FC = () => {
    const [templates, setTemplates] = useState<ItineraryTemplate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<ItineraryTemplate | null>(null);
    const [form, setForm] = useState<{ name: string; description: string; days: TemplateDay[]; documentSettings: DocumentSettings }>({
        name: '',
        description: '',
        days: [],
        documentSettings: defaultDocumentSettings(),
    });
    const [quickDays, setQuickDays] = useState(4);
    const [bulkText, setBulkText] = useState('');
    const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
    // 마스터 picker — 어느 일자에 추가할지(day index) 저장
    // 마스터 picker — 특정 항목(일자 d, 항목 a)을 채움
    const [spotPickerTarget, setSpotPickerTarget] = useState<{ d: number; a: number } | null>(null);
    const [hotelPickerTarget, setHotelPickerTarget] = useState<{ d: number; a: number } | null>(null);
    // UX 정리: 일정이 만들어지면 붙여넣기 박스를 접고, 항목 추가는 작은 메뉴로
    const [showPasteBox, setShowPasteBox] = useState(false);
    const [addMenuDay, setAddMenuDay] = useState<number | null>(null);
    // 식사 종류(조식/중식/석식) 선택 메뉴 — 어느 일자에서 열렸는지
    const [mealMenuDay, setMealMenuDay] = useState<number | null>(null);
    // 항목별 "상세 설명" 펼침 상태 (key: `${dayIdx}-${actIdx}`)
    const [openDesc, setOpenDesc] = useState<Set<string>>(new Set());
    const toggleDesc = (key: string) => setOpenDesc(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const load = async () => {
        try {
            const data = await api.itineraryTemplates.list();
            if (Array.isArray(data)) {
                setTemplates(data.map((t: any) => {
                    const decoded = decodeTemplateDescription(t.description || '');
                    return {
                        id: t.id,
                        name: t.name,
                        description: decoded.description,
                        documentSettings: decoded.documentSettings,
                        days: typeof t.days === 'string' ? JSON.parse(t.days || '[]') : (t.days || []),
                        createdAt: t.created_at || t.createdAt
                    };
                }));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => { setForm({ name: '', description: '', days: [], documentSettings: defaultDocumentSettings() }); setEditing(null); setBulkText(''); setQuickDays(4); setShowAdvancedEditor(false); setShowPasteBox(false); setAddMenuDay(null); };

    const DAY_LABELS_JP = [
        '1일차', '2일차', '3일차', '4일차', '5일차',
        '6일차', '7일차', '8일차', '9일차', '10일차',
    ];

    const inferActivityType = (text: string): ActivityType => {
        const value = text.toLowerCase();
        if (/(공항|픽업|도착|미팅|arrival|airport)/i.test(value)) return 'pickup';
        if (/(이동|출발|전용차|차량|버스|transfer|drive)/i.test(value)) return 'transport';
        if (/(식사|조식|중식|석식|점심|저녁|아침|meal|lunch|dinner|breakfast)/i.test(value)) return 'meal';
        if (/(숙박|호텔|게르|체크인|hotel|stay|check[-\s]?in)/i.test(value)) return 'checkin';
        if (/(체험|승마|낙타|트레킹|공연|activity|experience)/i.test(value)) return 'activity';
        if (/(자유|휴식|free)/i.test(value)) return 'free';
        return 'sightseeing';
    };

    const createBlankDays = (days = quickDays) => {
        const count = Math.max(1, Math.min(14, days || 1));
        setForm(f => ({
            ...f,
            days: Array.from({ length: count }, (_, idx) => ({
                day: idx + 1,
                title: f.days[idx]?.title || '',
                region: f.days[idx]?.region || '',
                activities: f.days[idx]?.activities || [],
            })),
        }));
    };

    const addActivityToLastDay = () => setForm(f => {
        const days = f.days.length > 0 ? [...f.days] : [{ day: 1, title: '', region: '', activities: [] as Activity[] }];
        const lastIdx = days.length - 1;
        days[lastIdx] = {
            ...days[lastIdx],
            activities: [...days[lastIdx].activities, { time: '', type: 'sightseeing', title: '', description: '' }],
        };
        return { ...f, days };
    });

    const loadBulkSample = () => {
        setBulkText([
            'DAY 1｜울란바토르 도착',
            '몽골 여행, 시작의 날.',
            '',
            '칭기즈칸 국제공항 도착 후,',
            '「MILKYWAY」 사인보드를 든 한국어 가이드가 마중 나갑니다.',
            '',
            '장시간 비행 후에도 편안하게 이동하실 수 있도록,',
            '간식(햄버거·샌드위치)을 준비해 드립니다.',
            '',
            '일정',
            '칭기즈칸 국제공항 도착',
            '한국어 가이드·기사와 합류',
            'SIM카드(USIM) 구매·환전 지원 가능',
            '전용차로 호텔 이동',
            '호텔 체크인·휴식',
            '숙박',
            '울란바토르 시내 4성급 호텔(2인 1실)',
            '',
            'Day 2 테를지 국립공원',
            '09:00 호텔 출발 - 테를지 국립공원 이동',
            '11:00 거북바위 관광',
            '13:00 현지식 점심',
            '15:00 승마 체험',
            '숙박: 게르 캠프',
        ].join('\n'));
    };

    const importBulkText = () => {
        const rawLines = bulkText.split(/\r?\n/);
        if (rawLines.every(line => !line.trim())) {
            alert('Буулгах хуваарийн агуулгыг оруулна уу.');
            return;
        }

        const parsedDays: TemplateDay[] = [];
        let currentDay: TemplateDay | null = null;
        let section: 'intro' | 'schedule' | 'stay' = 'intro';
        let introLines: string[] = [];

        const flushIntro = () => {
            if (!currentDay) return;
            const cleaned = introLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
            if (cleaned) {
                const [titleLine, ...rest] = cleaned.split('\n');
                currentDay.activities.push({
                    time: '',
                    type: 'other',
                    title: titleLine,
                    description: rest.join('\n').trim(),
                });
            }
            introLines = [];
        };

        const commitDay = () => {
            flushIntro();
            if (currentDay) parsedDays.push(currentDay);
            currentDay = null;
            section = 'intro';
        };

        rawLines.forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) {
                if (section === 'intro' && introLines.length > 0 && introLines[introLines.length - 1] !== '') {
                    introLines.push('');
                }
                return;
            }

            const dayMatch = line.match(/^(?:day|d)\s*[-\s]*(\d+)\s*(?:[|｜:.)-]\s*)?(.*)$/i) || line.match(/^(\d+)\s*일차\s*[:.)-]?\s*(.*)$/);
            if (dayMatch) {
                commitDay();
                currentDay = { day: parsedDays.length + 1, title: dayMatch[2]?.trim() || '', region: '', activities: [] };
                section = 'intro';
                return;
            }

            if (!currentDay) {
                currentDay = { day: 1, title: '', region: '', activities: [] };
            }

            if (/^(일정|schedule)$/i.test(line)) {
                flushIntro();
                section = 'schedule';
                return;
            }

            if (/^(숙박|hotel|stay)$/i.test(line)) {
                flushIntro();
                section = 'stay';
                return;
            }

            const stayMatch = line.match(/^(숙박|hotel|stay)\s*[:：]\s*(.+)$/i);
            if (stayMatch) {
                flushIntro();
                const title = stayMatch[2].trim();
                currentDay.activities.push({ time: '', type: 'checkin', title, description: '숙박' });
                return;
            }

            const activityMatch = line.match(/^(\d{1,2}:\d{2})\s+(.+?)(?:\s*[-–]\s*(.+))?$/);
            if (activityMatch) {
                flushIntro();
                const title = activityMatch[2].trim();
                const description = activityMatch[3]?.trim() || '';
                currentDay.activities.push({
                    time: activityMatch[1],
                    type: inferActivityType(`${title} ${description}`),
                    title,
                    description,
                });
                return;
            }

            if (section === 'stay') {
                currentDay.activities.push({ time: '', type: 'checkin', title: line, description: '숙박' });
                return;
            }

            if (section === 'schedule') {
                currentDay.activities.push({ time: '', type: inferActivityType(line), title: line, description: '' });
                return;
            }

            if (!currentDay.title) {
                currentDay.title = line;
            } else {
                introLines.push(line);
            }
        });

        commitDay();
        const days = parsedDays.map((day, idx) => ({ ...day, day: idx + 1 }));
        setForm(f => ({ ...f, days }));
        setShowAdvancedEditor(false);
    };

    // Day operations
    const addDay = () => setForm(f => ({ ...f, days: [...f.days, { day: f.days.length + 1, title: '', region: '', activities: [] }] }));
    const removeDay = (idx: number) => setForm(f => ({ ...f, days: f.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })) }));
    const updateDay = (idx: number, field: keyof TemplateDay, value: any) => setForm(f => { const d = [...f.days]; d[idx] = { ...d[idx], [field]: value }; return { ...f, days: d }; });
    const moveDay = (idx: number, dir: -1 | 1) => setForm(f => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= f.days.length) return f;
        const d = [...f.days];
        [d[idx], d[newIdx]] = [d[newIdx], d[idx]];
        return { ...f, days: d.map((x, i) => ({ ...x, day: i + 1 })) };
    });
    const duplicateDay = (idx: number) => setForm(f => {
        const src = f.days[idx];
        const copy = { ...src, activities: src.activities.map(a => ({ ...a })) };
        const d = [...f.days.slice(0, idx + 1), copy, ...f.days.slice(idx + 1)];
        return { ...f, days: d.map((x, i) => ({ ...x, day: i + 1 })) };
    });

    // Activity operations
    const addActivity = (dayIdx: number) => setForm(f => { const d = [...f.days]; d[dayIdx].activities = [...d[dayIdx].activities, { time: '', type: 'sightseeing', title: '', description: '' }]; return { ...f, days: d }; });
    // 유형을 지정해 빈 항목 추가 (이동/식사/직접입력 버튼용)
    const addActivityTyped = (dayIdx: number, type: ActivityType) => setForm(f => {
        const d = [...f.days];
        d[dayIdx] = { ...d[dayIdx], activities: [...d[dayIdx].activities, { time: '', type, title: '', description: '' }] };
        return { ...f, days: d };
    });
    // 식사 항목 추가 — 식사명(조식/중식/석식)을 제목에 미리 넣고 뒤에 음식명 입력
    const addMeal = (dayIdx: number, jp: string) => setForm(f => {
        const d = [...f.days];
        d[dayIdx] = { ...d[dayIdx], activities: [...d[dayIdx].activities, { time: '', type: 'meal' as ActivityType, title: `${jp} ｜ `, description: '' }] };
        return { ...f, days: d };
    });
    // 관광지 마스터에서 선택 → 상세 설명을 채움. 직접 쓴 제목은 보존(비어 있을 때만 마스터명 사용)
    const fillItemFromSpot = (d: number, a: number, spot: TouristSpot) => setForm(f => {
        const desc = [spot.description, spot.address].filter(Boolean).join('\n\n');
        const days = [...f.days];
        const acts = [...days[d].activities];
        const cur = acts[a];
        const keepTitle = (cur.title || '').trim().length > 0;
        acts[a] = {
            ...cur,
            title: keepTitle ? cur.title : spot.name_kr,
            description: desc || cur.description,
            type: keepTitle ? cur.type : inferActivityType(`${spot.name_kr} ${desc}`),
            images: (spot.images && spot.images.length > 0) ? [...spot.images] : cur.images,
        };
        days[d] = { ...days[d], activities: acts };
        return { ...f, days };
    });
    // 호텔 마스터에서 선택 → 상세 설명을 채움. 직접 쓴 제목은 보존(비어 있을 때만 호텔명 사용)
    const fillItemFromHotel = (d: number, a: number, hotel: Hotel) => setForm(f => {
        const desc = [hotel.description, hotel.address].filter(Boolean).join('\n\n');
        const days = [...f.days];
        const acts = [...days[d].activities];
        const cur = acts[a];
        const keepTitle = (cur.title || '').trim().length > 0;
        acts[a] = {
            ...cur,
            title: keepTitle ? cur.title : hotel.name_kr,
            description: desc || cur.description || '숙박',
            type: keepTitle ? cur.type : 'checkin',
            images: (hotel.images && hotel.images.length > 0) ? [...hotel.images] : cur.images,
        };
        days[d] = { ...days[d], activities: acts };
        return { ...f, days };
    });
    const removeActivity = (dayIdx: number, actIdx: number) => setForm(f => { const d = [...f.days]; d[dayIdx].activities = d[dayIdx].activities.filter((_, i) => i !== actIdx); return { ...f, days: d }; });
    const removeActivityImage = (dayIdx: number, actIdx: number, imgIdx: number) => setForm(f => {
        const d = [...f.days];
        const acts = [...d[dayIdx].activities];
        acts[actIdx] = { ...acts[actIdx], images: (acts[actIdx].images || []).filter((_, i) => i !== imgIdx) };
        d[dayIdx] = { ...d[dayIdx], activities: acts };
        return { ...f, days: d };
    });
    const updateActivity = (dayIdx: number, actIdx: number, field: keyof Activity, value: any) => setForm(f => { const d = [...f.days]; d[dayIdx].activities[actIdx] = { ...d[dayIdx].activities[actIdx], [field]: value }; return { ...f, days: d }; });
    const updateActivityText = (dayIdx: number, actIdx: number, field: 'title' | 'description', value: string) => setForm(f => {
        const d = [...f.days];
        const activity = d[dayIdx].activities[actIdx];
        const next = { ...activity, [field]: value };
        next.type = inferActivityType(`${field === 'title' ? value : next.title} ${field === 'description' ? value : next.description}`);
        d[dayIdx].activities[actIdx] = next;
        return { ...f, days: d };
    });
    const moveActivity = (dayIdx: number, actIdx: number, dir: -1 | 1) => setForm(f => {
        const acts = [...f.days[dayIdx].activities];
        const newIdx = actIdx + dir;
        if (newIdx < 0 || newIdx >= acts.length) return f;
        [acts[actIdx], acts[newIdx]] = [acts[newIdx], acts[actIdx]];
        const d = [...f.days];
        d[dayIdx] = { ...d[dayIdx], activities: acts };
        return { ...f, days: d };
    });
    const sortByTime = (dayIdx: number) => setForm(f => {
        const acts = [...f.days[dayIdx].activities].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const d = [...f.days];
        d[dayIdx] = { ...d[dayIdx], activities: acts };
        return { ...f, days: d };
    });

    const updateDocSection = <K extends keyof DocumentSettings>(section: K, patch: Partial<DocumentSettings[K]>) => {
        setForm(f => ({
            ...f,
            documentSettings: {
                ...f.documentSettings,
                [section]: { ...f.documentSettings[section], ...patch },
            },
        }));
    };

    const updateIncluded = (idx: number, field: 'icon' | 'label', value: string) => {
        setForm(f => {
            const included = [...f.documentSettings.overview.included];
            included[idx] = { ...included[idx], [field]: value };
            return { ...f, documentSettings: { ...f.documentSettings, overview: { ...f.documentSettings.overview, included } } };
        });
    };

    const updateCancellation = (idx: number, field: 'period' | 'fee', value: string) => {
        setForm(f => {
            const cancellationRows = [...f.documentSettings.contract.cancellationRows];
            cancellationRows[idx] = { ...cancellationRows[idx], [field]: value };
            return { ...f, documentSettings: { ...f.documentSettings, contract: { ...f.documentSettings.contract, cancellationRows } } };
        });
    };

    const updateGuideNotice = (idx: number, field: 'title' | 'body', value: string) => {
        setForm(f => {
            const notices = [...f.documentSettings.guide.notices];
            notices[idx] = { ...notices[idx], [field]: value };
            return { ...f, documentSettings: { ...f.documentSettings, guide: { ...f.documentSettings.guide, notices } } };
        });
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) { alert('Загварын нэрийг оруулна уу.'); return; }
        try {
            const payload = {
                name: form.name,
                description: encodeTemplateDescription(form.description, form.documentSettings),
                days: form.days,
            };
            if (editing) { await api.itineraryTemplates.update(editing.id, payload); }
            else { await api.itineraryTemplates.create(payload); }
            await load(); setIsModalOpen(false); resetForm();
        } catch (e: any) { alert('Хадгалахад алдаа гарлаа: ' + e.message); }
    };

    const handleEdit = (t: ItineraryTemplate) => { setEditing(t); setForm({ name: t.name, description: t.description, days: t.days, documentSettings: mergeDocumentSettings(t.documentSettings) }); setShowAdvancedEditor(false); setIsModalOpen(true); };
    const handleDelete = async (id: string) => { if (!confirm('Устгах уу?')) return; try { await api.itineraryTemplates.delete(id); await load(); } catch (e: any) { alert('Устгахад алдаа гарлаа'); } };
    const handleDuplicate = (t: ItineraryTemplate) => {
        setEditing(null);
        setForm({
            name: `${t.name} (хуулбар)`,
            description: t.description,
            documentSettings: mergeDocumentSettings(t.documentSettings),
            days: t.days.map(d => ({ ...d, activities: d.activities.map(a => ({ ...a })) })),
        });
        setShowAdvancedEditor(false);
        setIsModalOpen(true);
    };

    const closeEditor = () => {
        if (form.name || form.days.length > 0) {
            if (!confirm('Засаж буй агуулга устах болно. Хаах уу?')) return;
        }
        setIsModalOpen(false); resetForm();
    };

    return (
        <div>
            <div className="toolbar">
                <div style={{ minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 14 }}>Үйлчлүүлэгчид илгээх аялалын баримтын загварыг үүсгэнэ.</div>
                    <div className="cell-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Хуваарийн агуулга баримт дотор орох ба үйлчлүүлэгчийн дэлгэц нь аялалын тойм·гэрээ·дэлгэрэнгүй хуваарь·нийтлэг заавар багцаас бүрдэнэ.</div>
                </div>
                <div className="spacer" />
                <button className="btn btn-ink" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Icon name="add" /> Баримтын загвар нэмэх
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="empty">
                    <Icon name="event_note" />
                    <p>Бүртгэгдсэн загвар алга</p>
                </div>
            ) : (
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {templates.map(t => (
                        <div key={t.id} className="card" style={{ overflow: 'hidden' }}>
                            <div className="relative h-36 overflow-hidden">
                                <img src={mongoliaHero} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0F8F84]/95 via-[#0F8F84]/65 to-transparent" />
                                <div className="absolute left-5 top-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[24px]">landscape</span>
                                        <div>
                                            <p className="text-[11px] font-black">몽골 은하수 여행사</p>
                                            <p className="text-[8px] font-bold tracking-widest text-white/70">DOCUMENT PACKAGE</p>
                                        </div>
                                    </div>
                                    <h3 className="mt-4 max-w-[420px] truncate text-xl font-black tracking-tight">{t.name}</h3>
                                    {t.description && <p className="mt-1 max-w-[420px] truncate text-xs font-semibold text-white/80">{t.description}</p>}
                                </div>
                                <span className="absolute right-4 top-4 rounded-xl bg-white/90 px-3 py-1 text-xs font-black text-[#0F8F84] shadow-sm">{Math.max(0, t.days.length - 1)} шөнө {t.days.length} өдөр</span>
                            </div>

                            <div className="card-pad">
                                <div className="mb-4 grid grid-cols-4 gap-2">
                                    {[
                                        { icon: 'article', label: 'Тойм' },
                                        { icon: 'contract', label: 'Гэрээ' },
                                        { icon: 'route', label: 'Дэлгэрэнгүй хуваарь' },
                                        { icon: 'qr_code_2', label: 'Заавар/QR' },
                                    ].map(item => (
                                        <div key={item.label} className="rounded-xl border border-[#8FE7DE]/80 bg-[#F7FAFA] px-2 py-2 text-center text-[#0F8F84]">
                                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                            <p className="mt-1 text-[10px] font-black">{item.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Баримтад орох хуваарийн агуулга</p>
                                    <div className="space-y-1">
                                        {t.days.slice(0, 3).map(d => (
                                            <div key={d.day} className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="flex h-7 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#39C4B7]/15 text-[11px] font-black text-[#0F8F84]">{d.day} өдөр</span>
                                                <span className="truncate font-semibold">{d.region ? `${d.region} · ` : ''}{d.title || 'Гарчиггүй'}</span>
                                                <span className="flex-shrink-0 text-slate-300">({d.activities.length})</span>
                                            </div>
                                        ))}
                                        {t.days.length > 3 && <p className="pl-11 text-xs text-slate-400">+ бусад {t.days.length - 3} өдөр...</p>}
                                    </div>
                                </div>

                                <div className="row" style={{ gap: 8 }}>
                                    <button onClick={() => handleEdit(t)} className="btn btn-ink" style={{ flex: 1 }}>Баримтын загвар засах</button>
                                    <button onClick={() => handleDuplicate(t)} className="act-btn" title="Энэ загварыг хуулах">
                                        <Icon name="content_copy" />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="act-btn danger" title="Устгах">
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 p-3 sm:p-6" style={{ background: 'rgba(26,27,30,0.42)', backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white rounded-2xl w-full h-full flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>

                        {/* Sticky header */}
                        <div className="bg-white px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button onClick={closeEditor} className="act-btn" title="Хаах">
                                    <Icon name="arrow_back" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <div className="eyebrow" style={{ marginBottom: 2 }}><span className="dot" />{editing ? 'Загвар засах' : 'Шинэ загвар'}</div>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Загварын нэр (жишээ: Говь цөл 4 шөнө 5 өдөр үндсэн)"
                                        className="w-full text-lg font-bold bg-transparent text-slate-900 focus:outline-none placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={closeEditor} className="btn btn-ghost">Цуцлах</button>
                                <button onClick={handleSubmit} className="btn btn-ink">
                                    <Icon name="check" />{editing ? 'Хадгалах' : 'Үүсгэх'}
                                </button>
                            </div>
                        </div>

                        {/* Body: editor + preview */}
                        <div className="flex-1 overflow-hidden">

{/* Live preview */}
                            <div className="h-full overflow-hidden bg-white">
                                <TemplatePreview name={form.name} description={form.description} days={form.days} documentSettings={form.documentSettings} onNameChange={(value) => setForm(f => ({ ...f, name: value }))} onDescriptionChange={(value) => setForm(f => ({ ...f, description: value }))} onDocSection={updateDocSection} onIncluded={updateIncluded} onCancellation={updateCancellation} onGuideNotice={updateGuideNotice} onDayChange={(d, field, v) => updateDay(d, field, v)} onActivityChange={(d, a, field, v) => field === 'time' ? updateActivity(d, a, 'time', v) : updateActivityText(d, a, field, v)} onAddDay={addDay} onAddActivity={(d) => addActivity(d)} onRemoveDay={removeDay} onRemoveActivity={removeActivity} onDayActivitiesText={(d, text) => setForm(f => { const days = [...f.days]; days[d] = { ...days[d], activities: parseDayActivitiesText(text) }; return { ...f, days }; })} />
                            </div>
                        </div>
                    </div>

                    {/* 마스터 picker — 선택 시 해당 항목의 제목·설명을 채움 */}
                    <TouristSpotPickerModal
                        open={spotPickerTarget !== null}
                        onClose={() => setSpotPickerTarget(null)}
                        onPick={(spot) => {
                            if (spotPickerTarget) fillItemFromSpot(spotPickerTarget.d, spotPickerTarget.a, spot);
                            setSpotPickerTarget(null);
                        }}
                    />
                    <HotelPickerModal
                        open={hotelPickerTarget !== null}
                        onClose={() => setHotelPickerTarget(null)}
                        onPick={(hotel) => {
                            if (hotelPickerTarget) fillItemFromHotel(hotelPickerTarget.d, hotelPickerTarget.a, hotel);
                            setHotelPickerTarget(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Tab: Guides ─────────────────────────────────────────
const GuidesTab: React.FC = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Guide | null>(null);
    const [form, setForm] = useState({ name: '', image: '', introduction: '', phone: '', experienceYears: 0, languages: [] as string[], specialties: [] as string[] });

    const load = async () => {
        try {
            const data = await api.tourGuides.list();
            if (Array.isArray(data)) setGuides(data.map((g: any) => ({
                id: g.id, name: g.name, image: g.image || '', introduction: g.bio || g.introduction || '',
                phone: g.phone || '', languages: typeof g.languages === 'string' ? JSON.parse(g.languages || '[]') : (g.languages || []),
                specialties: typeof g.specialties === 'string' ? JSON.parse(g.specialties || '[]') : (g.specialties || []),
                status: g.status || 'active', experienceYears: g.experience_years || 0,
            })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => { setForm({ name: '', image: '', introduction: '', phone: '', experienceYears: 0, languages: [], specialties: [] }); setEditing(null); };
    const toggle = (field: 'languages' | 'specialties', val: string) => setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(v => v !== val) : [...f[field], val] }));

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        try { const url = await uploadImage(file, 'guides'); setForm(f => ({ ...f, image: url })); } catch { alert('Зураг байршуулахад алдаа гарлаа'); }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.phone) { alert('Нэр болон холбоо барих утас заавал шаардлагатай.'); return; }
        try {
            const payload = { name: form.name, bio: form.introduction, phone: form.phone, image: form.image, experience_years: form.experienceYears, languages: form.languages, specialties: form.specialties };
            if (editing) { await api.tourGuides.update(editing.id, { ...payload, status: editing.status }); }
            else { await api.tourGuides.create({ ...payload, status: 'active' }); }
            await load(); setIsModalOpen(false); resetForm();
        } catch (e: any) { alert('Хадгалахад алдаа гарлаа: ' + e.message); }
    };

    const handleApprove = async (g: Guide) => {
        try { await api.tourGuides.update(g.id, { name: g.name, bio: g.introduction, phone: g.phone, image: g.image, experience_years: g.experienceYears, languages: g.languages, specialties: g.specialties, status: 'active' }); await load(); }
        catch (e: any) { alert('Баталгаажуулахад алдаа гарлаа'); }
    };

    const handleDelete = async (id: string) => { if (!confirm('Устгах уу?')) return; try { await api.tourGuides.delete(id); await load(); } catch { alert('Устгахад алдаа гарлаа'); } };

    const pendingCount = guides.filter(g => g.status === 'pending').length;

    return (
        <div>
            <div className="toolbar">
                <div className="row" style={{ minWidth: 0 }}>
                    <div className="cell-muted" style={{ fontSize: 13 }}>Хөтчийг бүртгэж удирдана.</div>
                    {pendingCount > 0 && <span className="badge b-amber">Хүлээгдэж буй {pendingCount}</span>}
                </div>
                <div className="spacer" />
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn btn-ink">
                    <Icon name="add" /> Хөтөч бүртгэх
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {guides.map(g => (
                    <div key={g.id} className="card card-pad grid grid-cols-[72px_1fr_auto] gap-4 items-center" style={{ padding: 14 }}>
                        <div className="avatar flex-shrink-0" style={{ width: 72, height: 72, borderRadius: 'var(--r-md)', position: 'relative' }}>
                            {g.image ? <img src={g.image} alt={g.name} className="w-full h-full object-cover" /> : <Icon name="person" style={{ fontSize: 30, color: 'var(--mrt-gray-300)' }} />}
                            {g.status === 'pending' && <span className="badge b-amber" style={{ position: 'absolute', top: 4, left: 4, padding: '1px 6px', fontSize: 9 }}>Хүлээгдэж буй</span>}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="cell-strong truncate" style={{ fontSize: 15 }}>{g.name}</h3>
                                {g.experienceYears > 0 && <span className="cell-muted inline-flex items-center gap-0.5" style={{ fontSize: 11 }}><Icon name="workspace_premium" style={{ fontSize: 14 }} />{g.experienceYears} жил</span>}
                                <span className="cell-muted inline-flex items-center gap-0.5" style={{ fontSize: 11 }}><Icon name="phone" style={{ fontSize: 14 }} />{g.phone}</span>
                            </div>
                            <p className="cell-muted line-clamp-1 mb-1.5" style={{ fontSize: 12.5 }}>{g.introduction || 'Танилцуулга алга'}</p>
                            {g.languages.length > 0 && <div className="flex flex-wrap gap-1">{g.languages.map(l => <span key={l} className="badge b-blue" style={{ padding: '2px 7px', fontSize: 10.5 }}>{l}</span>)}</div>}
                        </div>
                        <div className="row-actions items-center" style={{ alignItems: 'center' }}>
                            {g.status === 'pending' && <button onClick={() => handleApprove(g)} className="btn btn-sm btn-blue">Батлах</button>}
                            <button onClick={() => { setEditing(g); setForm({ name: g.name, image: g.image, introduction: g.introduction, phone: g.phone, experienceYears: g.experienceYears, languages: g.languages, specialties: g.specialties }); setIsModalOpen(true); }} className="act-btn" title="Засах"><Icon name="edit" /></button>
                            <button onClick={() => handleDelete(g.id)} className="act-btn danger" title="Устгах"><Icon name="delete" /></button>
                        </div>
                    </div>
                ))}
                {guides.length === 0 && <div className="col-span-full empty"><Icon name="person_off" /><p>Бүртгэгдсэн хөтөч алга</p></div>}
            </div>

            {isModalOpen && (
                <div className="picker-scrim">
                    <div className="picker" style={{ width: 520, maxHeight: '90vh' }}>
                        <div className="card-head" style={{ flexShrink: 0 }}>
                            <h2>{editing ? 'Хөтөч засах' : 'Хөтөч бүртгэх'}</h2>
                            <div className="spacer" />
                            <button className="act-btn" onClick={() => { setIsModalOpen(false); resetForm(); }} title="Хаах"><Icon name="close" /></button>
                        </div>
                        <div className="picker-list" style={{ padding: '20px 22px' }}>
                            <div className="field">
                                <label>Профайл зураг</label>
                                <div className="row" style={{ gap: 16 }}>
                                    <div className="avatar round" style={{ width: 64, height: 64 }}>
                                        {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <Icon name="person" style={{ fontSize: 28, color: 'var(--mrt-gray-300)' }} />}
                                    </div>
                                    <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                                        Зураг сонгох <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="field"><label>Нэр *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="inp" /></div>
                            <div className="field"><label>Холбоо барих утас *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="inp" /></div>
                            <div className="field"><label>Ажилласан жил</label><div className="row"><input type="number" min={0} value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: Number(e.target.value) }))} className="inp" style={{ width: 110, textAlign: 'center' }} /><span className="cell-muted" style={{ fontSize: 13 }}>жил</span></div></div>
                            <div className="field"><label>Танилцуулга</label><textarea value={form.introduction} onChange={e => setForm(f => ({ ...f, introduction: e.target.value }))} rows={3} className="inp" /></div>
                            <div className="field"><label>Хэл</label><div className="chip-row">{LANGUAGES.map(l => <button key={l} type="button" onClick={() => toggle('languages', l)} className={`chip${form.languages.includes(l) ? ' active' : ''}`}>{l}</button>)}</div></div>
                            <div className="field"><label>Мэргэшсэн чиглэл</label><div className="chip-row">{SPECIALTIES.map(s => <button key={s} type="button" onClick={() => toggle('specialties', s)} className={`chip${form.specialties.includes(s) ? ' active' : ''}`}>{s}</button>)}</div></div>
                            <div className="row" style={{ gap: 10, paddingTop: 4 }}>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-ghost" style={{ flex: 1 }}>Цуцлах</button>
                                <button onClick={handleSubmit} className="btn btn-ink" style={{ flex: 1 }}>{editing ? 'Засах' : 'Бүртгэх'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Tab: Accommodations ─────────────────────────────────
const AccommodationsTab: React.FC = () => {
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Accommodation | null>(null);
    const [form, setForm] = useState({ name: '', images: [] as string[], description: '', type: '3성급 호텔', location: '' });

    const load = async () => {
        try {
            const data = await api.accommodations.list();
            if (Array.isArray(data)) setAccommodations(data.map((a: any) => ({
                id: a.id, name: a.name, images: typeof a.images === 'string' ? JSON.parse(a.images || '[]') : (a.images || []),
                description: a.description || '', type: a.type || '', location: a.location || '',
            })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => { setForm({ name: '', images: [], description: '', type: '3성급 호텔', location: '' }); setEditing(null); };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; if (!files) return;
        try { const urls = await Promise.all(Array.from(files).map(f => uploadImage(f, 'accommodations'))); setForm(f => ({ ...f, images: [...f.images, ...urls] })); }
        catch { alert('Зураг байршуулахад алдаа гарлаа'); }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.location) { alert('Байрны нэр болон байршил заавал шаардлагатай.'); return; }
        try {
            const payload = { name: form.name, images: form.images, description: form.description, type: form.type, location: form.location };
            if (editing) { await api.accommodations.update(editing.id, payload); }
            else { await api.accommodations.create({ ...payload, id: `ACCOM-${Date.now()}` }); }
            await load(); setIsModalOpen(false); resetForm();
        } catch (e: any) { alert('Хадгалахад алдаа гарлаа: ' + e.message); }
    };

    const handleDelete = async (id: string) => { if (!confirm('Устгах уу?')) return; try { await api.accommodations.delete(id); await load(); } catch { alert('Устгахад алдаа гарлаа'); } };

    return (
        <div>
            <div className="toolbar">
                <div className="cell-muted" style={{ fontSize: 13, minWidth: 0 }}>Байрыг бүртгэж захиалгад хуваарилна.</div>
                <div className="spacer" />
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn btn-ink">
                    <Icon name="add" /> Байр бүртгэх
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {accommodations.map(a => (
                    <div key={a.id} className="card card-pad grid grid-cols-[96px_1fr_auto] gap-4 items-center" style={{ padding: 14 }}>
                        <div className="flex-shrink-0 overflow-hidden" style={{ width: 96, height: 72, borderRadius: 'var(--r-md)', background: 'var(--mrt-gray-100)' }}>
                            {a.images.length > 0 ? <img src={a.images[0]} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="hotel" style={{ fontSize: 30, color: 'var(--mrt-gray-300)' }} /></div>}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="cell-strong truncate" style={{ fontSize: 15 }}>{a.name}</h3>
                                {a.type && <span className="badge b-gray" style={{ padding: '2px 7px', fontSize: 10.5 }}>{a.type}</span>}
                            </div>
                            <div className="cell-muted mb-1 inline-flex items-center gap-0.5" style={{ fontSize: 11 }}><Icon name="location_on" style={{ fontSize: 14 }} />{a.location}</div>
                            <p className="cell-muted line-clamp-1" style={{ fontSize: 12.5 }}>{a.description || 'Тайлбар алга'}</p>
                        </div>
                        <div className="row-actions items-center" style={{ alignItems: 'center' }}>
                            <button onClick={() => { setEditing(a); setForm({ name: a.name, images: a.images, description: a.description, type: a.type, location: a.location }); setIsModalOpen(true); }} className="act-btn" title="Засах"><Icon name="edit" /></button>
                            <button onClick={() => handleDelete(a.id)} className="act-btn danger" title="Устгах"><Icon name="delete" /></button>
                        </div>
                    </div>
                ))}
                {accommodations.length === 0 && <div className="col-span-full empty"><Icon name="hotel" /><p>Бүртгэгдсэн байр алга</p></div>}
            </div>

            {isModalOpen && (
                <div className="picker-scrim">
                    <div className="picker" style={{ width: 520, maxHeight: '90vh' }}>
                        <div className="card-head" style={{ flexShrink: 0 }}>
                            <h2>{editing ? 'Байр засах' : 'Байр бүртгэх'}</h2>
                            <div className="spacer" />
                            <button className="act-btn" onClick={() => { setIsModalOpen(false); resetForm(); }} title="Хаах"><Icon name="close" /></button>
                        </div>
                        <div className="picker-list" style={{ padding: '20px 22px' }}>
                            <div className="field">
                                <label>Зураг</label>
                                {form.images.length > 0 && <div className="grid grid-cols-3 gap-2 mb-2">{form.images.map((img, i) => <div key={i} className="relative aspect-video"><img src={img} className="w-full h-full object-cover rounded-lg" /><button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><span className="material-symbols-outlined text-xs">close</span></button></div>)}</div>}
                                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                                    <Icon name="add_photo_alternate" /> Зураг нэмэх <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                            <div className="field"><label>Байрны нэр *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="inp" /></div>
                            <div className="field"><label>Байршил *</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="inp" placeholder="жишээ: Улаанбаатар хот, Тэрэлж байгалийн цогцолбор" /></div>
                            <div className="field">
                                <label>Байрны төрөл</label>
                                {Object.entries(ACCOM_TYPES).map(([cat, subs]) => (
                                    <div key={cat} style={{ marginBottom: 12 }}>
                                        <p className="cell-muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{cat}</p>
                                        <div className="chip-row">{subs.map(s => <button key={s} type="button" onClick={() => setForm(f => ({ ...f, type: s }))} className={`chip${form.type === s ? ' active' : ''}`}>{s}</button>)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="field"><label>Тайлбар</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="inp" /></div>
                            <div className="row" style={{ gap: 10, paddingTop: 4 }}>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-ghost" style={{ flex: 1 }}>Цуцлах</button>
                                <button onClick={handleSubmit} className="btn btn-ink" style={{ flex: 1 }}>{editing ? 'Засах' : 'Бүртгэх'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────
const TABS = [
    { id: 'templates', label: 'Аялалын загвар', icon: 'event_note' },
    { id: 'guides', label: 'Хөтчийн удирдлага', icon: 'badge' },
    { id: 'accommodations', label: 'Байрны удирдлага', icon: 'hotel' },
];

export const AdminTemplateManage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('templates');

    return (
        <AdminLayout activePage="templates" title="Загварын удирдлага">
            <div className="seg" style={{ marginBottom: 18 }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? 'active' : ''}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'templates' && <TemplatesTab />}
            {activeTab === 'guides' && <GuidesTab />}
            {activeTab === 'accommodations' && <AccommodationsTab />}
        </AdminLayout>
    );
};
