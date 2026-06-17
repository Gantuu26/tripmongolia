import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

interface ReviewItem {
    id: string | number;
    author: string;
    visitDate?: string;
    rating: number;
    content: string;
    images: string[];
    productName: string;
}

// 실제 후기가 등록되기 전까지 보여줄 여행자 후기 샘플 (한국어). 실제 후기가 있으면 그쪽 우선.
const SAMPLE_REVIEWS: ReviewItem[] = [
    { id: 's1', author: '김지현', rating: 5, content: '테렐지 게르에서 본 밤하늘 은하수는 평생 못 잊을 것 같아요. 가이드님이 인생샷도 정말 잘 찍어주셨어요!', productName: '중앙 몽골 4박5일', visitDate: '2026.05', images: [] },
    { id: 's2', author: '이수민', rating: 5, content: '고비사막 별빛 투어 강력 추천합니다. 한국어 가이드분이 계셔서 부모님 모시고 갔는데도 전혀 불편함이 없었어요.', productName: '고비사막 투어', visitDate: '2026.05', images: [] },
    { id: 's3', author: '박준영', rating: 5, content: '승마 체험이 생각보다 훨씬 재밌었어요. 완전 초보였는데 친절하게 알려주셔서 안전하게 즐겼습니다.', productName: '승마 여행', visitDate: '2026.04', images: [] },
    { id: 's4', author: '최은지', rating: 5, content: '홉스굴 호수 물색이 미쳤어요... 찍는 사진마다 화보였습니다. 일정도 여유롭게 잘 짜주셔서 만족스러웠어요.', productName: '홉스굴 4박5일', visitDate: '2026.04', images: [] },
    { id: 's5', author: '정민호', rating: 5, content: '맞춤 견적으로 우리 가족 일정에 딱 맞게 짜주셨어요. 현지 음식도 입맛 맞게 챙겨주셔서 감동했습니다.', productName: '맞춤 가족여행', visitDate: '2026.06', images: [] },
    { id: 's6', author: '한소영', rating: 5, content: '울란바토르 시내부터 테렐지까지 알차게 다녀왔어요. 차량도 깨끗하고 기사님 안전운전 최고였습니다.', productName: '중앙 몽골 3박4일', visitDate: '2026.05', images: [] },
    { id: 's7', author: '윤재호', rating: 5, content: '별 보러 갔다가 인생샷만 200장 건졌네요. 다음엔 꼭 친구들이랑 다시 올 거예요. 강추!', productName: '고비사막 5박6일', visitDate: '2026.03', images: [] },
    { id: 's8', author: '강하늘', rating: 5, content: '신혼여행으로 다녀왔는데 프라이빗하게 즐길 수 있어서 너무 좋았어요. 게르 숙소도 로맨틱했습니다.', productName: '허스타이·테렐지', visitDate: '2026.06', images: [] },
];

export const ReviewSection: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: reviews = [] } = useQuery<ReviewItem[]>({
        queryKey: ['homeReviews'],
        queryFn: async () => {
            try {
                const data = await api.reviews.list();
                if (Array.isArray(data)) {
                    return data.slice(0, 10).map((r: any) => {
                        let parsedImages = [];
                        try {
                            parsedImages = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                        } catch (e) {
                            parsedImages = [];
                        }

                        return {
                            id: r.id,
                            author: r.user_name,
                            visitDate: r.visit_date,
                            rating: r.rating,
                            content: r.content,
                            images: parsedImages,
                            productName: r.product_name || t('home.reviews.default_product')
                        };
                    });
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
            return [];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    // 실제 후기가 있으면 우선, 없으면 샘플 여행자 후기
    const usingSamples = reviews.length === 0;
    const base: ReviewItem[] = usingSamples ? SAMPLE_REVIEWS : reviews;
    // 자연스러운 무한 슬라이드를 위해 최소 6개 확보 후 2배 복제(translateX -50%로 한 바퀴)
    const source = base.length >= 6 ? base : [...base, ...base, ...base].slice(0, Math.max(6, base.length));
    const loop = [...source, ...source];

    const edgeFade = 'linear-gradient(to right, transparent 0, #000 4%, #000 96%, transparent 100%)';

    return (
        <section className="py-12 bg-white dark:bg-background-dark">
            <div className="max-w-[1280px] mx-auto">
                <div className="flex items-end justify-between mb-6 px-5">
                    <div>
                        <h3 className="text-xl font-bold text-[#0e1a18] dark:text-white mb-2">{t('home.reviews.title')}</h3>
                    </div>
                    <button
                        onClick={() => navigate('/reviews')}
                        className="flex items-center gap-1 text-primary text-sm font-bold whitespace-nowrap shrink-0 mb-0.5 hover:text-primary/80 transition-colors"
                    >
                        {t('home.reviews.view_all')}
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>

                <div className="overflow-hidden" style={{ WebkitMaskImage: edgeFade, maskImage: edgeFade }}>
                    <div className="tm-review-marquee-m flex pt-2 pb-8" style={{ width: 'max-content' }}>
                        {loop.map((review, i) => (
                            <div
                                key={`${review.id}-${i}`}
                                onClick={() => navigate(usingSamples ? '/reviews' : `/reviews/${review.id}`)}
                                className="min-w-[300px] w-[300px] h-[220px] mr-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] cursor-pointer flex flex-col justify-between"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm shrink-0">
                                            {review.author?.charAt(0) || t('home.reviews.anonymous')}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">{review.author} {t('home.reviews.user_suffix')}</div>
                                            <div className="flex text-yellow-400 text-[12px]">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="material-symbols-outlined"
                                                        style={{ fontSize: '14px', fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                        {review.content}
                                    </p>
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-700">
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 line-clamp-1">
                                        {review.productName}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes tmReviewMarqueeM { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .tm-review-marquee-m { animation: tmReviewMarqueeM 55s linear infinite; will-change: transform; }
                .tm-review-marquee-m:active { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) { .tm-review-marquee-m { animation: none; } }
            `}</style>
        </section>
    );
};
