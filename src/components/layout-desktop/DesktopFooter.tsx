import { useNavigate } from 'react-router-dom';
import logoSquare from '../../assets/new_logo_2026.png';
import { MatIcon } from '../desktop-primitives/MatIcon';

interface DesktopFooterProps {
    contentWidth?: number;
}

interface FooterLink {
    label: string;
    path?: string;
    onClick?: () => void;
}

export function DesktopFooter({ contentWidth = 1280 }: DesktopFooterProps) {
    const navigate = useNavigate();

    const onConsult = () => {
        if (typeof window.openChannelTalk === 'function') {
            window.openChannelTalk();
        } else {
            navigate('/custom-estimate');
        }
    };

    const cols: { h: string; items: FooterLink[] }[] = [
        {
            h: '서비스',
            items: [
                { label: '몽골여행 가이드', path: '/travel-guide' },
                { label: '몽골투어 상품 목록', path: '/products' },
                { label: '몽골 승마여행', path: '/category/horse-riding-tour' },
                { label: '고비사막 투어', path: '/category/gobi-desert' },
                { label: '동행자 찾기', path: '/travel-mates' },
                { label: '견적 요청', path: '/custom-estimate' },
            ],
        },
        {
            h: '이용 안내',
            items: [
                { label: '예약 절차', path: '/about' },
                { label: '자주 묻는 질문 (FAQ)', path: '/faq' },
                { label: '이용약관', path: '/terms-of-service' },
                { label: '개인정보 처리방침', path: '/privacy-policy' },
                { label: '예약 현황 확인', path: '/reservation-status' },
            ],
        },
        {
            h: '회사 정보',
            items: [
                { label: '회사 소개', path: '/about' },
                { label: '가이드 모집', path: '/guide-apply' },
                { label: '고객 리뷰', path: '/reviews' },
                { label: '마이페이지', path: '/mypage' },
                { label: '문의하기', onClick: onConsult },
            ],
        },
    ];

    return (
        <footer style={{ background: 'var(--bg-muted)', borderTop: '1px solid var(--border-subtle)', color: 'var(--fg-4)' }}>
            {/* CTA strip */}
            <div style={{ background: 'var(--fg-1)', color: '#cbd5e1' }}>
                <div
                    style={{
                        maxWidth: contentWidth,
                        margin: '0 auto',
                        padding: '36px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 24,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                color: '#fda4af',
                                textTransform: 'uppercase',
                                marginBottom: 6,
                            }}
                        >
                            Custom Tour
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                            당신만을 위한 특별한 플랜을 1분 만에 요청하세요
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                            한국어 스태프가 24시간 이내에 답변드립니다. 견적은 무료입니다.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => navigate('/custom-estimate')}
                            style={{
                                padding: '14px 22px',
                                background: '#ff385c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <MatIcon name="edit_note" size={18} color="#fff" /> 견적 요청
                        </button>
                        <button
                            type="button"
                            onClick={onConsult}
                            style={{
                                padding: '14px 22px',
                                background: 'transparent',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <MatIcon name="chat" size={18} color="#fff" /> 상담
                        </button>
                    </div>
                </div>
            </div>

            <div
                style={{
                    maxWidth: contentWidth,
                    margin: '0 auto',
                    padding: '56px 32px 32px',
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
                    gap: 56,
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <img src={logoSquare} alt="" style={{ height: 44, width: 44, objectFit: 'contain' }} />
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>Trip Mongolia</div>
                            <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 2 }}>Trip Mongolia</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.75 }}>
                        몽골여행·몽골투어 전문 현지 여행사입니다. 한국어가 능통한 전문 가이드가 동행하여 안심하고 안전한 여행을 제안해 드립니다.
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                        {[
                            { icon: 'photo_camera', label: 'Instagram', href: 'https://instagram.com' },
                            { icon: 'chat', label: 'LINE', onClick: onConsult },
                            { icon: 'mail', label: 'Email', href: 'mailto:ts.dejidlala@gmail.com' },
                            { icon: 'phone', label: 'Phone', href: 'tel:+97691877227' },
                        ].map((s) =>
                            s.href ? (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target={s.href.startsWith('http') ? '_blank' : undefined}
                                    rel={s.href.startsWith('http') ? 'noreferrer' : undefined}
                                    style={socialBtn}
                                    aria-label={s.label}
                                >
                                    <MatIcon name={s.icon} size={18} color="var(--fg-3)" />
                                </a>
                            ) : (
                                <button key={s.label} type="button" onClick={s.onClick} style={socialBtn} aria-label={s.label}>
                                    <MatIcon name={s.icon} size={18} color="var(--fg-3)" />
                                </button>
                            )
                        )}
                    </div>
                </div>
                {cols.map((c) => (
                    <div key={c.h}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 14, letterSpacing: '0.02em' }}>{c.h}</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {c.items.map((item) => (
                                <li key={item.label}>
                                    <button
                                        type="button"
                                        onClick={item.onClick ? item.onClick : () => item.path && navigate(item.path)}
                                        style={footerLinkBtn}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ff385c')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-4)')}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: contentWidth, margin: '0 auto', padding: '0 32px 32px' }}>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, fontSize: 11, color: 'var(--fg-5)', lineHeight: 1.8 }}>
                    <div style={{ marginBottom: 16 }}>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--fg-3)', marginBottom: 6 }}>[몽골 본사]</div>
                            <div>상호: Trip Mongolia | 대표자: Tsendee Tserendejid</div>
                            <div>사업자등록번호: 9011825028</div>
                            <div>전화: +976 9187 7227</div>
                            <div>소재지: 몽골 울란바토르 13구역 25동 남양주거리 170-18호</div>
                        </div>
                    </div>
                    <div
                        style={{
                            borderTop: '1px solid var(--border)',
                            paddingTop: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div>© 2026 Trip Mongolia. All rights reserved.</div>
                        <div style={{ display: 'flex', gap: 18 }}>
                            <button type="button" onClick={() => navigate('/about')} style={legalLinkBtn}>
                                회사 소개
                            </button>
                            <button type="button" onClick={() => navigate('/terms-of-service')} style={legalLinkBtn}>
                                이용약관
                            </button>
                            <button type="button" onClick={() => navigate('/privacy-policy')} style={legalLinkBtn}>
                                개인정보 처리방침
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const socialBtn = {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    padding: 0,
} as const;

const footerLinkBtn = {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 13,
    color: 'var(--fg-4)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'color 150ms',
} as const;

const legalLinkBtn = {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 11,
    color: 'var(--fg-5)',
    cursor: 'pointer',
    fontFamily: 'inherit',
} as const;
