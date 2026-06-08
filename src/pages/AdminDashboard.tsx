import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';

type Reservation = {
    id: string;
    status?: string;
    createdAt?: string;
    customerName?: string;
    productName?: string;
    confirmedPrice?: number;
};

type Quote = {
    id: string;
    status?: string;
    name?: string;
    destination?: string;
    createdAt?: string;
    created_at?: string;
};

type Guide = {
    id: string;
    name?: string;
    status?: string;
    image?: string;
};

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
    new: { label: 'Шинэ үнийн санал', tone: 'b-purple' },
    processing: { label: 'Үнийн санал боловсруулж байна', tone: 'b-amber' },
    answered: { label: 'Үнийн санал илгээсэн', tone: 'b-blue' },
    reservation_requested: { label: 'Захиалга хүссэн', tone: 'b-purple' },
    pending_payment: { label: 'Төлбөр хүлээж байна', tone: 'b-amber' },
    paid: { label: 'Төлбөр төлсөн', tone: 'b-blue' },
    confirmed: { label: 'Захиалга баталгаажсан', tone: 'b-green' },
    completed: { label: 'Аялал дууссан', tone: 'b-gray' },
    cancelled: { label: 'Цуцалсан', tone: 'b-gray' },
};

const AV_TONES = ['tint-blue', 'tint-purple', 'tint-green', 'tint-amber', 'tint-ink'];
const avTone = (name: string) => AV_TONES[(name.charCodeAt(0) || 0) % AV_TONES.length];

