import React from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { TourFAQEditor } from '../components/admin/TourFAQEditor';

/**
 * Standalone page that hosts only the Tour Common FAQ editor. Kept so old
 * bookmarks of /admin/tour-faqs continue to work — the primary entry point
 * now lives as a tab inside /admin/faq.
 */
export const AdminTourFAQManage: React.FC = () => {
    return (
        <AdminLayout
            activePage="faq"
            title="Аяллын нийтлэг FAQ"
            description="Бүх бүтээгдэхүүний дэлгэрэнгүй хуудасны доод хэсэгт нийтлэг харагдана. «FAQ удирдлага» → «Аяллын нийтлэг FAQ» табаас мөн адил засварлах боломжтой."
        >
            <div className="card route-anim">
                <div className="card-pad">
                    <TourFAQEditor />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTourFAQManage;
