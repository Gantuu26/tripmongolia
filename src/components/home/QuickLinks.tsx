import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

// Custom red line icons supplied by the owner (transparent PNG).
import tourIcon from '../../assets/icons/tour.png';
import matesIcon from '../../assets/icons/mates.png';
import quoteIcon from '../../assets/icons/quote.png';

interface QuickLink {
    id: string;
    icon: string;
    image?: string;
    label: string;
    sub?: string;
    path: string;
}

// Mobile home intentionally shows only 3 shortcuts (tour / travel-mates / quote)
// with no sub-labels. PC (QuickLinksRow.desktop) keeps the full 6-item row.
// quick_links DB rows (if ≥3) still override these defaults.
const DEFAULT_LINKS: QuickLink[] = [
    { id: 'tour', icon: 'explore', image: tourIcon, label: '투어 상품', path: '/products' },
    { id: 'mates', icon: 'groups', image: matesIcon, label: '동행자 모집', path: '/travel-mates' },
    { id: 'quote', icon: 'request_quote', image: quoteIcon, label: '견적 문의', path: '/custom-estimate' },
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
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-active:scale-95 transition-all overflow-hidden p-3">
                            {link.image ? (
                                <img
                                    src={link.image}
                                    alt={link.label}
                                    width={64}
                                    height={64}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: 30 }}>{link.icon}</span>
                            )}
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{link.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};
