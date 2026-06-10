import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';
import type { SpotRegion, TouristSpot } from '../types/touristSpot';
import { SPOT_REGION_OPTIONS } from '../types/touristSpot';

const EMPTY_SPOT: TouristSpot = {
    id: '',
    name_kr: '',
    name_local: '',
    address: '',
    description: '',
    images: [],
    region: '',
    is_active: true,
};

type RegionFilter = 'all' | SpotRegion | 'uncat';

const REGION_FILTER_TABS: { value: RegionFilter; label: string }[] = [
    { value: 'all', label: 'Бүгд' },
    { value: 'central', label: 'Төв Монгол' },
    { value: 'gobi', label: 'Говь цөл' },
    { value: 'hovsgol', label: 'Хөвсгөл' },
    { value: 'ulaanbaatar', label: 'Улаанбаатар' },
    { value: 'experience', label: 'Туршлага' },
    { value: 'food', label: 'Хоол' },
    { value: 'uncat', label: 'Ангилаагүй' },
];

const regionLabel = (r?: SpotRegion | null): string | null => {
    if (!r) return null;
    const found = SPOT_REGION_OPTIONS.find((o) => o.value === r);
    return found ? found.label : null;
};

/**
 * Admin page for the tourist spot master library.
 * Same shape as AdminHotelManage. Picking from a TIMELINE block's
 * "관광지에서 선택" button populates that block's title / description /
 * images automatically.
 */
