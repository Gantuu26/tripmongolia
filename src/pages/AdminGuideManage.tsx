import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';

interface Guide {
    id: string;
    name: string;
    image: string;
    introduction: string;
    phone: string;
    languages: string[];
    specialties: string[];
    status: string;
    experienceYears: number;
    createdAt: string;
}

export const AdminGuideManage: React.FC = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState<Omit<Guide, 'id' | 'createdAt' | 'status'>>({
        name: '',
        image: '',
        introduction: '',
        phone: '',
        experienceYears: 0,
        languages: [],
        specialties: []
    });

    const loadGuides = async () => {
        try {
            const data = await api.tourGuides.list();
            if (Array.isArray(data)) {
                setGuides(data.map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    image: g.image || '',
                    introduction: g.bio || g.introduction || '',
                    phone: g.phone || '',
                    experienceYears: g.experience_years || 0,
                    languages: typeof g.languages === 'string' ? JSON.parse(g.languages || '[]') : (g.languages || []),
                    specialties: typeof g.specialties === 'string' ? JSON.parse(g.specialties || '[]') : (g.specialties || []),
                    status: g.status || 'active',
                    createdAt: g.created_at || g.createdAt
                })));
            }
        } catch (error) {
            console.error('Error fetching guides:', error);
        }
    };

    useEffect(() => { loadGuides(); }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const url = await uploadImage(file, 'guides');
                setFormData({ ...formData, image: url });
            } catch (error) {
                console.error('Guide image upload failed:', error);
                alert('Зураг байршуулахад алдаа гарлаа');
            }
        }
    };

    const handleLanguageToggle = (lang: string) => {
        const updated = formData.languages.includes(lang)
            ? formData.languages.filter(l => l !== lang)
            : [...formData.languages, lang];
        setFormData({ ...formData, languages: updated });
    };

    const handleSpecialtyToggle = (specialty: string) => {
        const updated = formData.specialties.includes(specialty)
            ? formData.specialties.filter(s => s !== specialty)
            : [...formData.specialties, specialty];
        setFormData({ ...formData, specialties: updated });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            alert('Нэр болон утасны дугаар заавал бөглөх шаардлагатай.');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                bio: formData.introduction,
                phone: formData.phone,
                image: formData.image,
                experience_years: formData.experienceYears,
                languages: formData.languages,
                specialties: formData.specialties,
            };

            if (editingGuide) {
                await api.tourGuides.update(editingGuide.id, payload);
            } else {
                await api.tourGuides.create({ ...payload, status: 'active' });
            }

            await loadGuides();
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Guide save error:', error);
            alert('Хадгалахад алдаа гарлаа: ' + error.message);
        }
    };

    const handleApprove = async (guide: Guide) => {
        try {
            await api.tourGuides.update(guide.id, {
                name: guide.name,
                bio: guide.introduction,
                phone: guide.phone,
                image: guide.image,
                experience_years: guide.experienceYears,
                languages: guide.languages,
                specialties: guide.specialties,
                status: 'active',
            });
            await loadGuides();
        } catch (error: any) {
            alert('Зөвшөөрөхөд алдаа гарлаа: ' + error.message);
        }
    };

    const handleEdit = (guide: Guide) => {
        setEditingGuide(guide);
        setFormData({
            name: guide.name,
            image: guide.image,
            introduction: guide.introduction,
            phone: guide.phone,
            experienceYears: guide.experienceYears,
            languages: guide.languages,
            specialties: guide.specialties
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Үнэхээр устгах уу?')) {
            try {
                await api.tourGuides.delete(id);
                await loadGuides();
            } catch (error: any) {
                alert('Устгахад алдаа гарлаа: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            image: '',
            introduction: '',
            phone: '',
            experienceYears: 0,
            languages: [],
            specialties: []
        });
        setEditingGuide(null);
    };

    const filteredGuides = guides.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === 'all' || g.status === statusFilter)
    );

    const pendingCount = guides.filter(g => g.status === 'pending').length;

    const availableLanguages = ['한국어', '영어', '몽골어', '중국어', '일본어'];
    const availableSpecialties = ['고비사막', '홉스골', '테를지', '승마', '문화체험', '사진촬영'];

    return (
        <AdminLayout
            activePage="guides"
            title="Хөтөчийн удирдлага"
            description={pendingCount > 0 ? `Зөвшөөрөл хүлээж буй ${pendingCount}` : undefined}
            actions={
                <button
                    className="btn btn-ink"
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                >
                    <Icon name="person_add" />Хөтөч бүртгэх
                </button>
            }
        >
            <div className="route-anim">
                {/* Toolbar */}
                <div className="toolbar">
                    <label className="tb-search">
                        <Icon name="search" />
                        <input
                            placeholder="Хөтөчийн нэр, бүс нутгаар хайх"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="active">Идэвхтэй</option>
                        <option value="pending">Зөвшөөрөл хүлээж буй</option>
                    </select>
                    <div className="spacer" />
                    <button
                        className="btn btn-ink"
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                    >
                        <Icon name="person_add" />Хөтөч бүртгэх
                    </button>
                </div>

                {/* Guide grid */}
                {filteredGuides.length > 0 ? (
                    <div className="guide-grid">
                        {filteredGuides.map(guide => {
                            const isActive = guide.status === 'active';
                            const statusLabel = guide.status === 'pending' ? 'Зөвшөөрөл хүлээж буй' : 'Идэвхтэй';
                            const langLabel = guide.languages.length > 0
                                ? (guide.languages.length > 1 ? `${guide.languages[0]} +` : guide.languages[0])
                                : '–';
                            return (
                                <div className="guide-card" key={guide.id}>
                                    {guide.image ? (
                                        <img className="gphoto" src={guide.image} alt={guide.name} loading="lazy" />
                                    ) : (
                                        <span
                                            className="gphoto"
                                            style={{ display: 'grid', placeItems: 'center', color: 'var(--mrt-gray-400)' }}
                                        >
                                            <Icon name="person" style={{ fontSize: 30 }} />
                                        </span>
                                    )}
                                    <div className="cell-strong" style={{ fontSize: 15 }}>{guide.name}</div>
                                    <div className="cell-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                                        {guide.phone || 'Утасны дугаар бүртгээгүй'}
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <span className={`badge ${isActive ? 'b-green' : 'b-amber'}`}>{statusLabel}</span>
                                    </div>
                                    <div className="gstat">
                                        <div>
                                            <b>{guide.experienceYears > 0 ? `${guide.experienceYears} жил` : '–'}</b>
                                            <span>Туршлага</span>
                                        </div>
                                        <div>
                                            <b>{guide.specialties.length}</b>
                                            <span>Мэргэшил</span>
                                        </div>
                                        <div>
                                            <b>{langLabel}</b>
                                            <span>Хэл</span>
                                        </div>
                                    </div>
                                    <div className="row" style={{ gap: 6, marginTop: 14, justifyContent: 'center' }}>
                                        {guide.status === 'pending' && (
                                            <button className="btn btn-sm btn-blue" onClick={() => handleApprove(guide)}>
                                                <Icon name="check" />Зөвшөөрөх
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(guide)}>
                                            <Icon name="edit" />Засах
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(guide.id)}>
                                            <Icon name="delete" />Устгах
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty">
                        <Icon name="person_off" />
                        <p>Бүртгэгдсэн хөтөч алга.</p>
                    </div>
                )}
            </div>

            {/* Add / Edit modal */}
            {isModalOpen && (
                <div className="picker-scrim" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div
                        className="picker"
                        style={{ width: 560, maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-head">
                            <h2>{editingGuide ? 'Хөтөч засах' : 'Хөтөч бүртгэх'}</h2>
                            <div className="spacer" />
                            <button
                                className="act-btn"
                                title="Хаах"
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="card-pad" style={{ overflowY: 'auto' }}>
                            {/* Image upload */}
                            <div className="field">
                                <label>Профайл зураг</label>
                                <div className="row" style={{ gap: 16 }}>
                                    {formData.image ? (
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
                                        />
                                    ) : (
                                        <span
                                            style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mrt-gray-100)', color: 'var(--mrt-gray-400)', display: 'grid', placeItems: 'center', flex: 'none' }}
                                        >
                                            <Icon name="person" style={{ fontSize: 36 }} />
                                        </span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ fontSize: 13, color: 'var(--text-tertiary)' }}
                                    />
                                </div>
                            </div>

                            {/* Name + Phone */}
                            <div className="field-row">
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <label>Нэр *</label>
                                    <input
                                        type="text"
                                        className="inp"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Хөтөчийн нэр"
                                    />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <label>Утасны дугаар *</label>
                                    <input
                                        type="tel"
                                        className="inp"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                            </div>

                            {/* Introduction */}
                            <div className="field" style={{ marginTop: 18 }}>
                                <label>Танилцуулга</label>
                                <textarea
                                    className="inp"
                                    value={formData.introduction}
                                    onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                                    rows={4}
                                    placeholder="Хөтөчийн туршлага, мэргэшсэн чиглэл зэргийг оруулна уу"
                                />
                            </div>

                            {/* Experience years */}
                            <div className="field">
                                <label>Туршлагын жил</label>
                                <div className="row" style={{ gap: 10 }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        className="inp"
                                        style={{ width: 120, textAlign: 'center' }}
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                                    />
                                    <span className="cell-muted" style={{ fontSize: 13.5 }}>жил</span>
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="field">
                                <label>Хэл</label>
                                <div className="chip-row">
                                    {availableLanguages.map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => handleLanguageToggle(lang)}
                                            className={`chip ${formData.languages.includes(lang) ? 'active' : ''}`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Specialties */}
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Мэргэшсэн чиглэл</label>
                                <div className="chip-row">
                                    {availableSpecialties.map(specialty => (
                                        <button
                                            key={specialty}
                                            type="button"
                                            onClick={() => handleSpecialtyToggle(specialty)}
                                            className={`chip ${formData.specialties.includes(specialty) ? 'active' : ''}`}
                                        >
                                            {specialty}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="drawer-foot">
                            <div className="spacer" style={{ flex: 1 }} />
                            <button
                                className="btn btn-ghost"
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                            >
                                Цуцлах
                            </button>
                            <button className="btn btn-ink" onClick={handleSubmit}>
                                {editingGuide ? 'Засах' : 'Бүртгэх'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
