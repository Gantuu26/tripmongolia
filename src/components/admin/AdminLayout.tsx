import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Icon } from './console/Icon';
import '../../styles/admin-console.css';

interface AdminLayoutProps {
    activePage: string;
    title: string;
    description?: string;
    /** small uppercase label above the title; defaults from the page section */
    eyebrow?: string;
    /** show the decorative header search pill (default true) */
    showSearch?: boolean;
    /** kept for backward-compat with existing call sites; redesign is light-only */
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

const EYEBROW: Record<string, string> = {
    dashboard: 'Админ консол',
    reservations: 'Үйл ажиллагаа', calendar: 'Үйл ажиллагаа', guides: 'Үйл ажиллагаа',
    products: 'Каталог',
    magazines: 'Контент', templates: 'Контент', reviews: 'Контент', faq: 'Контент',
    banners: 'Сайтын тохиргоо', categories: 'Сайтын тохиргоо', hotels: 'Сайтын тохиргоо',
    'tourist-spots': 'Сайтын тохиргоо', accommodations: 'Сайтын тохиргоо', 'guide-intro': 'Сайтын тохиргоо',
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    activePage, title, description, eyebrow, showSearch = true, actions, children,
}) => {
    const eb = eyebrow || EYEBROW[activePage] || 'Админ консол';
    return (
        <div className="app">
            <AdminSidebar activePage={activePage} />
            <div className="main">
                <header className="header">
                    <div className="header-in">
                        <div style={{ minWidth: 0 }}>
                            <div className="eyebrow"><span className="dot" />{eb}</div>
                            <div className="page-title">{title}</div>
                            {description && (
                                <div className="cell-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{description}</div>
                            )}
                        </div>
                        <div className="header-spacer" />
                        <div className="header-tools">
                            {showSearch && (
                                <label className="search-pill">
                                    <Icon name="search" />
                                    <input placeholder="Захиалгын дугаар, харилцагчийн нэр, бүтээгдэхүүн хайх" />
                                </label>
                            )}
                            <button className="icon-btn" title="Мэдэгдэл" type="button">
                                <Icon name="notifications" /><span className="badge-dot" />
                            </button>
                            {actions}
                        </div>
                    </div>
                </header>

                <div className="content"><div className="content-in">{children}</div></div>
            </div>
        </div>
    );
};
