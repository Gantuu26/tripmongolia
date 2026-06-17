// 카카오톡 "나에게 보내기"(메모 API) 연동 헬퍼.
// 관리자 본인 카카오 계정으로 예약·견적 알림을 발송한다.
// 토큰은 settings 테이블(key-value)에 저장한다:
//   kakao_refresh_token / kakao_access_token / kakao_access_token_expires_at(epoch ms)

const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const MEMO_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';

export interface KakaoEnv {
    DB: any;
    KAKAO_REST_API_KEY?: string;
    KAKAO_CLIENT_SECRET?: string;
}

async function getSetting(db: any, key: string): Promise<string | null> {
    try {
        const row: any = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
        return row?.value ?? null;
    } catch { return null; }
}

async function setSetting(db: any, key: string, value: string): Promise<void> {
    await db.prepare(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    ).bind(key, value).run();
}

async function delSetting(db: any, key: string): Promise<void> {
    try { await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run(); } catch { /* ignore */ }
}

export function kakaoRedirectUri(origin: string): string {
    return `${origin}/api/kakao/callback`;
}

export function kakaoAuthorizeUrl(env: KakaoEnv, origin: string): string {
    const params = new URLSearchParams({
        client_id: env.KAKAO_REST_API_KEY || '',
        redirect_uri: kakaoRedirectUri(origin),
        response_type: 'code',
        scope: 'talk_message',
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

async function storeTokens(env: KakaoEnv, data: any): Promise<void> {
    if (data.access_token) {
        await setSetting(env.DB, 'kakao_access_token', data.access_token);
        const expMs = Date.now() + (Number(data.expires_in || 21600) - 60) * 1000;
        await setSetting(env.DB, 'kakao_access_token_expires_at', String(expMs));
    }
    // refresh_token은 만료가 임박할 때만 새로 내려오므로, 있을 때마다 갱신 저장
    if (data.refresh_token) await setSetting(env.DB, 'kakao_refresh_token', data.refresh_token);
}

// authorization_code → access/refresh token 발급 + 저장
export async function kakaoExchangeCode(env: KakaoEnv, origin: string, code: string): Promise<void> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.KAKAO_REST_API_KEY || '',
        redirect_uri: kakaoRedirectUri(origin),
        code,
    });
    if (env.KAKAO_CLIENT_SECRET) body.set('client_secret', env.KAKAO_CLIENT_SECRET);

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
    });
    const data: any = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(data.error_description || data.error || 'kakao token exchange failed');
    }
    await storeTokens(env, data);
}

async function refreshAccessToken(env: KakaoEnv): Promise<string | null> {
    const refreshToken = await getSetting(env.DB, 'kakao_refresh_token');
    if (!refreshToken) return null;

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.KAKAO_REST_API_KEY || '',
        refresh_token: refreshToken,
    });
    if (env.KAKAO_CLIENT_SECRET) body.set('client_secret', env.KAKAO_CLIENT_SECRET);

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
    });
    const data: any = await res.json();
    if (!res.ok || !data.access_token) {
        // refresh token 만료/무효 → 저장 토큰 제거(관리자 재연결 유도)
        if (data.error === 'invalid_grant') await kakaoDisconnect(env);
        return null;
    }
    await storeTokens(env, data);
    return data.access_token;
}

async function getValidAccessToken(env: KakaoEnv): Promise<string | null> {
    const token = await getSetting(env.DB, 'kakao_access_token');
    const expStr = await getSetting(env.DB, 'kakao_access_token_expires_at');
    const exp = expStr ? Number(expStr) : 0;
    if (token && exp && Date.now() < exp) return token;
    return await refreshAccessToken(env);
}

export async function kakaoIsConnected(env: KakaoEnv): Promise<boolean> {
    return Boolean(await getSetting(env.DB, 'kakao_refresh_token'));
}

export async function kakaoDisconnect(env: KakaoEnv): Promise<void> {
    await delSetting(env.DB, 'kakao_refresh_token');
    await delSetting(env.DB, 'kakao_access_token');
    await delSetting(env.DB, 'kakao_access_token_expires_at');
}

// 텍스트 메모(나에게 보내기) 1건 발송. 텍스트는 최대 200자.
export async function kakaoSendMemo(env: KakaoEnv, text: string, linkUrl?: string): Promise<{ ok: boolean; error?: string }> {
    const token = await getValidAccessToken(env);
    if (!token) return { ok: false, error: 'not_connected' };

    const url = linkUrl || 'https://tripmongolia.kr/admin';
    const template = {
        object_type: 'text',
        text: text.slice(0, 200),
        link: { web_url: url, mobile_web_url: url },
        button_title: '열기',
    };

    const res = await fetch(MEMO_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: `template_object=${encodeURIComponent(JSON.stringify(template))}`,
    });
    if (!res.ok) {
        const err: any = await res.json().catch(() => ({}));
        return { ok: false, error: err.msg || `HTTP ${res.status}` };
    }
    return { ok: true };
}

// 관리자 알림 — 미설정/미연결이면 조용히 무시, 실패해도 메인 흐름에 영향 없음
export async function notifyAdminKakao(env: KakaoEnv, text: string, linkUrl?: string): Promise<void> {
    try {
        if (!env.KAKAO_REST_API_KEY) return;
        if (!(await kakaoIsConnected(env))) return;
        await kakaoSendMemo(env, text, linkUrl);
    } catch (e) {
        console.error('[kakao] notifyAdminKakao failed', e);
    }
}
