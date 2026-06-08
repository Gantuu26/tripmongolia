import { useState } from 'react';
import type { TourPricingOption } from '../../types/product';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { formatPrice } from './primitives';

interface PriceTableModalProps {
    options: TourPricingOption[];   // already sorted by people asc
    current: number;                 // currently-selected people count
    onChange: (people: number) => void;
    onClose: () => void;
}

/**
 * Bottom-up "인원별 단가" modal. Re-uses the admin-managed pricingOptions
 * exactly — no hardcoded ladder — so what the admin sets is what users see.
 */
export function PriceTableModal({ options, current, onChange, onClose }: PriceTableModalProps) {
    const [whyOpen, setWhyOpen] = useState(false);

    if (options.length === 0) {
        // Should never reach here (parent gates), but guard so we don't crash.
        return null;
    }

    const minPerPax = Math.min(...options.map((o) => o.pricePerPerson));
    const maxPerPax = Math.max(...options.map((o) => o.pricePerPerson));
    const currentOpt = options.find((o) => o.people === current) ?? options[0];

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 560,
                    maxWidth: '100%',
                    background: '#fff',
                    borderRadius: 24,
                    padding: '28px 28px 24px',
                    boxShadow: '0 30px 60px -20px rgba(0,0,0,0.3)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                    }}
                >
                    <h3
                        style={{
                            fontSize: 19,
                            fontWeight: 700,
                            color: 'var(--fg-1)',
                            margin: 0,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        인원별 1인 단가 안내
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'var(--bg-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MatIcon name="close" size={20} color="var(--fg-3)" />
                    </button>
                </div>

                {/* Current selection callout */}
                <div
                    style={{
                        marginTop: 14,
                        padding: '14px 18px',
                        background: 'var(--primary-tint, rgba(15,118,110,0.08))',
                        border: '2px solid #0f766e',
                        borderRadius: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--fg-5)', fontWeight: 600 }}>
                            현재 선택
                        </div>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: 'var(--fg-1)',
                                marginTop: 4,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {currentOpt.people}명 · ₩{formatPrice(currentOpt.pricePerPerson)}{' '}
                            <span style={{ fontWeight: 500, color: 'var(--fg-5)', fontSize: 13 }}>
                                / 1인
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--fg-5)', fontWeight: 600 }}>
                            합계
                        </div>
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                color: 'var(--primary-dark, #115e59)',
                                marginTop: 4,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            ₩{formatPrice(currentOpt.pricePerPerson * currentOpt.people)}
                        </div>
                    </div>
                </div>

                {/* Comparison table */}
                <div
                    style={{
                        marginTop: 18,
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.4fr 1fr',
                            padding: '12px 18px',
                            background: 'var(--bg-muted)',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--fg-5)',
                            letterSpacing: '0.04em',
                        }}
                    >
                        <div>인원</div>
                        <div style={{ textAlign: 'right' }}>1인 단가</div>
                        <div style={{ textAlign: 'right' }}>합계</div>
                    </div>
                    {options.map((r) => {
                        const on = r.people === current;
                        const isBest = r.pricePerPerson === minPerPax && options.length > 1;
                        const savings = maxPerPax - r.pricePerPerson;
                        const totalForGroup = r.pricePerPerson * r.people;
                        return (
                            <button
                                key={r.people}
                                type="button"
                                onClick={() => onChange(r.people)}
                                style={{
                                    width: '100%',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1.4fr 1fr',
                                    padding: '16px 18px',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderTop: '1px solid var(--border-subtle)',
                                    background: on
                                        ? 'var(--primary-tint, rgba(15,118,110,0.08))'
                                        : '#fff',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: on
                                                ? 'var(--primary-dark, #115e59)'
                                                : 'var(--fg-1)',
                                        }}
                                    >
                                        {r.people}명
                                    </span>
                                    {on && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                background: '#0f766e',
                                                color: '#fff',
                                                borderRadius: 4,
                                            }}
                                        >
                                            현재
                                        </span>
                                    )}
                                    {isBest && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                background: '#f97316',
                                                color: '#fff',
                                                borderRadius: 4,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 3,
                                            }}
                                        >
                                            <MatIcon
                                                name="local_fire_department"
                                                size={12}
                                                filled
                                                color="#fff"
                                            />{' '}
                                            최저가
                                        </span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: 'var(--fg-1)',
                                        }}
                                    >
                                        ₩{formatPrice(r.pricePerPerson)}
                                    </div>
                                    {savings > 0 && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#059669',
                                                marginTop: 2,
                                                fontWeight: 600,
                                            }}
                                        >
                                            1인 ₩{formatPrice(savings)} 할인
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        textAlign: 'right',
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: on ? 'var(--primary-dark, #115e59)' : 'var(--fg-1)',
                                    }}
                                >
                                    ₩{formatPrice(totalForGroup)}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Why prices differ */}
                <button
                    type="button"
                    onClick={() => setWhyOpen((v) => !v)}
                    style={{
                        width: '100%',
                        marginTop: 14,
                        padding: '14px 18px',
                        background: 'var(--bg-muted)',
                        borderRadius: 12,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--fg-2)',
                    }}
                >
                    <span
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            background: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MatIcon name="help" size={14} color="var(--fg-3)" />
                    </span>
                    인원에 따라 요금이 다른 이유는?
                    <MatIcon
                        name="expand_more"
                        size={18}
                        color="var(--fg-4)"
                        style={{
                            marginLeft: 'auto',
                            transform: whyOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 200ms',
                        }}
                    />
                </button>
                {whyOpen && (
                    <div
                        style={{
                            marginTop: 8,
                            padding: '14px 18px',
                            background: 'var(--bg-muted)',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'var(--fg-4)',
                            lineHeight: 1.7,
                        }}
                    >
                        가이드·드라이버·차량 비용은 인원수로 나누어지므로, 그룹이 클수록 1인당 단가가 낮아집니다.
                        인원에 따라 최적의 차량을 자동으로 배정합니다.
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '16px',
                        marginTop: 16,
                        background: '#0f766e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '0 8px 20px -6px rgba(15,118,110,0.5)',
                    }}
                >
                    이 인원으로 예약하기
                </button>
            </div>
        </div>
    );
}
