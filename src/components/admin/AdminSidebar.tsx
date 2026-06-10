import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Icon } from './console/Icon';

interface AdminSidebarProps {
    activePage: string;
    /** kept for backward-compat with existing call sites; the redesign is light-only */
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

interface NavItem {
    id: string;
    icon: string;
    label: string;
    href: string;
    count?: number;
}

const primaryItems: NavItem[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Хяналтын самбар', href: '/admin' },
    { id: 'reservations', icon: 'assignment', label: 'Нэгдсэн захиалгын удирдлага', href: '/admin/reservations' },
    { id: 'calendar', icon: 'calendar_today', label: 'Аяллын хуанли', href: '/admin/calendar' },
    { id: 'products', icon: 'inventory_2', label: 'Бүтээгдэхүүний удирдлага', href: '/admin/products' },
    { id: 'magazines', icon: 'menu_book', label: 'Сэтгүүлийн удирдлага', href: '/admin/magazines' },
    { id: 'templates', icon: 'folder_special', label: 'Загварын удирдлага', href: '/admin/templates' },
    { id: 'reviews', icon: 'reviews', label: 'Сэтгэгдлийн удирдлага', href: '/admin/reviews' },
    { id: 'faq', icon: 'help', label: 'FAQ удирдлага', href: '/admin/faq' },
];

const settingItems: NavItem[] = [
    { id: 'banners', icon: 'ad_units', label: 'Нүүр хуудасны удирдлага', href: '/admin/banners' },
    { id: 'categories', icon: 'category', label: 'Ангиллын удирдлага', href: '/admin/categories' },
    { id: 'hotels', icon: 'hotel', label: 'Зочид буудлын мастер', href: '/admin/hotels' },
    { id: 'tourist-spots', icon: 'location_on', label: 'Үзвэрийн газрын мастер', href: '/admin/tourist-spots' },
    { id: 'guide-intro', icon: 'translate', label: 'Хөтчийн танилцуулга (нийтлэг)', href: '/admin/guide-intro' },
    { id: 'payment', icon: 'account_balance', label: 'Төлбөрийн данс', href: '/admin/payment' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePage }) => {
    const navigate = useNavigate();
    let logout: undefined | (() => void | Promise<void>);
    try { logout = useUser().logout; } catch { logout = undefined; }

    const handleLogout = async () => {
        try { await logout?.(); } catch { /* ignore */ }
        navigate('/admin/login');
    };

    const renderItem = (item: NavItem) => {
        const isActive = activePage === item.id;
        return (
            <a key={item.id} href={item.href} className={`nav-item${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined}>
                <Icon name={item.icon} fill={isActive} />
                <span>{item.label}</span>
                {item.count ? <span className="nav-count">{item.count}</span> : null}
            </a>
        );
    };

    return (
        <aside className="side">
            <a href="/admin" className="side-brand" aria-label="MILKYWAY админ нүүр">
                <span className="brand-mark"><Icon name="flight_takeoff" /></span>
                <div>
                    <div className="brand-name">MILKYWAY</div>
                    <div className="brand-sub">Admin Console</div>
                </div>
            </a>

            <nav className="side-nav">
                {primaryItems.map(renderItem)}
                <div className="nav-group-label">Сайтын тохиргоо</div>
                {settingItems.map(renderItem)}
            </nav>

            <div className="side-foot">
                <div className="side-account">
                    <span className="av">А</span>
                    <div className="who">
                        <b>Админ</b>
                        <span>Үйл ажиллагааны бүртгэл · Мастер</span>
                    </div>
                    <button className="out" title="Гарах" onClick={handleLogout}>
                        <Icon name="logout" />
                    </button>
                </div>
            </div>
        </aside>
    );
};
