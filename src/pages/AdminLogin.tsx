import React, { useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/admin/console/Icon';
import '../styles/admin-console.css';

export const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.auth.login(email, password);
            if (response.success) {
                window.location.href = '/admin';
            } else {
                setError(response.error || 'Нэвтрэхэд алдаа гарлаа.');
            }
        } catch (err) {
            setError('Нэвтрэх хүсэлтийг боловсруулж чадсангүй. И-мэйл болон нууц үгээ шалгана уу.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-brand">
                <div className="login-brand-in">
                    <div className="row" style={{ gap: 12 }}>
                        <span className="brand-mark" style={{ width: 46, height: 46 }}><Icon name="flight_takeoff" /></span>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>MILKYWAY</div>
                            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Admin Console</div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <h1 className="login-h">Захиалгаас хөтөч хуваарилалт хүртэл,<br />аяллын үйл ажиллагааг нэг дороос.</h1>
                    <p className="login-p">Хэрэглэгчийн хуудас солонгос хэлээр, админ консол монгол хэлээр захиалга, үнийн санал, бүтээгдэхүүн, контентыг удирдана.</p>
                    <div className="login-stats">
                        <div><b>Захиалга</b><span>үнийн саналаас баталгаажуулалт хүртэл</span></div>
                        <div><b>Бүтээгдэхүүн</b><span>каталогийн удирдлага</span></div>
                        <div><b>Контент</b><span>сэтгүүл, сэтгэгдэл, FAQ</span></div>
                    </div>
                </div>
            </div>

            <div className="login-form-side">
                <form className="login-card" onSubmit={handleLogin}>
                    <div className="eyebrow"><span className="dot" />Админ нэвтрэх</div>
                    <h2 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: '6px 0 6px' }}>Үйл ажиллагаагаа эхлүүлье</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 26px' }}>Админ бүртгэлээрээ нэвтэрнэ үү.</p>

                    {error && (
                        <div style={{
                            marginBottom: 18, padding: '12px 14px', borderRadius: 'var(--r-md)',
                            background: 'var(--mrt-red-soft)', color: 'var(--mrt-red)',
                            fontSize: 13, fontWeight: 600, lineHeight: 1.5,
                        }}>{error}</div>
                    )}

                    <div className="field">
                        <label>И-мэйл</label>
                        <input className="inp" type="text" inputMode="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} placeholder="admin@milkyway.jp"
                            autoComplete="email" required />
                    </div>
                    <div className="field">
                        <label>Нууц үг</label>
                        <input className="inp" type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="Нууц үг оруулах"
                            autoComplete="current-password" required />
                    </div>

                    <button className="btn btn-ink btn-lg" style={{ width: '100%' }} type="submit" disabled={loading}>
                        {loading
                            ? <><Icon name="progress_activity" className="spin" />Нэвтэрч байна</>
                            : <><Icon name="login" />Нэвтрэх</>}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: 18 }}>
                        <button type="button" onClick={() => { window.location.href = '/'; }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                            Хэрэглэгчийн сайт руу буцах
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};