export const AdminTouristSpotManage: React.FC = () => {
    const [spots, setSpots] = useState<TouristSpot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [q, setQ] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterRegion, setFilterRegion] = useState<RegionFilter>('all');

    const [editing, setEditing] = useState<TouristSpot | null>(null);
    const [isNew, setIsNew] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.touristSpots.list({ active: false });
            setSpots(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Tourist spot list load failed:', e);
            setSpots([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return spots.filter((s) => {
            if (filterActive === 'active' && !s.is_active) return false;
            if (filterActive === 'inactive' && s.is_active) return false;
            if (filterRegion !== 'all') {
                const rowRegion = (s.region || '') as SpotRegion;
                if (filterRegion === 'uncat') {
                    if (rowRegion) return false;        // has a region → not "미분류"
                } else if (rowRegion !== filterRegion) {
                    return false;
                }
            }
            if (q) {
                const needle = q.toLowerCase();
                const hay = `${s.name_kr} ${s.name_local || ''}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
    }, [spots, q, filterActive, filterRegion]);

    const startNew = () => {
        setEditing({ ...EMPTY_SPOT });
        setIsNew(true);
    };

    const startEdit = (s: TouristSpot) => {
        setEditing({ ...s });
        setIsNew(false);
    };

    const handleSave = async () => {
        if (!editing) return;
        if (!editing.name_kr.trim()) {
            alert('Гарчиг заавал шаардлагатай.');
            return;
        }
        setSaving(true);
        try {
            if (isNew) {
                await api.touristSpots.create(editing);
            } else {
                await api.touristSpots.update(editing.id, editing);
            }
            await load();
            setEditing(null);
            setIsNew(false);
        } catch (e: any) {
            alert('Хадгалахад алдаа гарлаа: ' + (e?.message || 'Тодорхойгүй алдаа'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editing || isNew) return;
        if (!confirm(`"${editing.name_kr}" аялал жуулчлалын газрыг устгах уу?\n\nЭнэ газрыг ашиглаж буй бүтээгдэхүүний хөтөлбөрт нөлөөлөхгүй (агшин зураг хэлбэрээр хадгалагдсан).`)) return;
        try {
            await api.touristSpots.delete(editing.id);
            await load();
            setEditing(null);
        } catch (e: any) {
            alert('Устгахад алдаа гарлаа: ' + (e?.message || 'Тодорхойгүй алдаа'));
        }
    };

    const handleAddImages = async (files: FileList | null) => {
        if (!files || !editing) return;
        try {
            const urls = await Promise.all(
                Array.from(files)
                    .filter((f) => f.type.startsWith('image/'))
                    .map((f) => uploadImage(f, 'tourist-spots'))
            );
            setEditing({ ...editing, images: [...(editing.images || []), ...urls] });
        } catch (e) {
            console.error(e);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const removeImage = (idx: number) => {
        if (!editing) return;
        const next = (editing.images || []).filter((_, i) => i !== idx);
        setEditing({ ...editing, images: next });
    };

    const closeEditor = () => { setEditing(null); setIsNew(false); };

    return (
        <AdminLayout
            activePage="tourist-spots"
            title="Аялал жуулчлалын газрын сан"
            actions={
                <button type="button" onClick={startNew} className="btn btn-ink">
                    <Icon name="add" />
                    Аялал жуулчлалын газар нэмэх
                </button>
            }
        >
            <div className="route-anim">
                {/* Toolbar: search + region select + 사용여부 select + add button */}
                <div className="toolbar">
                    <label className="tb-search">
                        <Icon name="search" />
                        <input
                            placeholder="Газрын нэр, бүс нутгаар хайх"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </label>
                    <select
                        className="select"
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value as RegionFilter)}
                    >
                        {REGION_FILTER_TABS.map((tab) => {
                            const count = tab.value === 'all'
                                ? spots.length
                                : tab.value === 'uncat'
                                    ? spots.filter((s) => !s.region).length
                                    : spots.filter((s) => s.region === tab.value).length;
                            return (
                                <option key={tab.value} value={tab.value}>
                                    {tab.label} ({count})
                                </option>
                            );
                        })}
                    </select>
                    <select
                        className="select"
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="active">Ашиглаж буй</option>
                        <option value="inactive">Ашиглахгүй</option>
                    </select>
                    <div className="spacer" />
                    <div className="cell-muted" style={{ fontSize: 13, fontWeight: 600 }}>
                        Нийт {spots.length}-аас <b className="cell-strong">{filtered.length}</b>
                    </div>
                </div>

                {/* Card + table */}
                <div className="card">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: 80 }}>Үндсэн зураг</th>
                                    <th>Газрын нэр</th>
                                    <th>Бүс нутаг</th>
                                    <th>Хаяг</th>
                                    <th className="c">Зураг</th>
                                    <th className="c">Ашиглалт</th>
                                    <th className="r">Удирдлага</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="empty">
                                                <Icon name="hourglass_empty" />
                                                <p>Ачаалж байна...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="empty">
                                                <Icon name="location_on" />
                                                <p>
                                                    {spots.length === 0
                                                        ? 'Бүртгэгдсэн аялал жуулчлалын газар алга. Баруун дээд буланд байрлах "Аялал жуулчлалын газар нэмэх" товчоор эхлүүлнэ үү.'
                                                        : 'Нөхцөлд тохирох аялал жуулчлалын газар алга.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((s) => {
                                        const thumb = (s.images || []).find((url) => !!url);
                                        const photoCount = (s.images || []).length;
                                        return (
                                            <tr key={s.id} onClick={() => startEdit(s)}>
                                                <td>
                                                    {thumb ? (
                                                        <img
                                                            className="thumb sq"
                                                            src={thumb}
                                                            alt={s.name_kr}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="thumb sq"
                                                            style={{ display: 'grid', placeItems: 'center', color: 'var(--mrt-gray-400)' }}
                                                        >
                                                            <Icon name="image" style={{ fontSize: 20 }} />
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="cell-strong">{s.name_kr}</span>
                                                    {s.name_local && (
                                                        <span className="cell-muted" style={{ marginLeft: 8, fontSize: 12.5 }}>
                                                            {s.name_local}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {regionLabel(s.region) ? (
                                                        <span className="badge b-blue">{regionLabel(s.region)}</span>
                                                    ) : (
                                                        <span className="cell-muted">Ангилаагүй</span>
                                                    )}
                                                </td>
                                                <td className="cell-muted">{s.address || '-'}</td>
                                                <td className="c">
                                                    <span className="badge b-gray">
                                                        <Icon name="photo_library" />
                                                        {photoCount}
                                                    </span>
                                                </td>
                                                <td className="c">
                                                    <span className={`badge ${s.is_active ? 'b-green' : 'b-gray'}`}>
                                                        {s.is_active ? 'Ашиглаж буй' : 'Ашиглахгүй'}
                                                    </span>
                                                </td>
                                                <td className="r" onClick={(e) => e.stopPropagation()}>
                                                    <span className="row-actions">
                                                        <button
                                                            type="button"
                                                            className="act-btn"
                                                            title="Засах"
                                                            onClick={() => startEdit(s)}
                                                        >
                                                            <Icon name="edit" />
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

            {/* Editor modal */}
            {editing && (
                <div className="picker-scrim" onClick={closeEditor}>
                    <div
                        className="picker"
                        style={{ width: 560, maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-head">
                            <h2>{isNew ? 'Шинэ аялал жуулчлалын газар бүртгэх' : 'Аялал жуулчлалын газрын мэдээлэл засах'}</h2>
                            <div className="spacer" />
                            <button type="button" onClick={closeEditor} className="act-btn" title="Хаах">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="picker-list" style={{ padding: '20px 22px' }}>
                            {/* 지역 분류 */}
                            <div className="field">
                                <label>Бүс нутгийн ангилал</label>
                                <div className="chip-row">
                                    {[{ v: '' as SpotRegion, l: 'Ангилаагүй' }, ...SPOT_REGION_OPTIONS.map((o) => ({ v: o.value, l: o.label }))].map((opt) => (
                                        <button
                                            key={opt.v || 'none'}
                                            type="button"
                                            onClick={() => setEditing({ ...editing, region: opt.v })}
                                            className={`chip${(editing.region || '') === opt.v ? ' active' : ''}`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 7 }}>
                                    Шүүлтүүрээс энэ ангиллаар хурдан хайж болно. (Сонголт)
                                </p>
                            </div>

                            {/* 대제목 */}
                            <div className="field">
                                <label>Гарчиг *</label>
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.name_kr}
                                    onChange={(e) => setEditing({ ...editing, name_kr: e.target.value })}
                                    placeholder="Цагаан суварга"
                                />
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 7 }}>
                                    Хөтөлбөрийн картын том гарчиг болж харагдана. (Жишээ: Цагаан суварга)
                                </p>
                            </div>

                            {/* 소제목 */}
                            <div className="field">
                                <label>Дэд гарчиг</label>
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.name_local || ''}
                                    onChange={(e) => setEditing({ ...editing, name_local: e.target.value })}
                                    placeholder="Монголын Их Хавцал, Цагаан суварга"
                                />
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 7 }}>
                                    Гарчгийн доорх жижиг нэг мөр тайлбар. (Жишээ: Монголын Их Хавцал, Цагаан суварга)
                                </p>
                            </div>

                            {/* 주소 */}
                            <div className="field">
                                <label>Хаяг</label>
                                <input
                                    type="text"
                                    className="inp"
                                    value={editing.address || ''}
                                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                                    placeholder="Улаанбаатараас зүүн хойш 70км (Сонголт)"
                                />
                            </div>

                            {/* 상세 설명 */}
                            <div className="field">
                                <label>Дэлгэрэнгүй тайлбар</label>
                                <textarea
                                    className="inp"
                                    value={editing.description || ''}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                    rows={5}
                                    placeholder="Аялал жуулчлалын газрын танилцуулга, үзвэр, зөвлөмж гэх мэт..."
                                    style={{ minHeight: 120 }}
                                />
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 7 }}>
                                    Энэ агуулга нь хөтөлбөрийн зүйлийн тайлбар болж автоматаар орно.
                                </p>
                            </div>

                            {/* 이미지 */}
                            <div className="field">
                                <label>Зураг</label>
                                <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {(editing.images || []).map((src, i) => (
                                        <div
                                            key={i}
                                            style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}
                                        >
                                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                title="Устгах"
                                                style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: 8, border: 'none', background: 'rgba(255,79,79,0.92)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                            >
                                                <Icon name="close" style={{ fontSize: 16 }} />
                                            </button>
                                            {i === 0 && (
                                                <span
                                                    className="badge b-ink"
                                                    style={{ position: 'absolute', bottom: 4, left: 4 }}
                                                >
                                                    Үндсэн
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    <label
                                        className="block-img-empty"
                                        style={{ aspectRatio: '1 / 1', height: 'auto', cursor: 'pointer' }}
                                    >
                                        <Icon name="add_photo_alternate" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                handleAddImages(e.target.files);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                                <p className="cell-muted" style={{ fontSize: 12, marginTop: 7 }}>
                                    Эдгээр зураг нь хөтөлбөрийн зүйлийн зураг болж автоматаар хавсрагдана.
                                </p>
                            </div>

                            {/* 사용 여부 */}
                            <div className="toggle-row" style={{ marginBottom: 0 }}>
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
                        </div>

                        <div className="drawer-foot">
                            {!isNew && (
                                <button type="button" onClick={handleDelete} className="btn btn-danger">
                                    <Icon name="delete" />
                                    Устгах
                                </button>
                            )}
                            <div className="spacer" style={{ flex: 1 }} />
                            <button type="button" onClick={closeEditor} className="btn btn-ghost">
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
