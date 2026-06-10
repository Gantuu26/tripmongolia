import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getOptimizedImageUrl } from '../../utils/cloudflareImage';
import { useNavigate } from 'react-router-dom';

// 3D plasticine icons — the same asset family the PC home (QuickLinksRow.desktop) uses,
// so the mobile shortcut row mirrors PC exactly.
import productsIcon from '../../assets/products_icon_v2.png';
import companionIcon from '../../assets/companion_search_icon_v2.png';
import reviewsIcon from '../../assets/my_reviews.png';
import estimateIcon from '../../assets/custom_estimate_icon_v2.png';
import wishlistIcon from '../../assets/wishlist_icon.png';
import supportIcon from '../../assets/icons/support.png';

interface QuickLink {
    id: string;
    icon: string;
    image?: string;
    label: string;
    sub?: string;
    path: string;
}

// Keep these in lockstep with QuickLinksRow.desktop's ITEMS so PC and mobile
// show the same shortcuts. quick_links DB rows (if ≥3) still override both.
const DEFAULT_LINKS: QuickLink[] = [
    { id: 'tour', icon: 'grid_view', image: productsIcon, label: '투어 상품', sub: '전체 플랜 목록', path: '/products' },
    { id: 'mates', icon: 'groups', image: companionIcon, label: '동행자 모집', sub: '동행 찾기', path: '/travel-mates' },
    { id: 'review', icon: 'star', image: reviewsIcon, label: '여행 리뷰', sub: '실제 후기', path: '/reviews' },
    { id: 'quote', icon: 'receipt_long', image: estimateIcon, label: '견적 문의', sub: '1분 만에 요청', path: '/custom-estimate' },
    { id: 'wishlist', icon: 'favorite', image: wishlistIcon, label: '위시리스트', sub: '저장한 투어', path: '/mypage/wishlist' },
    { id: 'support', icon: 'support_agent', image: supportIcon, label: '고객지원', sub: '24시간 대응', path: '/faq' },
];

export const QuickLinks: React.FC = () => {
    const navigate = useNavigate();

    const { data: links = DEFAULT_LINKS } = useQuery({
        queryKey: ['quickLinks'],
        queryFn: async () => {
            try {
                const data = await api.quickLinks.list();
                // Use DB rows only when the admin has configured a full set (≥3); otherwise defaults.
                if (data && Array.isArray(data) && data.length >= 3) {
                    return data.map((l: any) => ({
                        id: l.id,
                        icon: l.icon,
                        image: l.image,
                        label: l.label,
                        sub: l.sub,
                        path: l.path,
                    }));
                }
            } catch (error) {
                console.error('Error fetching quick links:', error);
            }
            return DEFAULT_LINKS;
        },
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });

    return (
        <section className="px-5 pt-1 pb-3 mb-2 relative">
            <div className="grid grid-cols-3 gap-y-5 gap-x-2">
                {links.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => link.path !== '#' && navigate(link.path)}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-active:scale-95 transition-all overflow-hidden p-2.5">
                            {link.image ? (
                                <img
                                    src={getOptimizedImageUrl(link.image, 'iconSmall')}
                                    alt={link.label}
                                    width={64}
                                    height={64}
                                    loading="lazy"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-primary text-2xl font-light">{link.icon}</span>
                            )}
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{link.label}</span>
                        {link.sub && <span className="text-[10px] text-slate-400 leading-tight">{link.sub}</span>}
                    </button>
                ))}
            </div>
        </section>
    );
};
