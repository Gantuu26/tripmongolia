import { D1Database, R2Bucket } from '@cloudflare/workers-types';

declare global {
    interface Env {
        DB: D1Database;
        BUCKET: R2Bucket;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        ENVIRONMENT: string;
        RESEND_API_KEY: string;
        ADMIN_EMAIL: string;
        // 카카오톡 "나에게 보내기"(메모 API) 알림용 — REST API 키 / (선택)Client Secret
        KAKAO_REST_API_KEY: string;
        KAKAO_CLIENT_SECRET: string;
    }
}
