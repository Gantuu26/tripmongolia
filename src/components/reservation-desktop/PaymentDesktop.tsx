import type { TourProduct, TourPricingOption } from '../../types/product';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { Card, CardHeader, Field, InfoRow, fmtFull, formatPrice, inputStyle } from './primitives';
import { ReservationShell } from './ReservationShell';
import { BookingSummary } from './BookingSummary';

interface PaymentDesktopProps {
    product: TourProduct;
    selectedStartDate: Date | null;
    endDate: Date | null;
    nights: number;
    days: number;
    totalPeople: number;
    baseOption: TourPricingOption | null;
    priceBreakdown: { total: number; deposit: number; local: number };
    customerInfo: { name: string; phone: string; email: string };
    setCustomerInfo: (info: { name: string; phone: string; email: string }) => void;
    memo: string;
    setMemo: (s: string) => void;
    agreeToTerms: boolean;
    setAgreeToTerms: (b: boolean) => void;
    isProcessing: boolean;
    onSubmit: () => void;
    onBack: () => void;
}

/**
 * Step 1 — reservation form + payment confirmation.
 * State lives in src/pages/Payment.tsx so mobile + desktop share the exact
 * same submit/email flow.
 */
export function PaymentDesktop({
    product,
    selectedStartDate,
    endDate,
    nights,
    days,
    totalPeople,
    baseOption,
    priceBreakdown,
    customerInfo,
    setCustomerInfo,
    memo,
    setMemo,
    agreeToTerms,
    setAgreeToTerms,
    isProcessing,
    onSubmit,
    onBack,
}: PaymentDesktopProps) {
    const cleanTitle = product.name.replace(/^\[[^\]]+\]\s*/, '');
    const canSubmit =
        !!customerInfo.name.trim() &&
        !!customerInfo.phone.trim() &&
        !!customerInfo.email.trim() &&
        agreeToTerms &&
        !isProcessing;

    const handleSubmit = () => {
        if (!canSubmit || isProcessing) return;
        onSubmit();
    };

    return (
        <ReservationShell step={1} productName={product.name} onBack={onBack}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: 28,
                    alignItems: 'flex-start',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Selected tour info */}
                    <Card>
                        <CardHeader title="선택한 여행 정보" eyebrow="Tour Info" />
                        <div style={{ padding: '0 28px 24px' }}>
                            <h3
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: 'var(--fg-1)',
                                    margin: '0 0 18px',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {cleanTitle}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 14,
                                }}
                            >
                                <InfoRow
                                    icon="calendar_month"
                                    k="여행 기간"
                                    v={
                                        selectedStartDate && endDate
                                            ? `${fmtFull(selectedStartDate)} - ${fmtFull(endDate)}`
                                            : product.duration || '미선택'
                                    }
                                    sub={
                                        nights > 0 ? `${nights}박 ${days}일` : product.duration
                                    }
                                />
                                <InfoRow
                                    icon="group"
                                    k="예약 인원"
                                    v={`총 ${totalPeople}명`}
                                    sub={
                                        baseOption
                                            ? `1인 ₩${formatPrice(baseOption.pricePerPerson)}`
                                            : undefined
                                    }
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Reservation form */}
                    <Card>
                        <CardHeader title="예약자 정보" eyebrow="Booking Person" />
                        <div
                            style={{
                                padding: '0 28px 28px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px 24px',
                            }}
                        >
                            <Field label="성함" required>
                                <input
                                    value={customerInfo.name}
                                    onChange={(e) =>
                                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                                    }
                                    placeholder="홍길동"
                                    style={inputStyle}
                                />
                            </Field>
                            <Field label="휴대폰 번호" required>
                                <input
                                    value={customerInfo.phone}
                                    onChange={(e) =>
                                        setCustomerInfo({ ...customerInfo, phone: e.target.value })
                                    }
                                    placeholder="010-0000-0000"
                                    type="tel"
                                    style={inputStyle}
                                />
                            </Field>
                            <Field label="이메일 주소" required colSpan={2}>
                                <input
                                    value={customerInfo.email}
                                    onChange={(e) =>
                                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                                    }
                                    placeholder="example@gmail.com"
                                    type="email"
                                    style={inputStyle}
                                />
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--fg-5)',
                                        marginTop: 6,
                                    }}
                                >
                                    PayPal 청구서가 이 이메일 주소로 발송됩니다
                                </div>
                            </Field>
                            <Field label="요청 사항·특이 사항 (선택)" colSpan={2}>
                                <textarea
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="식사 알레르기, 희망하시는 옵션 등이 있으시면 기재해 주세요"
                                    rows={4}
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                        minHeight: 96,
                                        lineHeight: 1.6,
                                    }}
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* Payment amount */}
                    <Card>
                        <CardHeader title="결제 금액" eyebrow="Payment" />
                        <div style={{ padding: '0 28px 24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 0',
                                    borderBottom: '1px solid var(--border-subtle)',
                                }}
                            >
                                <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>
                                    총 여행 비용
                                </span>
                                <span
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: 'var(--fg-1)',
                                    }}
                                >
                                    ₩{formatPrice(priceBreakdown.total)}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 18px',
                                    margin: '12px 0',
                                    background: 'var(--primary-tint, rgba(255, 56, 92,0.08))',
                                    borderRadius: 12,
                                    border: '1px dashed #ff385c',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: 'var(--primary-dark, #e00b41)',
                                    }}
                                >
                                    지금 결제하실 예약금
                                </span>
                                <span
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#ff385c',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    ₩{formatPrice(priceBreakdown.deposit)}
                                </span>
                            </div>
                            {priceBreakdown.local > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 0',
                                        fontSize: 14,
                                        color: 'var(--fg-3)',
                                    }}
                                >
                                    <span>현지 결제 잔금</span>
                                    <span
                                        style={{ fontWeight: 700, color: 'var(--fg-2)' }}
                                    >
                                        ₩{formatPrice(priceBreakdown.local)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Payment method */}
                    <Card>
                        <CardHeader
                            title="예약금 결제 안내"
                            eyebrow="Payment Method"
                        />
                        <div style={{ padding: '0 28px 24px' }}>
                            <div
                                style={{
                                    padding: '20px 22px',
                                    background: '#f0f5ff',
                                    borderRadius: 14,
                                    border: '1px solid #dbe7ff',
                                    display: 'grid',
                                    gridTemplateColumns: '56px 1fr',
                                    gap: 18,
                                }}
                            >
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 14,
                                        background: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid #dbe7ff',
                                    }}
                                >
                                    <MatIcon name="mail" size={28} color="#1e40af" />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: 'var(--fg-1)',
                                            marginBottom: 6,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        PayPal 청구서 (이메일)
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: 'var(--fg-3)',
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        예약 신청 완료 후, 입력하신 이메일 주소로
                                        PayPal 청구서를 보내드립니다.
                                        <br />
                                        메일 안의 링크를 통해 신용카드 등으로 안전하게 결제하실 수 있습니다.
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            marginTop: 14,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {[
                                            { i: 'credit_card', t: '신용카드' },
                                            { i: 'payments', t: '체크카드' },
                                            { i: 'account_balance', t: 'PayPal 잔액' },
                                        ].map((p) => (
                                            <span
                                                key={p.t}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '5px 10px',
                                                    background: '#fff',
                                                    borderRadius: 999,
                                                    fontSize: 11,
                                                    color: 'var(--fg-3)',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                <MatIcon
                                                    name={p.i}
                                                    size={14}
                                                    color="var(--fg-4)"
                                                />{' '}
                                                {p.t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    marginTop: 18,
                                    padding: '16px 20px',
                                    background: 'var(--bg-muted)',
                                    borderRadius: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 12,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: 'var(--fg-1)',
                                    }}
                                >
                                    <MatIcon name="info" size={16} color="var(--fg-3)" /> 결제 시 주의사항
                                </div>
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        fontSize: 12,
                                        color: 'var(--fg-4)',
                                        lineHeight: 1.85,
                                    }}
                                >
                                    <li>청구서 메일에 결제 기한이 기재되어 있습니다. 기한 내에 결제해 주시기 바랍니다.</li>
                                    <li>24시간 이내에 입금이 확인되지 않을 경우 예약이 자동으로 취소됩니다.</li>
                                    <li>
                                        결제에 관한 문의는{' '}
                                        <strong style={{ color: 'var(--fg-2)' }}>
                                            payment.japan_support@milkywayjapan.com
                                        </strong>{' '}
                                        으로 연락해 주세요.
                                    </li>
                                    <li>현지 잔금은 여행 당일 가이드에게 직접 전달해 주세요.</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Cancellation */}
                    <Card>
                        <CardHeader title="취소 규정" eyebrow="Cancellation Policy" />
                        <div style={{ padding: '0 28px 24px' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 10,
                                }}
                            >
                                {[
                                    { range: '출발 31일 전까지', fee: '전액 환불', tone: 'ok' as const },
                                    { range: '30 ~ 15일 전', fee: '30%', tone: 'warn' as const },
                                    { range: '14 ~ 8일 전', fee: '50%', tone: 'warn' as const },
                                    { range: '7일 전 이후', fee: '100%', tone: 'bad' as const },
                                ].map((c) => (
                                    <div
                                        key={c.range}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: 12,
                                            background:
                                                c.tone === 'ok'
                                                    ? 'var(--primary-tint, rgba(255, 56, 92,0.08))'
                                                    : c.tone === 'warn'
                                                        ? '#fef3c7'
                                                        : '#fee2e2',
                                            border:
                                                '1px solid ' +
                                                (c.tone === 'ok'
                                                    ? 'var(--primary-soft, rgba(255, 56, 92,0.18))'
                                                    : c.tone === 'warn'
                                                        ? '#fde68a'
                                                        : '#fecaca'),
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: 'var(--fg-4)',
                                                marginBottom: 6,
                                            }}
                                        >
                                            {c.range}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color:
                                                    c.tone === 'ok'
                                                        ? 'var(--primary-dark, #e00b41)'
                                                        : c.tone === 'warn'
                                                            ? '#92400e'
                                                            : '#991b1b',
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {c.fee}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Agree */}
                    <div
                        style={{
                            padding: '20px 24px',
                            background: '#fff',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            boxShadow: 'var(--shadow-toss)',
                        }}
                    >
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                cursor: 'pointer',
                                flex: 1,
                                userSelect: 'none',
                            }}
                        >
                            <span
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    border:
                                        '1.5px solid ' + (agreeToTerms ? '#ff385c' : 'var(--border-strong)'),
                                    background: agreeToTerms ? '#ff385c' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {agreeToTerms && <MatIcon name="check" size={16} color="#fff" />}
                            </span>
                            <input
                                type="checkbox"
                                checked={agreeToTerms}
                                onChange={() => setAgreeToTerms(!agreeToTerms)}
                                style={{ display: 'none' }}
                            />
                            <span
                                style={{
                                    fontSize: 14,
                                    color: 'var(--fg-2)',
                                    lineHeight: 1.55,
                                }}
                            >
                                <strong style={{ color: 'var(--fg-1)', fontWeight: 700 }}>
                                    주문 내용을 확인하였으며 결제에 동의합니다.
                                </strong>
                                <span style={{ color: 'var(--fg-5)', marginLeft: 8 }}>
                                    <a
                                        href="/terms-of-service"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            color: 'var(--fg-3)',
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        이용약관
                                    </a>{' '}
                                    ·
                                    <a
                                        href="/privacy-policy"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            color: 'var(--fg-3)',
                                            textDecoration: 'underline',
                                            marginLeft: 6,
                                        }}
                                    >
                                        개인정보 처리방침
                                    </a>{' '}
                                    에 동의합니다.
                                </span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Right summary */}
                <BookingSummary
                    product={product}
                    selectedStartDate={selectedStartDate}
                    endDate={endDate}
                    nights={nights}
                    days={days}
                    people={totalPeople}
                    baseOption={baseOption}
                    total={priceBreakdown.total}
                    deposit={priceBreakdown.deposit}
                    local={priceBreakdown.local}
                    ctaLabel={
                        isProcessing
                            ? '처리 중...'
                            : `₩${formatPrice(priceBreakdown.deposit)} 결제하기`
                    }
                    ctaIcon="receipt_long"
                    onCta={handleSubmit}
                    canProceed={canSubmit}
                    canProceedHint={
                        !canSubmit && !isProcessing
                            ? '필수 항목을 입력하고 약관에 동의해 주세요'
                            : null
                    }
                />
            </div>
        </ReservationShell>
    );
}
