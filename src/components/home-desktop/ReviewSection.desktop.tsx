import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { SectionHeader } from '../desktop-primitives/SectionHeader';

interface ReviewSectionProps {
    contentWidth?: number;
}

interface ReviewItem {
    id: string | number;
    author: string;
    rating: number;
    content: string;
    productName: string;
    visitDate?: string;
}

// 실제 후기가 등록되기 전까지 보여줄 여행자 후기 샘플 (한국어). 실제 후기가 있으면 그쪽을 우선 사용.
const SAMPLE_REVIEWS: ReviewItem[] = [
    { id: 's1', author: '김지현', rating: 5, content: '테렐지 게르에서 본 밤하늘 은하수는 평생 못 잊을 것 같아요. 가이드님이 인생샷도 정말 잘 찍어주셨어요!', productName: '중앙 몽골 4박5일', visitDate: '2026.05' },
    { id: 's2', author: '이수민', rating: 5, content: '고비사막 별빛 투어 강력 추천합니다. 한국어 가이드분이 계셔서 부모님 모시고 갔는데도 전혀 불편함이 없었어요.', productName: '고비사막 투어', visitDate: '2026.05' },
    { id: 's3', author: '박준영', rating: 5, content: '승마 체험이 생각보다 훨씬 재밌었어요. 완전 초보였는데 친절하게 알려주셔서 안전하게 즐겼습니다.', productName: '승마 여행', visitDate: '2026.04' },
    { id: 's4', author: '최은지', rating: 5, content: '홉스굴 호수 물색이 미쳤어요... 찍는 사진마다 화보였습니다. 일정도 여유롭게 잘 짜주셔서 만족스러웠어요.', productName: '홉스굴 4박5일', visitDate: '2026.04' },
    { id: 's5', author: '정민호', rating: 5, content: '맞춤 견적으로 우리 가족 일정에 딱 맞게 짜주셨어요. 현지 음식도 입맛 맞게 챙겨주셔서 감동했습니다.', productName: '맞춤 가족여행', visitDate: '2026.06' },
    { id: 's6', author: '한소영', rating: 5, content: '울란바토르 시내부터 테렐지까지 알차게 다녀왔어요. 차량도 깨끗하고 기사님 안전운전 최고였습니다.', productName: '중앙 몽골 3박4일', visitDate: '2026.05' },
    { id: 's7', author: '윤재호', rating: 5, content: '별 보러 갔다가 인생샷만 200장 건졌네요. 다음엔 꼭 친구들이랑 다시 올 거예요. 강추!', productName: '고비사막 5박6일', visitDate: '2026.03' },
    { id: 's8', author: '강하늘', rating: 5, content: '신혼여행으로 다녀왔는데 프라이빗하게 즐길 수 있어서 너무 좋았어요. 게르 숙소도 로맨틱했습니다.', productName: '허스타이·테렐지', visitDate: '2026.06' },
];

export function ReviewSectionDesktop({ contentWidth = 1280 }: ReviewSectionProps) {
    const navigate = useNavigate();

    interface RawReview {
        id?: string | number;
        user_name?: string;
        rating?: number;
        content?: string;
        product_name?: string;
        visit_date?: string;
    }

    const { data: reviews = [] } = useQuery<ReviewItem[]>({
        queryKey: ['homeReviewsDesktop'],
        queryFn: async () => {
            try {
                const data = await api.reviews.list();
                if (Array.isArray(data)) {
                    return (data as RawReview[]).map((r) => ({
                        id: r.id ?? '',
                        author: r.user_name || '',
                        rating: r.rating || 5,
                        content: r.content || '',
                        productName: r.product_name || '몽골투어',
                        visitDate: r.visit_date,
                    }));
                }
            } catch (e) {
                console.error('Error fetching reviews:', e);
            }
            return [];
        },
        staleTime: 1000 * 60 * 10,
    });

    // 실제 후기가 있으면 우선 사용, 없으면 샘플 여행자 후기
    const usingSamples = reviews.length === 0;
    const base: ReviewItem[] = usingSamples ? SAMPLE_REVIEWS : reviews;
    // 카드 수가 적으면 자연스러운 무한 슬라이드가 안 되므로 최소 6개 확보
    const source = base.length >= 6 ? base : [...base, ...base, ...base].slice(0, Math.max(6, base.length));
    // 끊김 없는 루프를 위해 2배 복제 (translateX -50%로 정확히 한 바퀴)
    const loop = [...source, ...source];

    const edgeFade = 'linear-gradient(to right, transparent 0, #000 3%, #000 97%, transparent 100%)';

    const card = (r: ReviewItem, key: string | number) => (
        <div
            key={key}
            role="button"
            onClick={() => navigate(usingSamples ? '/reviews' : `/reviews/${r.id}`)}
            style={{
                flex: '0 0 auto',
                width: 340,
                background: '#fff',
                borderRadius: 20,
                padding: 26,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-review)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 244,
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        background: 'var(--primary-tint)',
                        color: '#ff385c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        flexShrink: 0,
                    }}
                >
                    {r.author?.charAt(0) || '?'}
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 3 }}>
                        {r.author} 님
                    </div>
                    <div style={{ display: 'flex', gap: 1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MatIcon key={i} name="star" size={14} filled color={i < r.rating ? '#facc15' : '#e2e8f0'} />
                        ))}
                    </div>
                </div>
            </div>
            <div
                style={{
                    fontSize: 14,
                    color: 'var(--fg-3)',
                    lineHeight: 1.65,
                    flex: 1,
                    marginBottom: 16,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {r.content}
            </div>
            <div
                style={{
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--fg-5)',
                }}
            >
                <span
                    style={{
                        fontWeight: 700,
                        color: 'var(--fg-3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                    }}
                >
                    {r.productName}
                </span>
                {r.visitDate && <span>{r.visitDate}</span>}
            </div>
        </div>
    );

    return (
        <section style={{ maxWidth: contentWidth, margin: '0 auto', padding: '72px 32px 0' }}>
            <SectionHeader
                eyebrow="Real Reviews"
                title="실제 여행자 후기"
                subtitle="한국어 가이드가 동행하는 안심 몽골투어, 고객의 목소리"
                onAll={() => navigate('/reviews')}
            />
            <div style={{ overflow: 'hidden', WebkitMaskImage: edgeFade, maskImage: edgeFade }}>
                <div className="tm-review-marquee" style={{ display: 'flex', gap: 18, width: 'max-content', paddingBottom: 6 }}>
                    {loop.map((r, i) => card(r, `${r.id}-${i}`))}
                </div>
            </div>
            <style>{`
                @keyframes tmReviewMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .tm-review-marquee { animation: tmReviewMarquee 60s linear infinite; will-change: transform; }
                .tm-review-marquee:hover { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) { .tm-review-marquee { animation: none; } }
            `}</style>
        </section>
    );
}
