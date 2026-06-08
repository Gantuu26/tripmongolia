import { useNavigate } from 'react-router-dom';

// 3D plasticine icons — same asset family the mobile QuickLinks uses, but
// rendered larger on PC to match the Yanolja-style reference (vertical card,
// big colorful icon on top, short label underneath).
import productsIcon from '../../assets/products_icon_v2.png';
import companionIcon from '../../assets/companion_search_icon_v2.png';
import reviewsIcon from '../../assets/my_reviews.png';
import estimateIcon from '../../assets/custom_estimate_icon_v2.png';
import wishlistIcon from '../../assets/wishlist_icon.png';
import supportIcon from '../../assets/icons/support.png';

interface QuickLinksRowProps {
    contentWidth?: number;
}

interface QuickItem {
    id: string;
    label: string;
    sub: string;
    img: string;
    path: string;
}

const ITEMS: QuickItem[] = [
    { id: 'tour', label: '투어 상품', sub: '전체 플랜 목록', img: productsIcon, path: '/products' },
    { id: 'mates', label: '동행자 모집', sub: '동행 찾기', img: companionIcon, path: '/travel-mates' },
    { id: 'review', label: '여행 리뷰', sub: '실제 후기', img: reviewsIcon, path: '/reviews' },
    { id: 'quote', label: '견적 문의', sub: '1분 만에 요청', img: estimateIcon, path: '/custom-estimate' },
    { id: 'wishlist', label: '위시리스트', sub: '저장한 투어', img: wishlistIcon, path: '/mypage/wishlist' },
    { id: 'support', label: '고객지원', sub: '24시간 대응', img: supportIcon, path: '/faq' },
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
                                background: '#f1f4f8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
                            }}
                        >
                            <img
                                src={it.img}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                style={{
                                    width: 56,
                                    height: 56,
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
                                }}
                            />
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
