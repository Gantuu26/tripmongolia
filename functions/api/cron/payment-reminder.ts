import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { reservations } from '../../../src/db/schema/reservations';
import { eq, and, lt } from 'drizzle-orm';
import { sendEmail, baseLayout } from '../../lib/mailer';

interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    ADMIN_EMAIL: string;
    CRON_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

function tplPaymentReminder(data: { customerName: string; reservationNumber: string; productName: string; depositAmount: number }) {
    return baseLayout(`
<div class="header">
  <h1>🐴 Trip Mongolia</h1>
  <p>예약금 입금 안내</p>
</div>
<div class="body">
  <p class="greeting">${data.customerName} 님</p>
  <p>예약해 주셔서 감사합니다.<br>아직 예약금 입금이 확인되지 않았습니다.</p>
  <div class="card">
    <div class="card-row"><span class="label">예약번호</span><span class="value" style="color:#E00B41;font-size:18px;font-weight:800;">${data.reservationNumber}</span></div>
    <div class="card-row"><span class="label">투어명</span><span class="value">${data.productName}</span></div>
    <div class="card-row"><span class="label">예약금</span><span class="value" style="color:#E00B41;">₩${data.depositAmount.toLocaleString('ko-KR')}</span></div>
  </div>
  <div class="alert">
    <strong>⚠️ 입금 기한이 다가오고 있습니다</strong><br><br>
    안내해 드린 계좌로 <strong>예약금을 입금</strong>해 주세요(무통장입금).<br>
    입금이 확인되면 현지 수배를 시작합니다.<br><br>
    계좌 정보를 찾지 못하시면 아래 이메일로 문의해 주세요.
  </div>
  <p style="font-size:14px;color:#6b5560;">
    문의: <a href="mailto:ts.dejidlala@gmail.com" style="color:#E00B41;">ts.dejidlala@gmail.com</a>
  </p>
  <a class="btn" href="https://tripmongolia.kr/mypage/reservations">예약 확인하기</a>
</div>
<div class="footer">
  <a href="https://tripmongolia.kr">tripmongolia.kr</a> |
  <a href="mailto:ts.dejidlala@gmail.com">ts.dejidlala@gmail.com</a>
</div>`);
}

// POST /api/cron/payment-reminder
// Called by external cron service (e.g. cron-job.org) with Authorization: Bearer <CRON_SECRET>
app.post('/', async (c) => {
    const auth = c.req.header('Authorization');
    if (!c.env.CRON_SECRET || auth !== `Bearer ${c.env.CRON_SECRET}`) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = drizzle(c.env.DB);
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const pending = await db
        .select()
        .from(reservations)
        .where(and(eq(reservations.status, 'pending_payment'), lt(reservations.createdAt, cutoff)))
        .all();

    let sent = 0;
    const errors: string[] = [];

    for (const r of pending) {
        if (!r.customerEmail) continue;

        const history: any[] = r.history ? JSON.parse(r.history) : [];
        if (history.some((h) => h.type === 'reminder_sent')) continue;

        try {
            await sendEmail(
                c.env.RESEND_API_KEY,
                r.customerEmail,
                `[예약금 입금 안내] ${r.productName || '투어'} 예약금 확인 부탁드립니다 | Trip Mongolia`,
                tplPaymentReminder({
                    customerName: r.customerName || '고객',
                    reservationNumber: r.reservationNumber || r.id.slice(0, 8).toUpperCase(),
                    productName: r.productName || '투어',
                    depositAmount: r.depositAmount || 0,
                }),
            );

            history.push({ type: 'reminder_sent', date: new Date().toISOString() });
            await db
                .update(reservations)
                .set({ history: JSON.stringify(history) })
                .where(eq(reservations.id, r.id))
                .run();

            sent++;
        } catch (e: any) {
            errors.push(`${r.id}: ${e.message}`);
        }
    }

    return c.json({ success: true, sent, skipped: pending.length - sent - errors.length, errors });
});

export default app;