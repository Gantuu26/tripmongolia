import { Hono } from 'hono';

interface Env {
    DB: any;
    RESEND_API_KEY: string;
    ADMIN_EMAIL: string;
}

const app = new Hono<{ Bindings: Env }>();

// GET /api/tour-guides
app.get('/', async (c) => {
    const db = c.env.DB;
    try {
        const result = await db.prepare('SELECT * FROM guides ORDER BY created_at DESC').all();
        return c.json(result.results);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/tour-guides/apply (public — no auth required)
app.post('/apply', async (c) => {
    const data = await c.req.json();
    const db = c.env.DB;
    const id = crypto.randomUUID();

    if (!data.name || !data.phone) {
        return c.json({ error: 'name and phone are required' }, 400);
    }

    try {
        await db.prepare(
            `INSERT INTO guides (id, name, bio, phone, languages, specialties, image, experience_years, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
        ).bind(
            id,
            String(data.name),
            String(data.bio || ''),
            String(data.phone),
            JSON.stringify(data.languages || []),
            JSON.stringify(data.specialties || []),
            String(data.image || ''),
            Number(data.experience_years || 0),
        ).run();

        // Admin notification email
        if (c.env.RESEND_API_KEY) {
            const adminEmail = c.env.ADMIN_EMAIL || 'ts.dejidlala@gmail.com';
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'Trip Mongolia <noreply@tripmongolia.kr>',
                    reply_to: 'ts.dejidlala@gmail.com',
                    to: [adminEmail],
                    subject: `[가이드 지원] ${data.name} 님`,
                    html: `<p>새 가이드 지원이 접수되었습니다.</p>
                           <p><strong>이름:</strong> ${data.name}</p>
                           <p><strong>전화:</strong> ${data.phone}</p>
                           <p><strong>언어:</strong> ${(data.languages || []).join(', ')}</p>
                           <p><strong>전문 분야:</strong> ${(data.specialties || []).join(', ')}</p>
                           <p><a href="https://tripmongolia.kr/admin/guides">관리자 화면에서 확인하기</a></p>`,
                }),
            }).catch(() => {});
        }

        return c.json({ success: true, id });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/tour-guides (admin create)
app.post('/', async (c) => {
    const data = await c.req.json();
    const db = c.env.DB;
    const id = data.id || crypto.randomUUID();
    try {
        await db.prepare(
            `INSERT INTO guides (id, name, bio, phone, languages, specialties, image, experience_years, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`
        ).bind(
            id,
            String(data.name || ''),
            String(data.bio || ''),
            String(data.phone || ''),
            JSON.stringify(data.languages || []),
            JSON.stringify(data.specialties || []),
            String(data.image || ''),
            Number(data.experience_years || 0),
        ).run();
        return c.json({ id, ...data });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// PUT /api/tour-guides/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    const db = c.env.DB;
    try {
        await db.prepare(
            `UPDATE guides SET name=?, bio=?, phone=?, languages=?, specialties=?, image=?, experience_years=?, status=? WHERE id=?`
        ).bind(
            String(data.name || ''),
            String(data.bio || ''),
            String(data.phone || ''),
            JSON.stringify(data.languages || []),
            JSON.stringify(data.specialties || []),
            String(data.image || ''),
            Number(data.experience_years || 0),
            String(data.status || 'active'),
            id
        ).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/tour-guides/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const db = c.env.DB;
    try {
        await db.prepare('DELETE FROM guides WHERE id=?').bind(id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;