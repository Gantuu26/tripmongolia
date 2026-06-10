import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { normalizeBankAccount } from '../hooks/useBankAccount';

/**
 * 무통장 입금 계좌 설정 (settings key: `bank_account`).
 * 여기서 입력한 은행명·계좌번호·예금주가 고객 결제 화면(모바일·PC)에 표시됩니다.
 * Админ энд оруулсан банкны мэдээлэл нь үйлчлүүлэгчийн төлбөрийн дэлгэцэнд харагдана.
 */
export const AdminPaymentSettings: React.FC = () => {
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.settings.get();
                if (cancelled) return;
                const acc = normalizeBankAccount(res?.bank_account);
                setBankName(acc.bankName);
                setAccountNumber(acc.accountNumber);
                setAccountHolder(acc.accountHolder);
            } catch {
                /* keep empty */
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.settings.save('bank_account', JSON.stringify({
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                accountHolder: accountHolder.trim(),
            }));
            setSavedAt(new Date().toLocaleTimeString('ko-KR'));
        } catch (e) {
            console.error('Failed to save bank account:', e);
            alert('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout activePage="payment" title="Төлбөрийн данс (Дансаар шилжүүлэх)">
                <div className="route-anim" style={{ maxWidth: 920 }}>
                    <div className="cell-muted" style={{ fontSize: 14 }}>Ачааллаж байна...</div>
                </div>
            </AdminLayout>
        );
    }

    const saveBtn = (
        <button className="btn btn-ink" onClick={handleSave} disabled={saving}>
            <Icon name="check" />{saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
    );

    return (
        <AdminLayout activePage="payment" title="Төлбөрийн данс (Дансаар шилжүүлэх)" actions={saveBtn}>
            <div className="route-anim" style={{ maxWidth: 920 }}>
                <div className="card-muted-note">
                    <Icon name="info" />
                    <span>Энд оруулсан банкны данс нь үйлчлүүлэгчийн төлбөрийн дэлгэц (мобайл, ПК)-д харагдана. Зөвхөн дансаар шилжүүлэх (무통장입금) аргыг ашиглана.</span>
                </div>

                <div className="grid-2" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start', marginTop: 18 }}>
                    <div className="card card-pad">
                        <div className="field">
                            <label>Банкны нэр <span className="muted" style={{ fontWeight: 500 }}>(은행명 / жишээ: 국민은행)</span></label>
                            <input
                                className="inp"
                                value={bankName}
                                placeholder="국민은행"
                                onChange={(e) => { setBankName(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="field">
                            <label>Дансны дугаар <span className="muted" style={{ fontWeight: 500 }}>(계좌번호)</span></label>
                            <input
                                className="inp"
                                value={accountNumber}
                                placeholder="123456-78-901234"
                                onChange={(e) => { setAccountNumber(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label>Данс эзэмшигч <span className="muted" style={{ fontWeight: 500 }}>(예금주)</span></label>
                            <input
                                className="inp"
                                value={accountHolder}
                                placeholder="Trip Mongolia"
                                onChange={(e) => { setAccountHolder(e.target.value); setSavedAt(null); }}
                            />
                        </div>
                        <div className="row" style={{ marginTop: 18 }}>
                            {savedAt && (
                                <span className="row" style={{ gap: 4, color: 'var(--mrt-green)', fontSize: 13, fontWeight: 700 }}>
                                    <Icon name="check_circle" fill style={{ fontSize: 16 }} />{savedAt} -д хадгалагдсан
                                </span>
                            )}
                            <div className="spacer" style={{ flex: 1 }} />
                            <button className="btn btn-ink" onClick={handleSave} disabled={saving}>
                                <Icon name="check" />{saving ? 'Хадгалж байна...' : 'Хадгалах'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="sec-label">Урьдчилан үзэх (고객 화면)</div>
                        <div className="card card-pad" style={{ background: 'var(--bg-muted)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>입금 계좌</div>
                            <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 2 }}>
                                <div>은행 : <b style={{ color: 'var(--fg-1)' }}>{bankName || '—'}</b></div>
                                <div>계좌번호 : <b style={{ color: 'var(--fg-1)' }}>{accountNumber || '—'}</b></div>
                                <div>예금주 : <b style={{ color: 'var(--fg-1)' }}>{accountHolder || '—'}</b></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
