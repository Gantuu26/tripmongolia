// Migrated to API
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { DEFAULT_CATEGORIES, DEFAULT_MAGAZINE_CATEGORIES, type Category } from '../types/category';

export const AdminCategoryManage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const data = await api.categories.list();

            if (Array.isArray(data) && data.length > 0) {
                const productCats = data.filter((c: any) => c.type === 'product' || !c.type);
                setCategories(productCats.map((c: any) => ({
                    id: c.id,
                    icon: c.icon,
                    name: c.name,
                    description: c.description,
                    isActive: c.is_active,
                    order: c.order ?? c.sort_order ?? 0,
                    type: c.type || 'product',
                    landing_hero_image: c.landing_hero_image,
                    landing_hero_images: Array.isArray(c.landing_hero_images) ? c.landing_hero_images : [],
                    landing_hero_tagline: c.landing_hero_tagline,
                    landing_hero_title: c.landing_hero_title,
                    landing_hero_subtitle: c.landing_hero_subtitle,
                    landing_accent_color: c.landing_accent_color,
                    landing_highlights: Array.isArray(c.landing_highlights) ? c.landing_highlights : [],
                    landing_product_grid_title: c.landing_product_grid_title,
                })));
            } else {
                // Seed default categories if empty
                await seedDefaultCategories();
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const seedDefaultCategories = async () => {
        const inserts = DEFAULT_CATEGORIES.map((c, idx) => ({
            id: c.id,
            icon: c.icon,
            name: c.name,
            description: c.description,
            is_active: c.isActive,
            order: idx,
            type: 'product'
        }));
        for (const cat of inserts) {
            await api.categories.create(cat);
        }

        // Also seed magazine categories
        const magInserts = DEFAULT_MAGAZINE_CATEGORIES.map((c, idx) => ({
            id: c.id,
            icon: c.icon,
            name: c.name,
            description: c.description,
            is_active: c.isActive,
            order: idx,
            type: 'magazine'
        }));
        for (const cat of magInserts) {
            await api.categories.create(cat);
        }

        fetchCategories();
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

    // Toggle active status
    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.categories.update(id, { is_active: !currentStatus });
            fetchCategories();
        } catch (error) {
            alert('Шинэчлэх амжилтгүй: ' + error);
        }
    };

    // Delete category
    const deleteCategory = async (id: string) => {
        if (id === 'all') {
            alert('"전체" ангиллыг устгах боломжгүй.');
            return;
        }
        if (confirm('Энэ ангиллыг үнэхээр устгах уу?')) {
            try {
                await api.categories.delete(id);
                fetchCategories();
            } catch (error) {
                alert('Устгах амжилтгүй: ' + error);
            }
        }
    };

    // Move category up/down
    const moveCategory = async (index: number, direction: 'up' | 'down') => {
        if (!sortedCategories) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sortedCategories.length) return;

        const currentCat = sortedCategories[index];
        const targetCat = sortedCategories[newIndex];

        // Swap orders
        await api.categories.update(currentCat.id, { order: targetCat.order });
        await api.categories.update(targetCat.id, { order: currentCat.order });
        fetchCategories();
    };

    const handleSaveCategory = async (category: Category) => {
        try {
            const heroImages = Array.isArray(category.landing_hero_images)
                ? category.landing_hero_images.filter(Boolean)
                : [];
            // Keep legacy landing_hero_image in sync with the first slide for backward compat
            const primaryHero = heroImages[0] || category.landing_hero_image || null;
            const landingPayload = {
                landing_hero_image: primaryHero,
                landing_hero_images: heroImages,
                landing_hero_tagline: category.landing_hero_tagline || null,
                landing_hero_title: category.landing_hero_title || null,
                landing_hero_subtitle: category.landing_hero_subtitle || null,
                landing_accent_color: category.landing_accent_color || null,
                landing_highlights: category.landing_highlights || [],
                landing_product_grid_title: category.landing_product_grid_title || null,
            };
            if (selectedCategory) {
                // If the admin changed the URL slug (id), rename on the server first so the
                // subsequent update hits the new row.
                let effectiveId = category.id;
                if (selectedCategory.id !== category.id) {
                    const newId = (category.id || '').trim();
                    if (!newId || !/^[a-z0-9][a-z0-9-]*$/.test(newId)) {
                        alert('URL слаг нь латин жижиг үсэг/тоо/зураасаар бичигдэж, үсэг эсвэл тоогоор эхлэх ёстой.');
                        return;
                    }
                    if (!confirm(`URL слагийг "${selectedCategory.id}" → "${newId}" болгож өөрчлөх үү?\nОдоо байгаа /category/${selectedCategory.id} холбоос цаашид нээгдэхгүй болно.`)) {
                        return;
                    }
                    await api.categories.rename(selectedCategory.id, newId);
                    effectiveId = newId;
                }

                // Update
                await api.categories.update(effectiveId, {
                    icon: category.icon,
                    name: category.name,
                    description: category.description,
                    is_active: category.isActive,
                    ...landingPayload,
                });
            } else {
                // Add New
                const newCategory = {
                    id: `cat-${Date.now()}`,
                    icon: category.icon,
                    name: category.name,
                    description: category.description,
                    is_active: category.isActive ?? true,
                    order: sortedCategories.length,
                    type: 'product',
                    ...landingPayload,
                };
                await api.categories.create(newCategory);
            }
            setIsModalOpen(false);
            setSelectedCategory(null);
            fetchCategories();
        } catch (error: any) {
            console.error(error);
            alert('Хадгалах үед алдаа гарлаа.');
        }
    };

    return (
        <AdminLayout
            activePage="categories"
            title="Ангилал удирдах"
            actions={
                <button
                    onClick={() => {
                        setSelectedCategory(null);
                        setIsModalOpen(true);
                    }}
                    className="btn btn-ink"
                >
                    <Icon name="add" />
                    Ангилал нэмэх
                </button>
            }
        >
            <div className="route-anim">
                <div className="toolbar">
                    <div className="cell-muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
                        Эрэмбийн товчоор харагдах дарааллыг өөрчилж болно.
                    </div>
                </div>

                <div className="card">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>Эрэмбэ</th>
                                    <th style={{ width: 80 }}>Дүрс</th>
                                    <th>Нэр</th>
                                    <th>Тайлбар</th>
                                    <th className="c">Харуулах</th>
                                    <th className="r">Удирдах</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty">
                                                <Icon name="category" />
                                                <p>Бүртгэгдсэн ангилал байхгүй байна.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedCategories.map((category, index) => (
                                        <tr key={category.id}>
                                            <td>
                                                <span className="row" style={{ gap: 6 }}>
                                                    <span className="edit-move">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCategory(index, 'up')}
                                                            disabled={index === 0}
                                                        >
                                                            <Icon name="arrow_upward" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCategory(index, 'down')}
                                                            disabled={index === sortedCategories.length - 1}
                                                        >
                                                            <Icon name="arrow_downward" />
                                                        </button>
                                                    </span>
                                                    <b className="cell-mono">{index + 1}</b>
                                                </span>
                                            </td>
                                            <td>
                                                {category.icon && (category.icon.startsWith('data:') || category.icon.startsWith('http') || category.icon.startsWith('/')) ? (
                                                    <img
                                                        src={category.icon}
                                                        alt={category.name}
                                                        className="thumb sq"
                                                    />
                                                ) : (
                                                    <span className="thumb sq" style={{ display: 'grid', placeItems: 'center', fontSize: 22 }}>
                                                        <Icon name={category.icon || 'category'} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="cell-strong">{category.name}</td>
                                            <td className="cell-muted">{category.description}</td>
                                            <td className="c">
                                                <button
                                                    type="button"
                                                    className={`switch${category.isActive ? ' on' : ''}`}
                                                    onClick={() => toggleActive(category.id, category.isActive)}
                                                >
                                                    <span className="knob" />
                                                </button>
                                            </td>
                                            <td className="r">
                                                <span className="row-actions">
                                                    <button
                                                        type="button"
                                                        className="act-btn"
                                                        title="Засах"
                                                        onClick={() => {
                                                            setSelectedCategory(category);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Icon name="edit" />
                                                    </button>
                                                    {category.id !== 'all' && (
                                                        <button
                                                            type="button"
                                                            className="act-btn danger"
                                                            title="Устгах"
                                                            onClick={() => deleteCategory(category.id)}
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <CategoryModal
                    category={selectedCategory}
                    type="product"
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedCategory(null);
                    }}
                    onSave={handleSaveCategory}
                />
            )}
        </AdminLayout>
    );
};

// Category Modal Component
interface CategoryModalProps {
    category: Category | null;
    type: 'product' | 'magazine';
    onClose: () => void;
    onSave: (category: Category) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, type, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Category>>(
        category || {
            name: '',
            icon: 'category',
            description: '',
            isActive: true,
            order: 0,
            type: type
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.icon) {
            alert('Заавал бөглөх талбарыг бөглөнө үү.');
            return;
        }
        // Ensure type matches the current tab if creating new
        if (!category) {
            formData.type = type;
        }
        onSave(formData as Category);
        onClose();
    };

    return (
        <div className="picker-scrim" onClick={onClose}>
            <div
                className="picker"
                style={{ width: 680, maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Header */}
                    <div className="card-head">
                        <h2>
                            {category ? 'Ангилал засах' : `${type === 'product' ? 'Бүтээгдэхүүн' : 'Сэтгүүл'} ангилал нэмэх`}
                        </h2>
                        <div className="spacer" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="act-btn"
                            title="Хаах"
                        >
                            <Icon name="close" />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ overflowY: 'auto', padding: '20px 22px' }}>
                        {/* Name */}
                        <div className="field">
                            <label>Ангиллын нэр *</label>
                            <input
                                type="text"
                                className="inp"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={type === 'product' ? "жишээ нь: Баруун Монгол" : "жишээ нь: Монголын үндсэн мэдээлэл"}
                            />
                        </div>

                        {/* URL Slug (editable only in edit mode, and not for the "all" category) */}
                        {category && category.id !== 'all' && (
                            <div className="field">
                                <label>URL слаг (ID)</label>
                                <div className="row" style={{ gap: 8 }}>
                                    <span className="cell-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>/category/</span>
                                    <input
                                        type="text"
                                        className="inp"
                                        style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                                        value={formData.id || ''}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        placeholder="жишээ нь: gobi"
                                    />
                                </div>
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 6 }}>
                                    Зөвхөн латин жижиг үсэг/тоо/зураас зөвшөөрнө. Өөрчилбөл одоо байгаа URL цаашид нээгдэхгүй тул болгоомжтой байна уу.
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="field">
                            <label>Тайлбар</label>
                            <input
                                type="text"
                                className="inp"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={type === 'product' ? "жишээ нь: Алтайн нурууны треккинг" : "жишээ нь: Мөнгө солих, сим, цаг агаар гэх мэт"}
                            />
                        </div>

                        {/* Icon */}
                        <div className="field">
                            <label>Дүрс зураг *</label>

                            {/* Image Preview */}
                            {formData.icon && (formData.icon.startsWith('data:') || formData.icon.startsWith('http') || formData.icon.startsWith('/')) && (
                                <div style={{ marginBottom: 12 }}>
                                    <img
                                        src={formData.icon}
                                        alt="Category icon"
                                        className="thumb sq"
                                        style={{ width: 80, height: 80 }}
                                    />
                                </div>
                            )}

                            {/* File Upload */}
                            <input
                                type="file"
                                accept="image/*"
                                className="inp"
                                style={{ paddingTop: 9 }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            const url = await uploadImage(file, 'categories');
                                            setFormData({ ...formData, icon: url });
                                        } catch (error) {
                                            console.error('Category image upload failed:', error);
                                            alert('Зураг байршуулахад алдаа гарлаа');
                                        }
                                    }
                                }}
                            />
                            <p className="cell-muted" style={{ fontSize: 12, marginTop: 8 }}>
                                Зөвлөмж: 1:1 харьцаатай зураг (хэрэглэгчийн дэлгэцэд дугуй хэлбэрээр харагдана)
                            </p>
                        </div>

                        {/* Active Status */}
                        <div className="toggle-row" style={{ marginBottom: 18 }}>
                            <button
                                type="button"
                                className={`switch${formData.isActive ? ' on' : ''}`}
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            >
                                <span className="knob" />
                            </button>
                            <span className="cell-strong" style={{ fontSize: 13.5 }}>Идэвхжүүлэх</span>
                        </div>

                        {/* Landing page editor — only for product categories */}
                        {type === 'product' && (
                            <LandingPageEditor
                                formData={formData}
                                setFormData={setFormData}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="drawer-foot">
                        <div className="spacer" style={{ flex: 1 }} />
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            Цуцлах
                        </button>
                        <button
                            type="submit"
                            className="btn btn-ink"
                        >
                            {category ? 'Засаж дуусгах' : 'Нэмж дуусгах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Landing Page Editor ────────────────────────────────────────────
interface LandingEditorProps {
    formData: Partial<Category>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Category>>>;
}

const LandingPageEditor: React.FC<LandingEditorProps> = ({ formData, setFormData }) => {
    const [expanded, setExpanded] = useState(false);
    const highlights = formData.landing_highlights || [];

    const updateHighlights = (next: any[]) => setFormData({ ...formData, landing_highlights: next });

    const addSection = () => {
        updateHighlights([...highlights, { label: `하이라이트 ${highlights.length + 1}`, title: '', subtitle: '', cards: [] }]);
    };
    const updateSection = (idx: number, patch: any) => {
        const next = [...highlights];
        next[idx] = { ...next[idx], ...patch };
        updateHighlights(next);
    };
    const removeSection = (idx: number) => {
        updateHighlights(highlights.filter((_, i) => i !== idx));
    };
    const addCard = (sectionIdx: number) => {
        const next = [...highlights];
        next[sectionIdx] = { ...next[sectionIdx], cards: [...(next[sectionIdx].cards || []), { image: '', tags: [], title: '', description: '' }] };
        updateHighlights(next);
    };
    const updateCard = (sectionIdx: number, cardIdx: number, patch: any) => {
        const next = [...highlights];
        const cards = [...next[sectionIdx].cards];
        cards[cardIdx] = { ...cards[cardIdx], ...patch };
        next[sectionIdx] = { ...next[sectionIdx], cards };
        updateHighlights(next);
    };
    const removeCard = (sectionIdx: number, cardIdx: number) => {
        const next = [...highlights];
        next[sectionIdx] = { ...next[sectionIdx], cards: next[sectionIdx].cards.filter((_: any, i: number) => i !== cardIdx) };
        updateHighlights(next);
    };

    const uploadImageTo = async (file: File, cb: (url: string) => void) => {
        try {
            const url = await uploadImage(file, 'categories');
            cb(url);
        } catch (e) { alert('Зураг байршуулахад алдаа гарлаа'); }
    };

    return (
        <div className="edit-sec" style={{ padding: 0 }}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="edit-sec-head"
                style={{ width: '100%', padding: '14px 16px', margin: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            >
                <Icon name="web" />
                <h4 style={{ fontSize: 13.5 }}>Лэндинг хуудас засах (/category/{formData.id || '...'})</h4>
                <span className="spacer" style={{ flex: 1 }} />
                <Icon name="expand_more" className={expanded ? 'rotate' : ''} style={expanded ? { transform: 'rotate(180deg)' } : undefined} />
            </button>

            {expanded && (
                <div style={{ padding: 16, borderTop: '1px solid var(--border-default)' }}>
                    {/* Hero */}
                    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                        <p className="sec-label">Үндсэн баннер (Hero)</p>

                        <HeroImagesEditor
                            images={(() => {
                                const imgs = Array.isArray(formData.landing_hero_images) ? formData.landing_hero_images : [];
                                // Migrate legacy single image into the array if array is empty
                                if (imgs.length === 0 && formData.landing_hero_image) return [formData.landing_hero_image];
                                return imgs;
                            })()}
                            onChange={(next) => setFormData({
                                ...formData,
                                landing_hero_images: next,
                                landing_hero_image: next[0] || '',
                            })}
                            uploadImageTo={uploadImageTo}
                        />

                        <div className="field-row" style={{ marginTop: 12 }}>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Дэд гарчиг (tagline)</label>
                                <input
                                    type="text"
                                    className="inp"
                                    value={formData.landing_hero_tagline || ''}
                                    onChange={(e) => setFormData({ ...formData, landing_hero_tagline: e.target.value })}
                                    placeholder="жишээ нь: Тэнгэр дүүрэн одод таныг хүлээж байна"
                                />
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Онцлох өнгө (accent)</label>
                                <input
                                    type="color"
                                    className="inp"
                                    style={{ padding: 4 }}
                                    value={formData.landing_accent_color || '#0f766e'}
                                    onChange={(e) => setFormData({ ...formData, landing_accent_color: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                            <label>Үндсэн гарчиг</label>
                            <input
                                type="text"
                                className="inp"
                                value={formData.landing_hero_title || ''}
                                onChange={(e) => setFormData({ ...formData, landing_hero_title: e.target.value })}
                                placeholder="жишээ нь: Говь цөлийн аялал"
                            />
                        </div>

                        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                            <label>Дэд гарчиг (тайлбар)</label>
                            <textarea
                                className="inp"
                                value={formData.landing_hero_subtitle || ''}
                                onChange={(e) => setFormData({ ...formData, landing_hero_subtitle: e.target.value })}
                                rows={2}
                                placeholder="жишээ нь: Сүүн зам тод харагдах тэнгэр, нар жаргах үеийн манхан..."
                            />
                        </div>

                        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                            <label>Бүтээгдэхүүний хэсгийн гарчиг</label>
                            <input
                                type="text"
                                className="inp"
                                value={formData.landing_product_grid_title || ''}
                                onChange={(e) => setFormData({ ...formData, landing_product_grid_title: e.target.value })}
                                placeholder="жишээ нь: Говь цөлийн алдартай аялал"
                            />
                        </div>
                    </div>

                    {/* Highlights */}
                    <div>
                        <div className="row" style={{ marginBottom: 12 }}>
                            <p className="sec-label" style={{ margin: 0 }}>Онцлох хэсэг ({highlights.length})</p>
                            <span className="spacer" style={{ flex: 1 }} />
                            <button type="button" onClick={addSection} className="btn btn-ghost btn-sm">
                                <Icon name="add" />Хэсэг нэмэх
                            </button>
                        </div>

                        <div className="stack" style={{ gap: 12 }}>
                            {highlights.map((section: any, sIdx: number) => (
                                <div key={sIdx} className="edit-sec">
                                    <div className="row" style={{ marginBottom: 8 }}>
                                        <span className="cell-mono" style={{ fontSize: 11 }}>Хэсэг {sIdx + 1}</span>
                                        <span className="spacer" style={{ flex: 1 }} />
                                        <button type="button" onClick={() => removeSection(sIdx)} className="act-btn danger" title="Устгах">
                                            <Icon name="delete" />
                                        </button>
                                    </div>
                                    <div className="field-row">
                                        <input
                                            type="text"
                                            className="inp"
                                            value={section.label || ''}
                                            onChange={(e) => updateSection(sIdx, { label: e.target.value })}
                                            placeholder="Тэмдэглэгээний шошго (жишээ нь: Онцлох 1)"
                                        />
                                        <input
                                            type="text"
                                            className="inp"
                                            value={section.title || ''}
                                            onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                                            placeholder="Хэсгийн гарчиг"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        className="inp"
                                        style={{ marginTop: 8 }}
                                        value={section.subtitle || ''}
                                        onChange={(e) => updateSection(sIdx, { subtitle: e.target.value })}
                                        placeholder="Хэсгийн дэд гарчиг"
                                    />

                                    {/* Cards */}
                                    <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                                        {(section.cards || []).map((card: any, cIdx: number) => (
                                            <div key={cIdx} className="card card-pad" style={{ padding: 10 }}>
                                                <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                                                    <div className="thumb sq" style={{ overflow: 'hidden', display: 'grid', placeItems: 'center', color: 'var(--mrt-gray-400)' }}>
                                                        {card.image ? (
                                                            <img src={card.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Icon name="image" />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="row" style={{ gap: 6 }}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                style={{ fontSize: 11, width: 112 }}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) uploadImageTo(file, (url) => updateCard(sIdx, cIdx, { image: url }));
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
                                                                className="inp"
                                                                style={{ flex: 1, height: 34, fontSize: 12 }}
                                                                value={(card.tags || []).join(', ')}
                                                                onChange={(e) => updateCard(sIdx, cIdx, { tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                                placeholder="Таг (таслалаар тусгаарлана)"
                                                            />
                                                            <button type="button" onClick={() => removeCard(sIdx, cIdx)} className="act-btn danger" title="Устгах">
                                                                <Icon name="close" />
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="inp"
                                                            style={{ marginTop: 6, height: 34, fontSize: 12 }}
                                                            value={card.title || ''}
                                                            onChange={(e) => updateCard(sIdx, cIdx, { title: e.target.value })}
                                                            placeholder="Картын гарчиг"
                                                        />
                                                        <input
                                                            type="text"
                                                            className="inp"
                                                            style={{ marginTop: 6, height: 34, fontSize: 12 }}
                                                            value={card.description || ''}
                                                            onChange={(e) => updateCard(sIdx, cIdx, { description: e.target.value })}
                                                            placeholder="Картын тайлбар"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addCard(sIdx)} className="add-line">
                                            <Icon name="add" /> Карт нэмэх
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {highlights.length === 0 && (
                                <div className="empty" style={{ padding: '32px 20px' }}>
                                    <p>Дээрх "Хэсэг нэмэх" товчоор онцлох хэсэг үүсгэнэ үү</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Hero Images (Slider) Editor ───────────────────────────────────
interface HeroImagesEditorProps {
    images: string[];
    onChange: (next: string[]) => void;
    uploadImageTo: (file: File, cb: (url: string) => void) => void;
}

const HeroImagesEditor: React.FC<HeroImagesEditorProps> = ({ images, onChange, uploadImageTo }) => {
    const handleFiles = async (files: File[]) => {
        // Upload sequentially so we can keep a reliable running list
        let current = [...images];
        for (const file of files) {
            await new Promise<void>((resolve) => {
                uploadImageTo(file, (url) => {
                    current = [...current, url];
                    onChange(current);
                    resolve();
                });
            });
        }
    };
    const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx));
    const moveImage = (idx: number, dir: 'left' | 'right') => {
        const newIdx = dir === 'left' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= images.length) return;
        const next = [...images];
        [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
        onChange(next);
    };

    return (
        <div>
            <div className="row" style={{ marginBottom: 6 }}>
                <label className="cell-strong" style={{ fontSize: 12 }}>
                    Дэвсгэр зургийн слайд ({images.length})
                </label>
                <span className="spacer" style={{ flex: 1 }} />
                <span className="cell-muted" style={{ fontSize: 11 }}>Эхний зураг нь төлөөлөх зураг болж ашиглагдана</span>
            </div>

            {images.length > 0 && (
                <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    {images.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                            <img src={url} alt={`hero-${idx + 1}`} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', top: 4, left: 4, padding: '1px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                {idx + 1}
                            </div>
                            <div className="row" style={{ position: 'absolute', top: 4, right: 4, gap: 4 }}>
                                <button
                                    type="button"
                                    onClick={() => moveImage(idx, 'left')}
                                    disabled={idx === 0}
                                    style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                    aria-label="move left"
                                >
                                    <Icon name="chevron_left" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveImage(idx, 'right')}
                                    disabled={idx === images.length - 1}
                                    style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                    aria-label="move right"
                                >
                                    <Icon name="chevron_right" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    style={{ padding: 4, borderRadius: 6, border: 'none', background: 'rgba(255,79,79,0.9)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                    aria-label="delete"
                                >
                                    <Icon name="close" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <label className="add-line" style={{ cursor: 'pointer' }}>
                <Icon name="add_photo_alternate" />
                Зураг нэмэх
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleFiles(files);
                        e.target.value = '';
                    }}
                />
            </label>
        </div>
    );
};
