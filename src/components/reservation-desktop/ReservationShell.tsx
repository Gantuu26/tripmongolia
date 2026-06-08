import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatIcon } from '../desktop-primitives/MatIcon';
import { Stepper, type StepIdx } from './Stepper';

interface ReservationShellProps {
    step: StepIdx;
    productName?: string;
    /** Custom back behavior. Defaults to navigate(-1). */
    onBack?: () => void;
    /** Hide the back button on the final "complete" step. */
    hideBack?: boolean;
    /** Inline content under the stepper. */
    children: ReactNode;
}

const CONTENT_WIDTH = 1280;

const STEP_TITLES: Record<StepIdx, { title: string; subtitle: string }> = {
    0: {
        title: '예약일 및 옵션 선택',
        subtitle: '여행 시작일과 인원, 옵션을 선택해 주세요',
    },
    1: {
        title: '예약 정보 및 결제 확인',
        subtitle: '예약자 정보와 결제 방법을 확인해 주세요',
    },
    2: {
        title: '예약 신청 완료',
        subtitle: '감사합니다. 결제 완료 시 예약이 확정됩니다',
    },
};

/**
 * Shared chrome for the 3-step desktop booking flow:
 *   - Breadcrumb + Back button
 *   - Step title + subtitle
 *   - Stepper visualizing progress
 *   - Slot for the main step body
 *
 * Used by all three pages (Reservation, Payment, ReservationComplete) so the
 * visual continuity stays even though the URL changes on Next.
 */
export function ReservationShell({
    step,
    productName,
    onBack,
    hideBack,
    children,
}: ReservationShellProps) {
    const navigate = useNavigate();
    const { title, subtitle } = STEP_TITLES[step];
    const handleBack = onBack ?? (() => navigate(-1));
    const cleanName = productName?.replace(/^\[[^\]]+\]\s*/, '') ?? null;

    return (
        <div style={{ background: 'var(--bg-muted)', minHeight: '100vh' }}>
            {/* Breadcrumb + back */}
            <div
                style={{ background: '#fff', borderBottom: '1px solid var(--border-subtle)' }}
            >
                <div
                    style={{
                        maxWidth: CONTENT_WIDTH,
                        margin: '0 auto',
                        padding: '16px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    {!hideBack && (
                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px 8px 10px',
                                background: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: 999,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--fg-2)',
                            }}
                        >
                            <MatIcon name="chevron_left" size={18} color="var(--fg-2)" /> 뒤로
                        </button>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12,
                            color: 'var(--fg-5)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>홈</span>
                        <MatIcon name="chevron_right" size={14} color="var(--fg-6)" />
                        <span>투어 상품</span>
                        {cleanName && (
                            <>
                                <MatIcon name="chevron_right" size={14} color="var(--fg-6)" />
                                <span>{cleanName}</span>
                            </>
                        )}
                        <MatIcon name="chevron_right" size={14} color="var(--fg-6)" />
                        <span style={{ color: 'var(--fg-2)', fontWeight: 700 }}>예약</span>
                    </div>
                </div>
            </div>

            {/* Step header + stepper */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--border-subtle)' }}>
                <div
                    style={{
                        maxWidth: CONTENT_WIDTH,
                        margin: '0 auto',
                        padding: '32px 32px 28px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: 'var(--fg-1)',
                            margin: '0 0 4px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h1>
                    <p
                        style={{
                            fontSize: 13,
                            color: 'var(--fg-4)',
                            margin: '0 0 24px',
                        }}
                    >
                        {subtitle}
                    </p>
                    <Stepper step={step} />
                </div>
            </div>

            {/* Body */}
            <div
                style={{
                    maxWidth: CONTENT_WIDTH,
                    margin: '0 auto',
                    padding: '36px 32px 80px',
                }}
            >
                {children}
            </div>
        </div>
    );
}
