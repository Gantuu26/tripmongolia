import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { DEFAULT_GUIDE_INTRO } from '../hooks/useGuideIntro';

/**
 * Admin page to edit the site-wide "Your Guide" intro card (settings key:
 * `guide_intro`). One JSON record: { title, body, chips: string[] }.
 *
 * Shown on every product detail page (mobile + PC). Admin can update the
 * copy without touching code or each product individually.
 */
export const AdminGuideIntroManage: React.FC = () => {
    const [title, setTitle] = useState(DEFAULT_GUIDE_INTRO.title);
    const [body, setBody] = useState(DEFAULT_GUIDE_INTRO.body);
    const [chipsRaw, setChipsRaw] = useState(DEFAULT_GUIDE_INTRO.chips.join('\n'));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.settings.get('guide_intro');
                if (cancelled) return;
                const raw = res?.value ?? res;
                let parsed: { title?: string; body?: string; chips?: string[] } = {};
                if (typeof raw === 'string') {
                    try { parsed = JSON.parse(raw); } catch { /* ignore */ }
                } else if (raw && typeof raw === 'object') {
                    parsed = raw;
                }
                if (parsed.title) setTitle(parsed.title);
                if (parsed.body) setBody(parsed.body);
                if (Array.isArray(parsed.chips) && parsed.chips.length > 0) setChipsRaw(parsed.chips.join('\n'));
            } catch {
                // keep defaults
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const chips = chipsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
            await api.settings.save('guide_intro', JSON.stringify({ title, body, chips }));
            setSavedAt(new Date().toLocaleTimeString('ja-JP'));
        } catch (e) {
            console.error('Failed to save guide intro:', e);
            alert('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const chipList = chipsRaw.split('\n').map((s) => s.trim()).filter(Boolean);

    if (loading) {
        return (
            <AdminLayout activePage="guide-intro" title="Хөтчийн танилцуулга (нийтлэг)">
                <div className="route-anim" style={{ maxWidth: 920 }}>
                    <div className="cell-muted" style={{ fontSize: 14 }}>Ачааллаж байна...</div>
                </div>
            </AdminLayout>
        );
    }

    const saveBtn = (
        <button
            className="btn btn-ink"
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
        >
            <Icon name="check" />{saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
    );

    return (
        <AdminLayout activePage="guide-intro" title="Хөтчийн танилцуулга (нийтлэг)" actions={saveBtn}>
            <div className="route-anim" style={{ maxWidth: 920 }}>
                <div className="card-muted-note">
                    <Icon name="info" />
                    <span>Бүх аяллын бүтээгдэхүүний дэлгэрэнгүй хуудсанд (мобайл, ПК) нийтлэг харагдах “Хөтчийн танилцуулга” карт юм. Энд нэг л удаа засварлахад бүх бүтээгдэхүүнд тусгагдана.</span>
                </div>

                <div className="grid-2" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start', marginTop: 18 }}>
                    <div className="card card-pad">
                        <div className="field">
                            <label>Гарчиг <span className="muted" style={{ fontWeight: 500 }}>(жишээ: 한국어 가이드 동행)</span></label>
                            <input
                                className="inp"
                                value={title}
                                onChange={(e) => { setTitle(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="field">
                            <label>Үндсэн текст <span className="muted" style={{ fontWeight: 500 }}>(2~3 өгүүлбэр санал болгоно)</span></label>
                            <textarea
                                className="inp"
                                rows={4}
                                value={body}
                                onChange={(e) => { setBody(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label>Чип (таг) <span className="muted" style={{ fontWeight: 500 }}>(нэг мөрөнд нэг, жишээ: 한국어 능통)</span></label>
                            <textarea
                                className="inp"
                                rows={4}
                                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                                value={chipsRaw}
                                onChange={(e) => { setChipsRaw(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="row" style={{ marginTop: 18 }}>
                            {savedAt && (
                                <span className="row" style={{ gap: 4, color: 'var(--mrt-green)', fontSize: 13, fontWeight: 700 }}>
                                    <Icon name="check_circle" fill style={{ fontSize: 16 }} />{savedAt} -д хадгалагдсан
                                </span>
                            )}
                            <div className="spacer" style={{ flex: 1 }} />
                            <button
                                className="btn btn-ink"
                                onClick={handleSave}
                                disabled={saving || !title.trim() || !body.trim()}
                            >
                                <Icon name="check" />{saving ? 'Хадгалж байна...' : 'Хадгалах'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="sec-label">Урьдчилан үзэх</div>
                        <div className="gi-preview">
                            <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                                <span className="gi-ava"><Icon name="translate" /></span>
                                <div>
                                    <div className="gi-eyebrow">Your Guide</div>
                                    <div className="cell-strong" style={{ fontSize: 15 }}>{title || '(Гарчиг байхгүй)'}</div>
                                </div>
                            </div>
                            <p className="gi-body">{body || '(Үндсэн текст байхгүй)'}</p>
                            <div className="chip-row" style={{ gap: 6 }}>
                                {chipList.map((c) => <span className="gi-chip" key={c}>{c}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
