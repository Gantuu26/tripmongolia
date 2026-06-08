import { MatIcon } from '../desktop-primitives/MatIcon';
import { SectionHeader } from '../desktop-primitives/SectionHeader';

interface TrustSectionProps {
    contentWidth?: number;
}

const ITEMS = [
    { n: '01', i: 'translate', t: '한국어 완벽 대응', d: '한국어가 능통한 전문 가이드가 동행하여 언어의 장벽 없이 안심하고 즐기실 수 있습니다.' },
    { n: '02', i: 'support_agent', t: '24시간 지원', d: '여행 중에도 한국어로 24시간 대응. 어려운 일이 있으시면 바로 연락 주세요.' },
    { n: '03', i: 'restaurant', t: '한국인 입맛에 맞춘 식사', d: '한국인의 입맛에 맞춘 메뉴. 식품 알레르기도 개별 대응해 드립니다.' },
    { n: '04', i: 'directions_car', t: '안전 제일의 차량 관리', d: '정비된 차량과 경험이 풍부한 운전기사가 안전한 여행을 약속드립니다.' },
];

export function TrustSectionDesktop({ contentWidth = 1280 }: TrustSectionProps) {
    return (
        <section style={{ background: '#fff', padding: '72px 0 24px', marginTop: 72 }}>
            <div style={{ maxWidth: contentWidth, margin: '0 auto', padding: '0 32px' }}>
                <SectionHeader
                    eyebrow="Why Trip Mongolia"
                    title="Trip Mongolia가 선택받는 4가지 이유"
                    subtitle="몽골 현지 여행사이기에 가능한, 확실한 지원과 안심의 품질."
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {ITEMS.map((it) => (
                        <div
                            key={it.n}
                            style={{
                                padding: '32px 28px',
                                background: 'var(--bg-muted)',
                                borderRadius: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 18,
                                minHeight: 240,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        background: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <MatIcon name={it.i} size={28} color="#ff385c" />
                                </div>
                                <div
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: '#ff385c',
                                        opacity: 0.5,
                                        fontFamily: 'ui-monospace, Menlo, monospace',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {it.n}
                                </div>
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: 'var(--fg-1)',
                                        marginBottom: 8,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {it.t}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--fg-4)', lineHeight: 1.7 }}>{it.d}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
