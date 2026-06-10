import { useNavigate } from 'react-router-dom';
import { MatIcon } from '../desktop-primitives/MatIcon';

interface QuickLinksRowProps {
    contentWidth?: number;
}

interface QuickItem {
    id: string;
    label: string;
    sub: string;
    icon: string;
    path: string;
}

// Airbnb-red Material Symbols shortcuts. Keep in lockstep with the mobile
// QuickLinks DEFAULT_LINKS so PC and mobile match.
const ITEMS: QuickItem[] = [
    { id: 'tour', label: '투어 상품', sub: '전체 플랜 목록', icon: 'explore', path: '/products' },
    { id: 'mates', label: '동행자 모집', sub: '동행 찾기', icon: 'groups', path: '/travel-mates' },
    { id: 'review', label: '여행 리뷰', sub: '실제 후기', icon: 'reviews', path: '/reviews' },
    { id: 'quote', label: '견적 문의', sub: '1분 만에 요청', icon: 'request_quote', path: '/custom-estimate' },
    { id: 'wishlist', label: '위시리스트', sub: '저장한 투어', icon: 'favorite', path: '/mypage/wishlist' },
    { id: 'support', label: '고객지원', sub: '24시간 대응', icon: 'support_agent', path: '/faq' },
];

export function QuickLinksRowDesktop({ contentWidth = 1280 }: QuickLinksRowProps) {
    const navigate = useNavigate();
    return (
        <section style={{ maxWidth: contentWidth, margin: '0 auto', padding: '40px 32px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                {ITEMS.map((it) => (
                    <button
                        key={it.id}
                        type="button"
                        onClick={() => navigate(it.path)}
                        style={{
                            // Minimal — no card chrome. Only the inner circle
                            // (rendered below) provides visual structure, matching
                            // the reference design's floating-circle row.
                            background: 'transparent',
                            border: 'none',
                            padding: '8px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 220ms var(--ease-out, ease-out)',
                            fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = '';
                        }}
                    >
                        <div
                            style={{
                                width: 84,
                                height: 84,
                                borderRadius: 999,
                                background: 'var(--primary-soft, #ffe4e6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'inset 0 0 0 1px rgba(255,56,92,0.10)',
                            }}
                        >
                            <MatIcon name={it.icon} size={40} color="var(--primary, #ff385c)" />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'var(--fg-1)',
                                    lineHeight: 1.3,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {it.label}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--fg-5)',
                                    marginTop: 4,
                                    fontWeight: 500,
                                }}
                            >
                                {it.sub}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
