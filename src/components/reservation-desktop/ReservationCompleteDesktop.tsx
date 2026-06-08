import { useNavigate } from 'react-router-dom';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { ReservationShell } from './ReservationShell';
import { formatPrice } from './primitives';

interface ReservationCompleteDesktopProps {
    productName: string;
    email: string;
    total: number;
    deposit: number;
}

/**
 * Step 2 — final confirmation screen.
 * Mirrors the handoff `StepComplete` layout. Buttons route back to
 * /products and /mypage/reservations.
 */
export function ReservationCompleteDesktop({
    productName,
    email,
    total,
    deposit,
}: ReservationCompleteDesktopProps) {
    const navigate = useNavigate();
    const cleanName = productName.replace(/^\[[^\]]+\]\s*/, '');

    return (
        <ReservationShell step={2} productName={productName} hideBack>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 24,
                        padding: '48px 56px',
                        boxShadow: 'var(--shadow-toss)',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 88,
                            height: 88,
                            margin: '0 auto 24px',
                            borderRadius: 999,
                            background: '#ff385c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 12px 32px -8px rgba(255, 56, 92,0.45)',
                        }}
                    >
                        <MatIcon name="check" size={52} color="#fff" />
                    </div>
                    <h2
                        style={{
                            fontSize: 30,
                            fontWeight: 700,
                            color: 'var(--fg-1)',
                            margin: '0 0 14px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        예약 신청이 완료되었습니다
                    </h2>
                    <p
                        style={{
                            fontSize: 14,
                            color: 'var(--fg-4)',
                            lineHeight: 1.75,
                            margin: 0,
                        }}
                    >
                        입력하신 이메일 주소{' '}
                        <strong style={{ color: 'var(--fg-1)', fontWeight: 700 }}>
                            {email}
                        </strong>{' '}
                        로
                        <br />
                        PayPal 청구서를 보내드립니다.
                        <br />
                        <strong style={{ color: '#ff385c', fontWeight: 700 }}>
                            결제가 완료되면 예약이 확정됩니다.
                        </strong>
                    </p>

                    <div
                        style={{
                            margin: '32px 0 28px',
                            padding: '26px 28px',
                            background: 'var(--bg-muted)',
                            borderRadius: 16,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 20,
                            textAlign: 'left',
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--fg-5)',
                                    letterSpacing: '0.04em',
                                    fontWeight: 600,
                                }}
                            >
                                선택 투어
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'var(--fg-1)',
                                    marginTop: 4,
                                    lineHeight: 1.4,
                                }}
                            >
                                {cleanName}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--fg-5)',
                                    letterSpacing: '0.04em',
                                    fontWeight: 600,
                                }}
                            >
                                결제할 예약금
                            </div>
                            <div
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: 'var(--fg-1)',
                                    marginTop: 4,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                ₩{formatPrice(deposit)}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--fg-5)',
                                    marginTop: 2,
                                }}
                            >
                                총 여행 비용: ₩{formatPrice(total)}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            padding: '20px 24px',
                            background: '#fff',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 14,
                            textAlign: 'left',
                        }}
                    >
                        {[
                            {
                                i: 'mark_email_read',
                                t: '등록하신 이메일로 결제용 PayPal 청구 메일을 보내드립니다.',
                            },
                            {
                                i: 'credit_score',
                                t: '메일 안의 링크를 통해 신용카드 등으로 안전하고 간편하게 결제하실 수 있습니다.',
                            },
                            {
                                i: 'report',
                                t: '결제가 확인되지 않을 경우 예약이 자동으로 취소될 수 있습니다.',
                            },
                        ].map((s) => (
                            <div
                                key={s.t}
                                style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background:
                                            'var(--primary-tint, rgba(255, 56, 92,0.08))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <MatIcon name={s.i} size={20} filled color="#ff385c" />
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--fg-3)',
                                        lineHeight: 1.65,
                                        paddingTop: 8,
                                    }}
                                >
                                    {s.t}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            style={{
                                flex: '0 0 200px',
                                padding: '16px',
                                background: '#fff',
                                color: 'var(--fg-1)',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            홈으로 돌아가기
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/mypage/reservations')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: '#ff385c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: '0 8px 20px -6px rgba(255, 56, 92,0.5)',
                            }}
                        >
                            <MatIcon name="receipt_long" size={18} color="#fff" /> 예약 내역 확인하기
                        </button>
                    </div>
                </div>

                {/* Help band */}
                <div
                    style={{
                        marginTop: 18,
                        padding: '18px 24px',
                        background: '#fff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            background: 'var(--bg-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MatIcon name="support_agent" size={22} color="#ff385c" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: 'var(--fg-1)',
                            }}
                        >
                            결제·예약 관련 문의
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: 'var(--fg-5)',
                                marginTop: 2,
                            }}
                        >
                            한국어 스태프가 24시간 이내에 답변해 드립니다
                        </div>
                    </div>
                </div>
            </div>
        </ReservationShell>
    );
}
