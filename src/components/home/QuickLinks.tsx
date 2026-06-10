import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface QuickLink {
    id: string;
    icon: string;
    image?: string;
    label: string;
    sub?: string;
    path: string;
}

// Airbnb-red Material Symbols shortcut row. Keep in lockstep with
// QuickLinksRow.desktop's ITEMS so PC and mobile show the same shortcuts.
// quick_links DB rows (if ≥3) still override both.
const DEFAULT_LINKS: QuickLink[] = [
    { id: 'tour', icon: 'explore', label: '투어 상품', sub: '전체 플랜 목록', path: '/products' },
    { id: 'mates', icon: 'groups', label: '동행자 모집', sub: '동행 찾기', path: '/travel-mates' },
    { id: 'review', icon: 'reviews', label: '여행 리뷰', sub: '실제 후기', path: '/reviews' },
    { id: 'quote', icon: 'request_quote', label: '견적 문의', sub: '1분 만에 요청', path: '/custom-estimate' },
    { id: 'wishlist', icon: 'favorite', label: '위시리스트', sub: '저장한 투어', path: '/mypage/wishlist' },
    { id: 'support', icon: 'support_agent', label: '고객지원', sub: '24시간 대응', path: '/faq' },
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
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 30 }}>{link.icon}</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{link.label}</span>
                        {link.sub && <span className="text-[10px] text-slate-400 leading-tight">{link.sub}</span>}
                    </button>
                ))}
            </div>
        </section>
    );
};
