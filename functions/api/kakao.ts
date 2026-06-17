import { Hono } from 'hono';
import { requireAdmin } from '../lib/adminAuth';
import {
    kakaoAuthorizeUrl,
    kakaoExchangeCode,
    kakaoIsConnected,
    kakaoDisconnect,
    kakaoSendMemo,
} from '../lib/kakao';

// 카카오톡 "나에게 보내기" 연동 — 관리자 전용.
// 예약·견적 알림을 관리자 본인 카카오로 받기 위한 연결/상태/테스트/해제 엔드포인트.
const app = new Hono<{ Bindings: any }>();

// 연결 시작: 관리자를 카카오 동의 화면(talk_message)으로 리디렉션
app.get('/connect', requireAdmin, (c) => {
    if (!c.env.KAKAO_REST_API_KEY) {
        return c.text('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다. Cloudflare에 먼저 등록하세요.', 500);
    }
    const origin = new URL(c.req.url).origin;
    return c.redirect(kakaoAuthorizeUrl(c.env, origin));
});

// 콜백: code → 토큰 발급·저장 후 관리자 설정 페이지로 복귀
app.get('/callback', requireAdmin, async (c) => {
    const code = c.req.query('code');
    const error = c.req.query('error');
    if (error || !code) return c.redirect('/admin/payment?kakao=error');
    try {
        const origin = new URL(c.req.url).origin;
        await kakaoExchangeCode(c.env, origin, code);
        return c.redirect('/admin/payment?kakao=connected');
    } catch (e: any) {
        console.error('[kakao] callback failed', e);
        return c.redirect('/admin/payment?kakao=error');
    }
});

// 연결 상태
app.get('/status', requireAdmin, async (c) => {
    return c.json({
        connected: await kakaoIsConnected(c.env),
        configured: Boolean(c.env.KAKAO_REST_API_KEY),
    });
});

// 테스트 발송
app.post('/test', requireAdmin, async (c) => {
    const r = await kakaoSendMemo(
        c.env,
        '✅ Trip Mongolia 알림 테스트입니다. 카카오 연결이 정상입니다.',
        'https://tripmongolia.kr/admin'
    );
    if (!r.ok) return c.json({ success: false, error: r.error }, 400);
    return c.json({ success: true });
});

// 연결 해제
app.post('/disconnect', requireAdmin, async (c) => {
    await kakaoDisconnect(c.env);
    return c.json({ success: true });
});

export default app;
