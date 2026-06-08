import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { PageHero } from '../desktop-primitives/PageHero';

interface ApiMatePost {
    id: string;
    title: string;
    description?: string;
    image?: string;
    region?: string;
    startDate?: string;
    endDate?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    gender?: string;
    ageGroups?: string | string[];
    age_groups?: string | string[];
    styles?: string | string[];
    recruitCount?: number;
    recruit_count?: number;
    maxMembers?: number;
    max_members?: number;
    currentMembers?: number;
    current_members?: number;
    status?: string;
    createdAt?: string;
    created_at?: string;
    authorName?: string;
    author_name?: string;
    viewCount?: number;
    view_count?: number;
}

interface MatePost {
    id: string;
    title: string;
    excerpt: string;
    image: string;
    region: string;
    dateRange: string;
    duration: string;
    styles: string[];
    ageGroups: string[];
    gender: string;
    status: 'open' | 'almost' | 'full';
    capacity: number;
    joined: number;
    views: number;
    authorName: string;
    authorInitial: string;
    postedAgo: string;
}

const REGION_PILLS = [
    { id: 'all', label: '전체', icon: '🌐' },
    { id: 'central-mongolia', label: '중앙몽골', icon: '🏞️' },
    { id: 'gobi-desert', label: '고비사막', icon: '🏜️' },
    { id: 'khuvsgul', label: '홉스굴', icon: '🏔️' },
    { id: 'terelj', label: '테렐지', icon: '🐎' },
    { id: 'trekking', label: '트레킹', icon: '🥾' },
    { id: 'golf', label: '골프', icon: '⛳' },
];

const STYLE_OPTIONS = ['🌌 별빛', '🐎 승마', '📸 촬영', '⛺ 캠핑', '🍽️ 미식', '🧘 힐링', '🥾 트레킹', '🏛️ 문화'];
const STATUS_OPTIONS = [
    { v: 'open' as const, l: '모집 중' },
    { v: 'almost' as const, l: '잔여석 얼마 안 남음' },
    { v: 'full' as const, l: '매칭 완료' },
];

interface Filters {
    gender: string[];
    age: string[];
    styles: string[];
    status: string[];
    people: string[];
}

const DEFAULT_FILTERS: Filters = {
    gender: [],
    age: [],
    styles: [],
    status: [],
    people: [],
};

function parseJsonArray(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
}

function formatRange(start?: string, end?: string): string {
    if (!start) return '';
    const s = start.replace(/-/g, '.');
    if (!end) return s;
    const e = end.replace(/-/g, '.');
    // If same year, abbreviate end
    if (s.slice(0, 4) === e.slice(0, 4)) return `${s} 〜 ${e.slice(5)}`;
    return `${s} 〜 ${e}`;
}

function timeAgo(iso?: string): string {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    const w = Math.floor(d / 7);
    return `${w}주 전`;
}

function statusFrom(p: ApiMatePost, capacity: number, joined: number): 'open' | 'almost' | 'full' {
    if (p.status === 'closed' || p.status === 'full' || p.status === 'matched') return 'full';
    if (capacity > 0 && joined >= capacity) return 'full';
    if (capacity > 0 && joined / capacity >= 0.75) return 'almost';
    return 'open';
}

