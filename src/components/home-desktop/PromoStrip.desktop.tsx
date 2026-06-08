import { useNavigate } from 'react-router-dom';
import { MatIcon } from '../desktop-primitives/MatIcon';

interface PromoStripProps {
    contentWidth?: number;
}

export function PromoStripDesktop({ contentWidth = 1280 }: PromoStripProps) {
    const navigate = useNavigate();

    const onConsult = () => {
        if (typeof window.openChannelTalk === 'function') {
            window.openChannelTalk();
        } else {
            navigate('/custom-estimate');
        }
    };

    return (
        <section style={{ maxWidth: contentWidth, margin: '72px auto 0', padding: '0 32px' }}>
            <div
                style={{
                    position: 'relative',
                    borderRadius: 32,
                    overflow: 'hidden',
                    background: 'linear-gradient(120deg, #ff385c 0%, #e00b41 50%, #881337 100%)',
                    boxShadow: '0 20px 50px -16px rgba(255, 56, 92,0.4)',
                    padding: '56px 64px',
                    color: '#fff',
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    gap: 32,
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        right: -80,
                        top: -80,
                        width: 320,
                        height: 320,
                        borderRadius: 999,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: -60,
                        bottom: -100,
                        width: 260,
                        height: 260,
                        borderRadius: 999,
                        background: 'radial-gradient(circle, rgba(94,234,212,0.18) 0%, transparent 70%)',
                    }}
                />

                <div style={{ position: 'relative' }}>
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            color: '#fda4af',
                            textTransform: 'uppercase',
                            marginBottom: 12,
                        }}
                    >
                        Custom Tour Request
                    </div>
                    <h2 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.25, margin: 0, letterSpacing: '-0.02em' }}>
                        당신만을 위한
                        <br />
                        특별한 플랜을 제안해 드립니다
                    </h2>
                    <p style={{ fontSize: 15, lineHeight: 1.7, marginTop: 18, color: 'rgba(255,255,255,0.85)', maxWidth: 480 }}>
                        인원·기간·예산·가고 싶은 장소를 알려 주세요. 한국어 스태프가 24시간 이내에 최적의 플랜을 견적해 드립니다.
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                        <button
                            type="button"
                            onClick={() => navigate('/custom-estimate')}
                            style={{
                                padding: '16px 28px',
                                background: '#fff',
                                color: 'var(--primary-dark)',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            1분 만에 요청하기 <MatIcon name="arrow_forward" size={18} color="var(--primary-dark)" />
                        </button>
                        <button
                            type="button"
                            onClick={onConsult}
                            style={{
                                padding: '16px 28px',
                                background: 'rgba(255,255,255,0.12)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: 999,
                                backdropFilter: 'blur(8px)',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <MatIcon name="chat" size={18} color="#fff" />
                            상담하기
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                        { n: '24h', t: '이내 답변' },
                        { n: '0₩', t: '견적 무료' },
                        { n: '150+', t: '맞춤 플랜 실적' },
                        { n: '★4.9', t: '평균 후기 평점' },
                    ].map((s) => (
                        <div
                            key={s.t}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.16)',
                                backdropFilter: 'blur(8px)',
                                padding: '20px 22px',
                                borderRadius: 16,
                            }}
                        >
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{s.n}</div>
                            <div style={{ fontSize: 12, color: '#a7f3d0', marginTop: 4 }}>{s.t}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