const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.getMonth() + 1} сар ${date.getDate()} өдөр`;
};
const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [guides, setGuides] = useState<Guide[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setErrorMessage('');
            try {
                const [reservationData, quoteData, guideData] = await Promise.all([
                    api.reservations.list(),
                    api.quotes.list(),
                    api.guides.list(),
                ]);
                setReservations((reservationData || []).map((item: any) => ({
                    ...item,
                    createdAt: item.createdAt || item.created_at,
                    customerName: item.customerName || item.customer_name || 'Нэргүй',
                    productName: item.productName || item.product_name || 'Бүтээгдэхүүн тодорхойгүй',
                    confirmedPrice: item.confirmedPrice || item.confirmed_price || 0,
                })));
                setQuotes(quoteData || []);
                setGuides(guideData || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
                setErrorMessage('Хяналтын самбарын мэдээллийг ачаалж чадсангүй. Хэсэг хугацааны дараа дахин оролдоно уу.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const metrics = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = reservations.filter((item) => item.createdAt?.startsWith(today)).length;
        const unpaidReservations = reservations.filter((item) => item.status === 'pending_payment').length;
        const newQuotes = quotes.filter((item) => item.status === 'pending' || item.status === 'new').length;
        const ongoingTours = reservations.filter((item) => item.status === 'confirmed').length;
        const confirmedSales = reservations
            .filter((item) => item.status === 'confirmed' || item.status === 'completed' || item.status === 'paid')
            .reduce((sum, item) => sum + Number(item.confirmedPrice || 0), 0);
        return { todayReservations, unpaidReservations, newQuotes, ongoingTours, confirmedSales };
    }, [reservations, quotes]);

    const recentReservations = reservations.slice(0, 6);
    const recentQuotes = quotes.slice(0, 3);

    const metricCards = [
        { ico: 'today', tint: 'tint-blue', label: 'Өнөөдрийн шинэ захиалга', value: `${metrics.todayReservations}`, unit: 'ширхэг' },
        { ico: 'request_quote', tint: 'tint-purple', label: 'Шинэ үнийн санал хүсэлт', value: `${metrics.newQuotes}`, unit: 'ширхэг' },
        { ico: 'payments', tint: 'tint-amber', label: 'Төлбөр хүлээж байна', value: `${metrics.unpaidReservations}`, unit: 'ширхэг' },
        { ico: 'paid', tint: 'tint-green', label: 'Баталгаажсан орлого', value: `₩${formatNumber(metrics.confirmedSales)}`, unit: '' },
    ];
    const quickLinks = [
        { t: 'Үнийн санал хариу хүлээж байна', s: 'Шинэ·боловсруулж буй санал', v: metrics.newQuotes, ico: 'mark_email_unread', tint: 'tint-purple', go: '/admin/quotes' },
        { t: 'Төлбөр баталгаажуулах шаардлагатай', s: 'Урьдчилгаа төлбөр төлөгдөөгүй', v: metrics.unpaidReservations, ico: 'account_balance', tint: 'tint-amber', go: '/admin/reservations' },
        { t: 'Аяллын хуанли', s: 'Баталгаажсан аяллын хуваарь', v: metrics.ongoingTours, ico: 'calendar_today', tint: 'tint-blue', go: '/admin/calendar' },
    ];

    return (
        <AdminLayout
            activePage="dashboard"
            title="Хяналтын самбар"
            actions={
                <button type="button" className="btn btn-ink" onClick={() => navigate('/admin/quotes')}>
                    <Icon name="request_quote" />Үнийн санал шалгах
                </button>
            }
        >
            <div className="stack route-anim">
                {errorMessage && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--mrt-red-soft)',
                        color: 'var(--mrt-red)', fontSize: 13, fontWeight: 600,
                    }}>{errorMessage}</div>
                )}

                <section className="metric-grid">
                    {metricCards.map((m, i) => (
                        <div className="metric" key={i}>
                            <div className="metric-top">
                                <span className={`metric-ico ${m.tint}`}><Icon name={m.ico} fill /></span>
                            </div>
                            <div className="metric-label">{m.label}</div>
                            <div className="metric-value">{isLoading ? '-' : m.value}{m.unit && <small>{m.unit}</small>}</div>
                        </div>
                    ))}
                </section>

                <section className="grid-3">
                    {quickLinks.map((q, i) => (
                        <button className="qlink" key={i} onClick={() => navigate(q.go)}>
                            <span className={`qi ${q.tint}`}><Icon name={q.ico} fill /></span>
                            <span className="qtext"><span className="qt">{q.t}</span><span className="qs">{q.s}</span></span>
                            <span className="qv">{q.v}</span>
                            <Icon name="chevron_right" className="arr" />
                        </button>
                    ))}
                </section>

                <section className="grid-2">
                    <div className="card">
                        <div className="card-head">
                            <h2>Сүүлийн захиалга</h2><div className="spacer" />
                            <button className="link-action" onClick={() => navigate('/admin/reservations')}>Бүгдийг харах<Icon name="chevron_right" /></button>
                        </div>
                        <div className="tbl-wrap">
                            <table className="tbl">
                                <thead><tr><th>Захиалгын дугаар</th><th>Үйлчлүүлэгч</th><th>Бүтээгдэхүүн</th><th>Төлөв</th><th className="r">Дүн</th></tr></thead>
                                <tbody>
                                    {recentReservations.map((r) => {
                                        const s = STATUS_BADGE[r.status || ''] || { label: r.status || '-', tone: 'b-gray' };
                                        return (
                                            <tr key={r.id} onClick={() => navigate('/admin/reservations')}>
                                                <td className="cell-mono">#{r.id.slice(0, 6)}</td>
                                                <td>
                                                    <div className="av-cell">
                                                        <span className={`avatar round ${avTone(r.customerName || '?')}`}>{(r.customerName || '?').slice(0, 2)}</span>
                                                        <span className="cell-strong">{r.customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="cell-muted" style={{ maxWidth: 240 }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</div>
                                                </td>
                                                <td><span className={`badge ${s.tone}`}>{s.label}</span></td>
                                                <td className="r cell-price">{r.confirmedPrice ? `₩${formatNumber(r.confirmedPrice)}` : '–'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {!isLoading && recentReservations.length === 0 && (
                                <div className="empty"><Icon name="inbox" /><p>Сүүлийн захиалга алга байна.</p></div>
                            )}
                        </div>
                    </div>

                    <div className="stack">
                        <div className="card">
                            <div className="card-head"><h2>Шинэ үнийн санал хүсэлт</h2><div className="spacer" />
                                <button className="link-action" onClick={() => navigate('/admin/quotes')}>Үнийн саналын удирдлага<Icon name="chevron_right" /></button></div>
                            <div style={{ padding: 12 }}>
                                {recentQuotes.map((q) => (
                                    <button key={q.id} className="qlink" style={{ marginBottom: 8, padding: '13px 14px' }} onClick={() => navigate('/admin/quotes')}>
                                        <span className="qi tint-purple" style={{ width: 40, height: 40 }}><Icon name="request_quote" fill /></span>
                                        <span className="qtext"><span className="qt">{q.name || 'Нэргүй'}</span>
                                            <span className="qs">{q.destination || 'Очих газар тодорхойгүй'} · {formatDate(q.createdAt || q.created_at)}</span></span>
                                        <Icon name="chevron_right" className="arr" />
                                    </button>
                                ))}
                                {!isLoading && recentQuotes.length === 0 && (
                                    <div className="empty" style={{ padding: '28px 20px' }}><Icon name="inbox" /><p>Хүлээгдэж буй үнийн саналын хүсэлт алга байна.</p></div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-head"><h2>Хөтчийн төлөв</h2><div className="spacer" />
                                <button className="link-action" onClick={() => navigate('/admin/guides')}>Хөтчийн удирдлага<Icon name="chevron_right" /></button></div>
                            <div style={{ padding: '8px 18px 14px' }}>
                                {guides.slice(0, 5).map((g, i) => (
                                    <div key={g.id} className="row" style={{ padding: '9px 0', borderBottom: i < Math.min(guides.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                        {g.image
                                            ? <img className="avatar round" src={g.image} alt={g.name || 'Хөтөч'} />
                                            : <span className={`avatar round ${avTone(g.name || '?')}`}>{(g.name || '?').slice(0, 2)}</span>}
                                        <div style={{ minWidth: 0 }}>
                                            <div className="cell-strong">{g.name || 'Нэргүй'}</div>
                                        </div>
                                        <div className="spacer" style={{ flex: 1 }} />
                                        <span className={`badge ${g.status === 'active' ? 'b-green' : 'b-gray'}`}>{g.status === 'active' ? 'Идэвхтэй' : 'Хүлээгдэж буй'}</span>
                                    </div>
                                ))}
                                {!isLoading && guides.length === 0 && (
                                    <div className="empty" style={{ padding: '28px 20px' }}><Icon name="person_off" /><p>Бүртгэгдсэн хөтөч алга байна.</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
};
