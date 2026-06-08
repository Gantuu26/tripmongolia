import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { TourFAQEditor } from '../components/admin/TourFAQEditor';
import { api } from '../lib/api';

interface FAQ {
    id: string;
    category: string;
    question: string;
    answer: string;
    isActive: boolean;
    viewCount: number;
    order: number;
}

interface FAQCategory {
    id: string;
    name: string;
    isActive: boolean;
    order: number;
}

export const AdminFAQManage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faq' | 'category' | 'tour-common'>('faq');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
    const [selectedCategory, setSelectedCategoryEdit] = useState<FAQCategory | null>(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [categories, setCategories] = useState<FAQCategory[]>([]);

    // FAQ Form
    const [faqForm, setFaqForm] = useState({
        category: '',
        question: '',
        answer: '',
        isActive: true
    });

    // Category Form
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        isActive: true
    });

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const faqData = await api.faqs.list();
                const catData = await api.faqCategories.list();
                if (Array.isArray(faqData)) setFaqs(faqData.map((f: any) => ({ ...f, isActive: f.is_active, viewCount: f.view_count || 0 })));
                if (Array.isArray(catData)) setCategories(catData.map((c: any) => ({ ...c, isActive: c.is_active })));
            } catch (e) { console.error('Failed to fetch FAQ data', e); }
        };
        fetchData();
    }, []);

    // Filter FAQs
    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = filterCategory === 'all' || faq.category === filterCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Add/Edit FAQ
    const handleSaveFAQ = async () => {
        if (!faqForm.question || !faqForm.answer || !faqForm.category) {
            alert('Бүх талбарыг бөглөнө үү.');
            return;
        }

        const now = new Date().toISOString();

        if (selectedFAQ) {
            const result = await api.faqs.update(selectedFAQ.id, {
                category: faqForm.category,
                question: faqForm.question,
                answer: faqForm.answer,
                is_active: faqForm.isActive,
                updated_at: now
            }) as any;

            if (result?.error) {
                alert('FAQ засах амжилтгүй боллоо: ' + (result.error.message || result.error));
                return;
            }

            setFaqs(faqs.map(f => f.id === selectedFAQ.id ? { ...f, ...faqForm, updatedAt: now } : f));
        } else {
            const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) : 0;
            const newFaq = {
                id: `faq-${Date.now()}`,
                category: faqForm.category,
                question: faqForm.question,
                answer: faqForm.answer,
                is_active: faqForm.isActive,
                view_count: 0,
                order: maxOrder + 1,
                created_at: now,
                updated_at: now
            };
            const result = await api.faqs.create(newFaq) as any;

            if (result?.error) {
                alert('FAQ хадгалах амжилтгүй боллоо: ' + (result.error.message || result.error));
                return;
            }

            setFaqs([...faqs, { ...newFaq, isActive: newFaq.is_active, viewCount: 0 }]);
        }

        setIsModalOpen(false);
        setSelectedFAQ(null);
        setFaqForm({ category: '', question: '', answer: '', isActive: true });
    };

    // Delete FAQ
    const handleDeleteFAQ = async (id: string) => {
        if (confirm('Энэ FAQ-г устгах уу?')) {
            await api.faqs.delete(id);
            setFaqs(faqs.filter(f => f.id !== id));
        }
    };

    // Toggle FAQ Active
    const toggleFAQActive = async (faq: FAQ) => {
        await api.faqs.update(faq.id, { is_active: !faq.isActive });
        setFaqs(faqs.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
    };

    // Move FAQ Order
    const moveFAQOrder = async (faq: FAQ, direction: 'up' | 'down') => {
        const sorted = [...faqs].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(f => f.id === faq.id);

        if (direction === 'up' && index > 0) {
            const prev = sorted[index - 1];
            await api.faqs.update(faq.id, { order: prev.order });
            await api.faqs.update(prev.id, { order: faq.order });
            setFaqs(faqs.map(f => f.id === faq.id ? { ...f, order: prev.order } : f.id === prev.id ? { ...f, order: faq.order } : f));
        } else if (direction === 'down' && index < sorted.length - 1) {
            const next = sorted[index + 1];
            await api.faqs.update(faq.id, { order: next.order });
            await api.faqs.update(next.id, { order: faq.order });
            setFaqs(faqs.map(f => f.id === faq.id ? { ...f, order: next.order } : f.id === next.id ? { ...f, order: faq.order } : f));
        }
    };

    // Add/Edit Category
    const handleSaveCategory = async () => {
        if (!categoryForm.name) {
            alert('Ангиллын нэрийг оруулна уу.');
            return;
        }

        if (selectedCategory) {
            // Update Category
            const result = await api.faqCategories.update(selectedCategory.id, {
                name: categoryForm.name,
                is_active: categoryForm.isActive
            }) as any;

            if (result?.error) {
                alert('Ангилал засах амжилтгүй боллоо: ' + (result.error.message || result.error));
                return;
            }

            // If name changed, update all associated FAQs
            if (selectedCategory.name !== categoryForm.name) {
                // Update FAQs that reference the old category name
                const affectedFaqs = faqs.filter(f => f.category === selectedCategory.name);
                for (const faq of affectedFaqs) {
                    await api.faqs.update(faq.id, { category: categoryForm.name });
                }
                setFaqs(faqs.map(f => f.category === selectedCategory.name ? { ...f, category: categoryForm.name } : f));
            }

            setCategories(categories.map(c => c.id === selectedCategory.id ? { ...c, ...categoryForm } : c));
        } else {
            const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) : 0;
            const newCat = {
                id: `faq-cat-${Date.now()}`,
                name: categoryForm.name,
                is_active: categoryForm.isActive,
                order: maxOrder + 1
            };
            const result = await api.faqCategories.create(newCat) as any;

            if (result?.error) {
                alert('Ангилал нэмэх амжилтгүй боллоо: ' + (result.error.message || result.error));
                return;
            }

            setCategories([...categories, { ...newCat, isActive: newCat.is_active }]);
        }

        setIsCategoryModalOpen(false);
        setSelectedCategoryEdit(null);
        setCategoryForm({ name: '', isActive: true });
    };

    // Delete Category
    const handleDeleteCategory = async (id: string) => {
        const faqsInCategory = faqs.filter(f => f.category === categories.find(c => c.id === id)?.name);
        if (faqsInCategory.length > 0) {
            alert('Энэ ангилалд FAQ байгаа тул устгах боломжгүй.');
            return;
        }
        if (confirm('Энэ ангиллыг устгах уу?')) {
            await api.faqCategories.delete(id);
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    // Move Category Order
    const moveCategoryOrder = async (cat: FAQCategory, direction: 'up' | 'down') => {
        const sorted = [...categories].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(c => c.id === cat.id);

        if (direction === 'up' && index > 0) {
            const prev = sorted[index - 1];
            await api.faqCategories.update(cat.id, { order: prev.order });
            await api.faqCategories.update(prev.id, { order: cat.order });
            setCategories(categories.map(c => c.id === cat.id ? { ...c, order: prev.order } : c.id === prev.id ? { ...c, order: cat.order } : c));
        } else if (direction === 'down' && index < sorted.length - 1) {
            const next = sorted[index + 1];
            await api.faqCategories.update(cat.id, { order: next.order });
            await api.faqCategories.update(next.id, { order: cat.order });
            setCategories(categories.map(c => c.id === cat.id ? { ...c, order: next.order } : c.id === next.id ? { ...c, order: cat.order } : c));
        }
    };

    const headerActions = (
        <>
            {activeTab === 'category' && (
                <button
                    className="btn btn-ink"
                    onClick={() => {
                        setSelectedCategoryEdit(null);
                        setCategoryForm({ name: '', isActive: true });
                        setIsCategoryModalOpen(true);
                    }}
                >
                    <Icon name="add" />
                    Ангилал нэмэх
                </button>
            )}
            {activeTab === 'faq' && (
                <button
                    className="btn btn-ink"
                    onClick={() => {
                        setSelectedFAQ(null);
                        setFaqForm({ category: categories[0]?.name || '', question: '', answer: '', isActive: true });
                        setIsModalOpen(true);
                    }}
                >
                    <Icon name="add" />
                    FAQ нэмэх
                </button>
            )}
        </>
    );

    return (
        <AdminLayout activePage="faq" title="FAQ удирдлага" actions={headerActions}>
            <div className="route-anim">
                {/* Tabs */}
                <div className="toolbar">
                    <div className="seg">
                        <button
                            className={activeTab === 'faq' ? 'active' : ''}
                            onClick={() => setActiveTab('faq')}
                            title="Хэрэглэгчийн төвийн хуудасны (/faq) FAQ"
                        >
                            FAQ жагсаалт
                        </button>
                        <button
                            className={activeTab === 'category' ? 'active' : ''}
                            onClick={() => setActiveTab('category')}
                            title="Хэрэглэгчийн төвийн FAQ-н ангилал"
                        >
                            Ангилал удирдлага
                        </button>
                        <button
                            className={activeTab === 'tour-common' ? 'active' : ''}
                            onClick={() => setActiveTab('tour-common')}
                            title="Бүх бүтээгдэхүүний дэлгэрэнгүй хуудасны доод хэсэгт нийтлэг харагдах FAQ"
                        >
                            Аяллын нийтлэг FAQ
                        </button>
                    </div>
                </div>

                {activeTab === 'tour-common' ? (
                    <TourFAQEditor />
                ) : activeTab === 'faq' ? (
                    <>
                        {/* Filters */}
                        <div className="toolbar">
                            <div className="tb-search">
                                <Icon name="search" />
                                <input
                                    type="text"
                                    placeholder="Асуулт хайх..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="select"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Бүх ангилал</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* FAQ Table */}
                        <div className="card">
                            <div className="tbl-wrap">
                                <table className="tbl">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 90 }}>Дараалал</th>
                                            <th>Ангилал</th>
                                            <th>Асуулт</th>
                                            <th className="c">Үзсэн</th>
                                            <th className="c">Харуулах</th>
                                            <th className="r">Удирдлага</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFaqs.map((faq, index) => (
                                            <tr key={faq.id}>
                                                <td>
                                                    <span className="row" style={{ gap: 6 }}>
                                                        <Icon name="drag_indicator" className="drag-handle" />
                                                        <span className="edit-move">
                                                            <button onClick={() => moveFAQOrder(faq, 'up')} disabled={index === 0} title="Дээш">
                                                                <Icon name="arrow_upward" />
                                                            </button>
                                                            <button onClick={() => moveFAQOrder(faq, 'down')} disabled={index === filteredFaqs.length - 1} title="Доош">
                                                                <Icon name="arrow_downward" />
                                                            </button>
                                                        </span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge b-blue">{faq.category}</span>
                                                </td>
                                                <td className="cell-strong" style={{ maxWidth: 420 }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</div>
                                                </td>
                                                <td className="c cell-mono">{faq.viewCount}</td>
                                                <td className="c">
                                                    <button
                                                        className={`switch${faq.isActive ? ' on' : ''}`}
                                                        onClick={() => toggleFAQActive(faq)}
                                                        title={faq.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                                    >
                                                        <span className="knob" />
                                                    </button>
                                                </td>
                                                <td className="r">
                                                    <span className="row-actions">
                                                        <button
                                                            className="act-btn"
                                                            title="Засах"
                                                            onClick={() => {
                                                                setSelectedFAQ(faq);
                                                                setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer, isActive: faq.isActive });
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <Icon name="edit" />
                                                        </button>
                                                        <button className="act-btn danger" title="Устгах" onClick={() => handleDeleteFAQ(faq.id)}>
                                                            <Icon name="delete" />
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredFaqs.length === 0 && (
                                <div className="empty">
                                    <Icon name="inbox" />
                                    <p>Бүртгэгдсэн FAQ алга байна.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Category Management */
                    <div className="card">
                        <div className="tbl-wrap">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th style={{ width: 90 }}>Дараалал</th>
                                        <th>Ангиллын нэр</th>
                                        <th className="c">FAQ тоо</th>
                                        <th className="c">Харуулах</th>
                                        <th className="r">Удирдлага</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat, index) => (
                                        <tr key={cat.id}>
                                            <td>
                                                <span className="row" style={{ gap: 6 }}>
                                                    <Icon name="drag_indicator" className="drag-handle" />
                                                    <span className="edit-move">
                                                        <button onClick={() => moveCategoryOrder(cat, 'up')} disabled={index === 0} title="Дээш">
                                                            <Icon name="arrow_upward" />
                                                        </button>
                                                        <button onClick={() => moveCategoryOrder(cat, 'down')} disabled={index === categories.length - 1} title="Доош">
                                                            <Icon name="arrow_downward" />
                                                        </button>
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="cell-strong">{cat.name}</td>
                                            <td className="c cell-mono">{faqs.filter(f => f.category === cat.name).length}ш</td>
                                            <td className="c">
                                                <button
                                                    className={`switch${cat.isActive ? ' on' : ''}`}
                                                    title={cat.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                                    onClick={async () => {
                                                        await api.faqCategories.update(cat.id, { is_active: !cat.isActive });
                                                        setCategories(categories.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
                                                    }}
                                                >
                                                    <span className="knob" />
                                                </button>
                                            </td>
                                            <td className="r">
                                                <span className="row-actions">
                                                    <button
                                                        className="act-btn"
                                                        title="Засах"
                                                        onClick={() => {
                                                            setSelectedCategoryEdit(cat);
                                                            setCategoryForm({ name: cat.name, isActive: cat.isActive });
                                                            setIsCategoryModalOpen(true);
                                                        }}
                                                    >
                                                        <Icon name="edit" />
                                                    </button>
                                                    <button className="act-btn danger" title="Устгах" onClick={() => handleDeleteCategory(cat.id)}>
                                                        <Icon name="delete" />
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {categories.length === 0 && (
                            <div className="empty">
                                <Icon name="inbox" />
                                <p>Бүртгэгдсэн ангилал алга байна.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAQ Modal */}
            {isModalOpen && (
                <div className="picker-scrim" onClick={() => setIsModalOpen(false)}>
                    <div className="picker" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
                        <div className="card-head">
                            <h2>{selectedFAQ ? 'FAQ засах' : 'FAQ нэмэх'}</h2>
                            <div className="spacer" />
                            <button className="act-btn" title="Хаах" onClick={() => setIsModalOpen(false)}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
                            <div className="field">
                                <label>Ангилал</label>
                                <select
                                    className="inp"
                                    value={faqForm.category}
                                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                                >
                                    <option value="">Сонгоно уу</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Асуулт</label>
                                <input
                                    className="inp"
                                    type="text"
                                    value={faqForm.question}
                                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                    placeholder="Асуултаа оруулна уу"
                                />
                            </div>
                            <div className="field">
                                <label>Хариулт</label>
                                <textarea
                                    className="inp"
                                    value={faqForm.answer}
                                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                    placeholder="Хариултаа оруулна уу"
                                    rows={5}
                                />
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Харагдах төлөв</label>
                                <div className="row" style={{ gap: 10 }}>
                                    <button
                                        type="button"
                                        className={`switch${faqForm.isActive ? ' on' : ''}`}
                                        onClick={() => setFaqForm({ ...faqForm, isActive: !faqForm.isActive })}
                                    >
                                        <span className="knob" />
                                    </button>
                                    <span className="cell-muted">{faqForm.isActive ? 'Идэвхжүүлсэн' : 'Идэвхгүй болгосон'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="drawer-foot">
                            <div className="spacer" style={{ flex: 1 }} />
                            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Цуцлах</button>
                            <button className="btn btn-ink" onClick={handleSaveFAQ}>Хадгалах</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="picker-scrim" onClick={() => setIsCategoryModalOpen(false)}>
                    <div className="picker" onClick={(e) => e.stopPropagation()}>
                        <div className="card-head">
                            <h2>{selectedCategory ? 'Ангилал засах' : 'Ангилал нэмэх'}</h2>
                            <div className="spacer" />
                            <button className="act-btn" title="Хаах" onClick={() => setIsCategoryModalOpen(false)}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
                            <div className="field">
                                <label>Ангиллын нэр</label>
                                <input
                                    className="inp"
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder="Жишээ нь: Аяллын бэлтгэл"
                                />
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Харагдах төлөв</label>
                                <div className="row" style={{ gap: 10 }}>
                                    <button
                                        type="button"
                                        className={`switch${categoryForm.isActive ? ' on' : ''}`}
                                        onClick={() => setCategoryForm({ ...categoryForm, isActive: !categoryForm.isActive })}
                                    >
                                        <span className="knob" />
                                    </button>
                                    <span className="cell-muted">{categoryForm.isActive ? 'Идэвхжүүлсэн' : 'Идэвхгүй болгосон'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="drawer-foot">
                            <div className="spacer" style={{ flex: 1 }} />
                            <button className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(false)}>Цуцлах</button>
                            <button className="btn btn-ink" onClick={handleSaveCategory}>Хадгалах</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
