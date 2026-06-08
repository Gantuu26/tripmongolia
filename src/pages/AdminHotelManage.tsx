import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';
import type { Hotel } from '../types/hotel';

const EMPTY_HOTEL: Hotel = {
    id: '',
    code: '',
    name_kr: '',
    name_local: '',
    country: '',
    city: '',
    region: '',
    star_rating: 0,
    address: '',
    latitude: null,
    longitude: null,
    description: '',
    website: '',
    images: [],
    amenities: [],
    is_active: true,
};

/**
 * Admin page for the hotel master library.
 * Toolbar + master table (Төлөөлөл / Зочид буудлын нэр / Хаяг / Зураг / Ашиглах / Удирдлага).
 * The editor (add/edit) opens in a modal. The "Импортлох" button in the
 * itinerary editor opens a similar list as a modal elsewhere.
 */
export const AdminHotelManage: React.FC = () => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filters
    const [q, setQ] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    // Editor (modal)
    const [editing, setEditing] = useState<Hotel | null>(null);
    const [isNew, setIsNew] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.hotels.list({ active: false }); // include inactive in admin
            setHotels(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Hotel list load failed:', e);
            setHotels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        return hotels.filter((h) => {
            if (filterActive === 'active' && !h.is_active) return false;
            if (filterActive === 'inactive' && h.is_active) return false;
            if (q) {
                const needle = q.toLowerCase();
                const hay = `${h.name_kr} ${h.name_local || ''} ${h.address || ''}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
    }, [hotels, q, filterActive]);

    const startNew = () => {
        setEditing({ ...EMPTY_HOTEL });
        setIsNew(true);
    };

    const startEdit = (h: Hotel) => {
        setEditing({ ...h });
        setIsNew(false);
    };

    const handleSave = async () => {
        if (!editing) return;
        if (!editing.name_kr.trim()) {
            alert('Үндсэн гарчиг заавал шаардлагатай.');
            return;
        }
        setSaving(true);
        try {
            if (isNew) {
                await api.hotels.create(editing);
            } else {
                await api.hotels.update(editing.id, editing);
            }
            await load();
            setEditing(null);
            setIsNew(false);
        } catch (e: any) {
            alert('Хадгалах амжилтгүй боллоо: ' + (e?.message || 'Тодорхойгүй алдаа'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editing || isNew) return;
        if (!confirm(`"${editing.name_kr}" зочид буудлыг устгах уу?\n\nЭнэ зочид буудлыг ашиглаж буй бүтээгдэхүүний хуваарьт нөлөөлөхгүй (агшин зураг хэлбэрээр хадгалагдсан).`)) return;
        try {
            await api.hotels.delete(editing.id);
            await load();
            setEditing(null);
        } catch (e: any) {
            alert('Устгах амжилтгүй боллоо: ' + (e?.message || 'Тодорхойгүй алдаа'));
        }
    };

    // Delete directly from the table row.
    const deleteRow = async (h: Hotel) => {
        if (!confirm(`"${h.name_kr}" зочид буудлыг устгах уу?\n\nЭнэ зочид буудлыг ашиглаж буй бүтээгдэхүүний хуваарьт нөлөөлөхгүй (агшин зураг хэлбэрээр хадгалагдсан).`)) return;
        try {
            await api.hotels.delete(h.id);
            await load();
        } catch (e: any) {
            alert('Устгах амжилтгүй боллоо: ' + (e?.message || 'Тодорхойгүй алдаа'));
        }
    };

    // Inline toggle of the Ашиглах (active) flag from the table.
    const toggleActive = async (h: Hotel) => {
        try {
            await api.hotels.update(h.id, { ...h, is_active: !h.is_active });
            await load();
        } catch (e: any) {
            alert('Шинэчлэх амжилтгүй боллоо: ' + (e?.message || 'Тодорхойгүй алдаа'));
        }
    };

    const handleAddImages = async (files: FileList | null) => {
        if (!files || !editing) return;
        try {
            const urls = await Promise.all(
                Array.from(files)
                    .filter((f) => f.type.startsWith('image/'))
                    .map((f) => uploadImage(f, 'hotels'))
            );
            setEditing({ ...editing, images: [...(editing.images || []), ...urls] });
        } catch (e) {
            console.error(e);
            alert('Зураг байршуулах амжилтгүй боллоо');
        }
    };

    const removeImage = (idx: number) => {
        if (!editing) return;
        const next = (editing.images || []).filter((_, i) => i !== idx);
        setEditing({ ...editing, images: next });
    };

    return (
        <AdminLayout
            activePage="hotels"
            title="Зочид буудлын сан"
            actions={
                <button type="button" onClick={startNew} className="btn btn-ink">
                    <Icon name="add" />
                    Зочид буудал нэмэх
                </button>
            }
        >
            <div className="route-anim">
                <div className="toolbar">
                    <label className="tb-search">
                        <Icon name="search" />
                        <input
                            placeholder="Зочид буудлын нэр, хаягаар хайх"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </label>
                    <select
                        className="select"
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="active">Ашиглаж байгаа</option>
                        <option value="inactive">Ашиглахгүй</option>
                    </select>
                    <div className="spacer" />
                    <span className="cell-muted" style={{ fontSize: 13 }}>
                        Нийт {hotels.length}-аас <b style={{ color: 'var(--text-strong)' }}>{filtered.length}</b> харуулж байна
                    </span>
                    <button type="button" onClick={startNew} className="btn btn-ink">
                        <Icon name="add" />
                        Зочид буудал нэмэх
                    </button>
                </div>

                <div className="card">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: 80 }}>Төлөөлөл</th>
                                    <th>Зочид буудлын нэр</th>
                                    <th>Хаяг</th>
                                    <th className="c">Зураг</th>
                                    <th className="c">Ашиглах</th>
                                    <th className="r">Удирдлага</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty">
                                                <Icon name="hotel" />
                                                <p>Ачаалж байна...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty">
                                                <Icon name="hotel" />
                                                <p>
                                                    {hotels.length === 0
                                                        ? 'Одоогоор бүртгэгдсэн зочид буудал алга байна. Баруун дээд талын "Зочид буудал нэмэх" товчоор эхлүүлнэ үү.'
                                                        : 'Нөхцөлд тохирох зочид буудал алга байна.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((h) => {
                                        const thumb = (h.images || []).find((url) => !!url);
                                        return (
                                            <tr key={h.id} onClick={() => startEdit(h)}>
                                                <td>
                                                    {thumb ? (
                                                        <img className="thumb sq" src={thumb} alt={h.name_kr} loading="lazy" />
                                                    ) : (
                                                        <span
                                                            className="thumb sq"
                                                            style={{ display: 'grid', placeItems: 'center', color: 'var(--mrt-gray-400)' }}
                                                        >
                                                            <Icon name="image" style={{ fontSize: 20 }} />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="cell-strong">
                                                    {h.name_kr}
                                                    {h.name_local && (
                                                        <span className="cell-muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                                                            {h.name_local}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="cell-muted">{h.address || '-'}</td>
                                                <td className="c">
                                                    <span className="badge b-gray">
                                                        <Icon name="photo_library" />
                                                        {(h.images || []).length}
                                                    </span>
                                                </td>
                                                <td className="c">
                                                    <button
                                                        type="button"
                                                        className={`switch${h.is_active ? ' on' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActive(h);
                                                        }}
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEdit(h);
                                                            }}
                                                        >
                                                            <Icon name="edit" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="act-btn danger"
                                                            title="Устгах"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteRow(h);
                                                            }}
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ─── Add / Edit modal ─── */}
            {editing && (
                <div
                    className="picker-scrim"
                    onClick={() => {
                        setEditing(null);
                        setIsNew(false);
                    }}
                >
                    <div
                        className="picker"
                        style={{ width: 560, maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-head">
                            <h2>{isNew ? 'Шинэ зочид буудал бүртгэх' : 'Зочид буудлын мэдээлэл засах'}</h2>
                            <div className="spacer" />
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(null);
                                    setIsNew(false);
                                }}
                                className="act-btn"
                                title="Хаах"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '20px 22px' }}>
                            <Field label="Үндсэн гарчиг" required hint="Хуваарийн картын том гарчиг болж харагдана. (Жишээ нь: Марина Бэй Сэндс зочид буудал)">
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.name_kr}
                                    onChange={(e) => setEditing({ ...editing, name_kr: e.target.value })}
                                    placeholder="Марина Бэй Сэндс зочид буудал"
                                />
                            </Field>

                            <Field label="Дэд гарчиг" hint="Үндсэн гарчгийн доорх жижиг нэг мөрийн тайлбар. (Жишээ нь: 5 одтой, хотын төв·үзэмж санал болгоно)">
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.name_local || ''}
                                    onChange={(e) => setEditing({ ...editing, name_local: e.target.value })}
                                    placeholder="5 одтой, хотын төв·үзэмж санал болгоно"
                                />
                            </Field>

                            <Field label="Хаяг">
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.address || ''}
                                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                                    placeholder="10 Bayfront Ave, Singapore 018956"
                                />
                            </Field>

                            <Field label="Дэлгэрэнгүй тайлбар">
                                <textarea
                                    className="inp"
                                    value={editing.description || ''}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                    rows={4}
                                    placeholder="Зочид буудлын танилцуулга, онцлог, байршлын давуу тал гэх мэт..."
                                    style={{ minHeight: 100 }}
                                />
                            </Field>

                            <Field label="Тохижилт (таслалаар тусгаарлана)">
                                <input
                                    type="text"
                                    className="inp"
                                    value={(editing.amenities || []).join(', ')}
                                    onChange={(e) =>
                                        setEditing({
                                            ...editing,
                                            amenities: e.target.value
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                    placeholder="Усан сан, сауна, үнэгүй Wi-Fi, өглөөний цай багтсан"
                                />
                            </Field>

                            <Field label="Зураг" hint="Эхний зураг нь хуваарийн дэлгэцэнд харагдах төлөөлөл зураг болно.">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {(editing.images || []).map((src, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '1 / 1',
                                                borderRadius: 'var(--r-md)',
                                                overflow: 'hidden',
                                                border: '1px solid var(--border-default)',
                                            }}
                                        >
                                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                title="Устгах"
                                                style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    background: 'rgba(255,79,79,0.9)',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                }}
                                            >
                                                <Icon name="close" style={{ fontSize: 16 }} />
                                            </button>
                                            {i === 0 && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 4,
                                                        left: 4,
                                                        padding: '1px 7px',
                                                        borderRadius: 6,
                                                        background: 'var(--mrt-ink)',
                                                        color: '#fff',
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    Төлөөлөл
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <label
                                        style={{
                                            aspectRatio: '1 / 1',
                                            border: '1.5px dashed var(--border-strong)',
                                            borderRadius: 'var(--r-md)',
                                            display: 'grid',
                                            placeItems: 'center',
                                            cursor: 'pointer',
                                            color: 'var(--mrt-gray-400)',
                                        }}
                                    >
                                        <Icon name="add_photo_alternate" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                handleAddImages(e.target.files);
                                                e.target.value = '';
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </Field>

                            <Field label="Ашиглах эсэх">
                                <div className="toggle-row">
                                    <button
                                        type="button"
                                        className={`switch${editing.is_active ? ' on' : ''}`}
                                        onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                                    >
                                        <span className="knob" />
                                    </button>
                                    <span className="cell-strong" style={{ fontSize: 13.5 }}>
                                        {editing.is_active ? 'Ашиглах (жагсаалтад харагдана)' : 'Ашиглахгүй (нуугдсан)'}
                                    </span>
                                </div>
                            </Field>
                        </div>

                        <div className="drawer-foot">
                            {!isNew && (
                                <button type="button" onClick={handleDelete} className="btn btn-danger">
                                    <Icon name="delete" />
                                    Устгах
                                </button>
                            )}
                            <div className="spacer" style={{ flex: 1 }} />
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(null);
                                    setIsNew(false);
                                }}
                                className="btn btn-ghost"
                            >
                                Хаах
                            </button>
                            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-ink">
                                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({
    label,
    required,
    hint,
    children,
}) => (
    <div className="field">
        <label>
            {label} {required && <span style={{ color: 'var(--mrt-red)' }}>*</span>}
        </label>
        {children}
        {hint && (
            <p className="cell-muted" style={{ fontSize: 12, marginTop: 6 }}>
                {hint}
            </p>
        )}
    </div>
);