export function TravelMatesDesktop({ contentWidth = 1280 }: { contentWidth?: number }) {
    const navigate = useNavigate();
    const [region, setRegion] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'recent' | 'popular' | 'almost'>('recent');
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

    const { data: posts = [], isLoading } = useQuery<MatePost[]>({
        queryKey: ['travelMates', 'desktop'],
        queryFn: async () => {
            try {
                const data = await api.travelMates.list();
                if (!Array.isArray(data)) return [];
                return (data as ApiMatePost[]).map((p): MatePost => {
                    const capacity = p.recruitCount ?? p.recruit_count ?? p.maxMembers ?? p.max_members ?? 0;
                    const joined = p.currentMembers ?? p.current_members ?? 0;
                    const start = p.startDate || p.start_date;
                    const end = p.endDate || p.end_date;
                    const authorName = p.authorName || p.author_name || '익명';
                    return {
                        id: p.id,
                        title: p.title || '',
                        excerpt: p.description || '',
                        image: p.image || '/og-image.jpg',
                        region: p.region || '',
                        dateRange: formatRange(start, end),
                        duration: p.duration || '',
                        styles: parseJsonArray(p.styles).slice(0, 4),
                        ageGroups: parseJsonArray(p.ageGroups || p.age_groups),
                        gender: p.gender || '무관',
                        status: statusFrom(p, capacity, joined),
                        capacity,
                        joined,
                        views: p.viewCount ?? p.view_count ?? 0,
                        authorName,
                        authorInitial: authorName.charAt(0),
                        postedAgo: timeAgo(p.createdAt || p.created_at),
                    };
                });
            } catch (e) {
                console.error('TravelMates fetch error:', e);
                return [];
            }
        },
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
    });

    const filtered = useMemo(() => {
        let list = posts.slice();
        if (region !== 'all') list = list.filter((p) => p.region === region || regionMatch(p.region, region));
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.region || '').toLowerCase().includes(q));
        }
        if (filters.status.length > 0) list = list.filter((p) => filters.status.includes(p.status));
        if (filters.styles.length > 0) {
            list = list.filter((p) => filters.styles.some((s) => p.styles.some((ps) => ps.includes(s.replace(/^[^ ]+ /, '')))));
        }

        list.sort((a, b) => {
            if (sort === 'popular') return b.views - a.views;
            if (sort === 'almost') {
                const ar = a.capacity > 0 ? a.joined / a.capacity : 0;
                const br = b.capacity > 0 ? b.joined / b.capacity : 0;
                return br - ar;
            }
            return Number(b.id) - Number(a.id);
        });
        return list;
    }, [posts, region, search, filters, sort]);

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    return (
        <div style={{ background: '#fff' }}>
            <PageHero
                eyebrow="Travel Mates"
                title="동행자를 찾아보세요"
                subtitle="몽골을 함께 여행할 친구를 모집하거나 참여하실 수 있습니다. 같은 취미·예산·일정으로 여행 경비를 분담하여 더욱 깊이 있게 현지를 즐기실 수 있습니다."
                breadcrumbs={[
                    { label: '홈', path: '/' },
                    { label: '동행자 모집' },
                ]}
                contentWidth={contentWidth}
                aside={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/travel-mates/write')}
                            style={{
                                padding: '14px 24px',
                                background: '#ff385c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 8px 20px -6px rgba(255, 56, 92,0.45)',
                            }}
                        >
                            <MatIcon name="add" size={18} color="#fff" />
                            동행자 모집하기
                        </button>
                        <span style={{ fontSize: 11, color: 'var(--fg-5)' }}>무료 · 1분 만에 게시</span>
                    </div>
                }
            >
                <div style={{ display: 'flex', gap: 24, marginTop: 22 }}>
                    {[
                        { n: String(posts.length), l: '모집 중인 여행' },
                        { n: '1.2k', l: '등록 회원' },
                        { n: '~2일', l: '평균 매칭 시간' },
                    ].map((s) => (
                        <div key={s.l}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.02em' }}>{s.n}</div>
                            <div style={{ fontSize: 12, color: 'var(--fg-5)', marginTop: 2 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
                {/* Search bar */}
                <div
                    style={{
                        marginTop: 28,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#fff',
                        borderRadius: 14,
                        padding: '8px 8px 8px 18px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-toss)',
                    }}
                >
                    <MatIcon name="search" size={20} color="var(--fg-5)" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="목적지 (예: 고비사막, 테렐지)·키워드로 검색"
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 14,
                            color: 'var(--fg-1)',
                            padding: '10px 0',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
            </PageHero>

            {/* Region pills */}
            <section style={{ maxWidth: contentWidth, margin: '0 auto', padding: '28px 32px 0' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {REGION_PILLS.map((r) => {
                        const on = region === r.id;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRegion(r.id)}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: 999,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    background: on ? 'var(--primary-dark)' : '#fff',
                                    color: on ? '#fff' : 'var(--fg-2)',
                                    border: on ? '1px solid var(--primary-dark)' : '1px solid var(--border)',
                                    fontSize: 13,
                                    fontWeight: on ? 700 : 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    boxShadow: on ? '0 4px 14px -4px rgba(255, 56, 92,0.4)' : 'none',
                                }}
                            >
                                <span>{r.icon}</span>
                                <span>{r.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Body — sidebar + grid */}
            <section style={{ maxWidth: contentWidth, margin: '0 auto', padding: '32px 32px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>
                    <aside style={{ position: 'sticky', top: 168 }}>
                        <FilterSidebar filters={filters} onChange={setFilters} onReset={resetFilters} />
                    </aside>

                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: 18,
                                marginBottom: 24,
                                borderBottom: '1px solid var(--border-subtle)',
                            }}
                        >
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', margin: 0, letterSpacing: '-0.01em' }}>
                                    모집 중인 멤버
                                </h2>
                                <div style={{ fontSize: 13, color: 'var(--fg-5)', marginTop: 4 }}>
                                    <span style={{ color: 'var(--fg-1)', fontWeight: 700 }}>{filtered.length}건</span>의 모집을 찾았습니다
                                </div>
                            </div>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as typeof sort)}
                                style={selectStyle}
                            >
                                <option value="recent">최신순</option>
                                <option value="popular">인기순</option>
                                <option value="almost">잔여석 적은순</option>
                            </select>
                        </div>

                        {isLoading ? (
                            <div style={{ padding: 80, textAlign: 'center', color: 'var(--fg-5)' }}>불러오는 중...</div>
                        ) : filtered.length === 0 ? (
                            <EmptyState onCta={() => navigate('/travel-mates/write')} />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                                {filtered.map((p) => (
                                    <MateCard key={p.id} p={p} onClick={() => navigate(`/travel-mates/${p.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Promo at bottom */}
            <section style={{ maxWidth: contentWidth, margin: '64px auto 0', padding: '0 32px' }}>
                <div
                    style={{
                        padding: '36px 48px',
                        background: 'linear-gradient(120deg, #ff385c 0%, #e00b41 100%)',
                        borderRadius: 24,
                        color: '#fff',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 24,
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            right: -40,
                            top: -50,
                            width: 220,
                            height: 220,
                            borderRadius: 999,
                            background: 'radial-gradient(circle, rgba(94,234,212,0.18) 0%, transparent 70%)',
                        }}
                    />
                    <div style={{ position: 'relative' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#fda4af', textTransform: 'uppercase', marginBottom: 8 }}>
                            Be the host
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                            당신이 여행의 호스트가 되어보지 않으시겠어요?
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 1.6 }}>
                            모집글을 작성하시면 평균 2일 만에 참가자가 모입니다. 일정·비용을 공유하여 알뜰하고 깊이 있게 여행을 즐기실 수 있습니다.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/travel-mates/write')}
                        style={{
                            padding: '14px 28px',
                            background: '#fff',
                            color: 'var(--primary-dark)',
                            border: 'none',
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            position: 'relative',
                        }}
                    >
                        동행자 모집하기 <MatIcon name="arrow_forward" size={18} color="var(--primary-dark)" />
                    </button>
                </div>
            </section>
        </div>
    );
}

function regionMatch(postRegion: string | undefined, pillId: string): boolean {
    if (!postRegion) return false;
    const lower = postRegion.toLowerCase();
    return (pillId === 'gobi-desert' && (lower.includes('gobi') || postRegion.includes('ゴビ'))) ||
        (pillId === 'central-mongolia' && (lower.includes('central') || postRegion.includes('中央'))) ||
        (pillId === 'khuvsgul' && (lower.includes('khuvsgul') || postRegion.includes('フブスグル'))) ||
        (pillId === 'terelj' && (lower.includes('terelj') || postRegion.includes('テレルジ'))) ||
        (pillId === 'trekking' && (lower.includes('trekking') || postRegion.includes('トレッキング'))) ||
        (pillId === 'golf' && (lower.includes('golf') || postRegion.includes('ゴルフ')));
}

function MateCard({ p, onClick }: { p: MatePost; onClick: () => void }) {
    const pct = p.capacity > 0 ? (p.joined / p.capacity) * 100 : 0;
    const statusInfo = {
        open: { label: '모집 중', bg: '#ff385c' },
        almost: { label: '잔여석 얼마 안 남음', bg: '#dc2626' },
        full: { label: '매칭 완료', bg: 'var(--fg-4)' },
    }[p.status];

    return (
        <div
            onClick={onClick}
            role="button"
            style={{
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-toss)',
                cursor: 'pointer',
                transition: 'all 200ms var(--ease-out)',
                display: 'flex',
                flexDirection: 'column',
                opacity: p.status === 'full' ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 14px 30px -6px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-toss)';
                e.currentTarget.style.transform = '';
            }}
        >
            <div
                style={{
                    position: 'relative',
                    aspectRatio: '16/10',
                    backgroundImage: `url(${p.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 30%, transparent 60%, rgba(0,0,0,0.45) 100%)',
                    }}
                />
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    <span
                        style={{
                            padding: '5px 10px',
                            background: statusInfo.bg,
                            color: '#fff',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                        }}
                    >
                        {statusInfo.label}
                    </span>
                </div>
                {p.views > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            padding: '4px 10px',
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(6px)',
                            borderRadius: 999,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <MatIcon name="visibility" size={13} color="#fff" /> {p.views}
                    </div>
                )}
                {p.region && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 12,
                            left: 14,
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        <MatIcon name="location_on" size={16} filled color="#fff" /> {p.region}
                    </div>
                )}
            </div>

            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--fg-1)',
                        lineHeight: 1.4,
                        marginBottom: 8,
                        letterSpacing: '-0.01em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 44,
                    }}
                >
                    {p.title}
                </div>
                {p.excerpt && (
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--fg-4)',
                            marginBottom: 12,
                            lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {p.excerpt}
                    </div>
                )}

                {p.dateRange && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 0',
                            borderTop: '1px solid var(--border-subtle)',
                            marginBottom: 10,
                        }}
                    >
                        <MatIcon name="calendar_month" size={15} color="var(--fg-5)" />
                        <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>{p.dateRange}</span>
                        {p.duration && (
                            <>
                                <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--border-strong)' }} />
                                <span style={{ fontSize: 12, color: 'var(--fg-5)' }}>{p.duration}</span>
                            </>
                        )}
                    </div>
                )}

                {p.styles.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                        {p.styles.map((s) => (
                            <span
                                key={s}
                                style={{
                                    fontSize: 11,
                                    color: 'var(--fg-3)',
                                    padding: '3px 9px',
                                    background: 'var(--bg-muted)',
                                    borderRadius: 999,
                                    fontWeight: 600,
                                }}
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 'auto' }}>
                    {p.capacity > 0 && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-3)' }}>
                                    <MatIcon name="group" size={15} color="var(--fg-3)" />
                                    <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>{p.joined}</span>
                                    <span>/ {p.capacity}명</span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: p.status === 'full' ? 'var(--fg-5)' : '#ff385c',
                                    }}
                                >
                                    {p.status === 'full' ? '모집 종료' : `잔여 ${p.capacity - p.joined}석`}
                                </span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background:
                                            p.status === 'full'
                                                ? 'var(--fg-5)'
                                                : p.status === 'almost'
                                                    ? 'linear-gradient(to right, #dc2626, #ef4444)'
                                                    : 'linear-gradient(to right, #ff385c, #e00b41)',
                                        borderRadius: 999,
                                    }}
                                />
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 14,
                            paddingTop: 12,
                            borderTop: '1px solid var(--border-subtle)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 999,
                                    background: 'var(--primary-tint)',
                                    color: '#ff385c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                {p.authorInitial}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)' }}>{p.authorName}</div>
                                {p.postedAgo && <div style={{ fontSize: 10, color: 'var(--fg-5)' }}>{p.postedAgo}</div>}
                            </div>
                        </div>
                        <MatIcon name="arrow_forward" size={18} color="var(--fg-3)" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterSidebar({ filters, onChange, onReset }: { filters: Filters; onChange: (f: Filters) => void; onReset: () => void }) {
    const toggle = (group: keyof Filters, val: string) =>
        onChange({
            ...filters,
            [group]: filters[group].includes(val) ? filters[group].filter((v) => v !== val) : [...filters[group], val],
        });

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 20,
                boxShadow: 'var(--shadow-toss)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '18px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MatIcon name="tune" size={18} color="var(--fg-2)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>필터</span>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    style={{ background: 'none', border: 'none', color: 'var(--fg-5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    초기화
                </button>
            </div>

            <FilterGroup label="모집 상태">
                {STATUS_OPTIONS.map((o) => (
                    <FilterCheckbox key={o.v} label={o.l} checked={filters.status.includes(o.v)} onChange={() => toggle('status', o.v)} />
                ))}
            </FilterGroup>

            <FilterGroup label="성별">
                {[
                    { v: 'any', l: '무관' },
                    { v: 'female', l: '여성만' },
                    { v: 'male', l: '남성만' },
                    { v: 'couple', l: '부부·커플' },
                ].map((o) => (
                    <FilterCheckbox key={o.v} label={o.l} checked={filters.gender.includes(o.v)} onChange={() => toggle('gender', o.v)} />
                ))}
            </FilterGroup>

            <FilterGroup label="연령대">
                {['20대', '30대', '40대', '50대 이상'].map((o) => (
                    <FilterCheckbox key={o} label={o} checked={filters.age.includes(o)} onChange={() => toggle('age', o)} />
                ))}
            </FilterGroup>

            <FilterGroup label="여행 스타일">
                {STYLE_OPTIONS.map((o) => (
                    <FilterCheckbox key={o} label={o} checked={filters.styles.includes(o)} onChange={() => toggle('styles', o)} />
                ))}
            </FilterGroup>

            <FilterGroup label="참가 인원" last>
                {['1~2명', '3~4명', '5명 이상'].map((o) => (
                    <FilterCheckbox key={o} label={o} checked={filters.people.includes(o)} onChange={() => toggle('people', o)} />
                ))}
            </FilterGroup>
        </div>
    );
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%',
                    padding: '16px 20px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'inherit',
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{label}</span>
                <MatIcon name={open ? 'expand_less' : 'expand_more'} size={18} color="var(--fg-4)" />
            </button>
            {open && <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>}
        </div>
    );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: 13, color: 'var(--fg-2)' }}>
            <span
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: '1.5px solid ' + (checked ? '#ff385c' : 'var(--border-strong)'),
                    background: checked ? '#ff385c' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {checked && <MatIcon name="check" size={14} color="#fff" />}
            </span>
            <input type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
            <span>{label}</span>
        </label>
    );
}

function EmptyState({ onCta }: { onCta: () => void }) {
    return (
        <div
            style={{
                padding: '60px 40px',
                textAlign: 'center',
                background: 'var(--bg-muted)',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <MatIcon name="travel_explore" size={28} color="var(--fg-5)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)' }}>조건에 맞는 모집이 없습니다</div>
            <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>당신이 첫 번째 모집자가 되어보지 않으시겠어요?</div>
            <button
                type="button"
                onClick={onCta}
                style={{
                    padding: '10px 18px',
                    background: '#ff385c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
            >
                동행자 모집하기
            </button>
        </div>
    );
}

const selectStyle: CSSProperties = {
    appearance: 'none',
    padding: '10px 36px 10px 16px',
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center`,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--fg-2)',
    cursor: 'pointer',
    fontFamily: 'inherit',
};
