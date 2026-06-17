import { Hono } from 'hono';
import { createNotification } from './index';
import { notifyAdminKakao } from '../../lib/kakao';

interface Env {
    DB: any;
    RESEND_API_KEY: string;
    ADMIN_EMAIL: string;
}

const app = new Hono<{ Bindings: Env }>();

const FROM = 'Trip Mongolia <noreply@tripmongolia.kr>';
const REPLY_TO = 'ts.dejidlala@gmail.com';
const SITE_URL = 'https://tripmongolia.kr';
const CONTACT_EMAIL = 'ts.dejidlala@gmail.com';
const BRAND = 'Trip Mongolia';

async function sendEmail(apiKey: string, to: string | string[], subject: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM,
            reply_to: REPLY_TO,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${err}`);
    }

    return res.json();
}

function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function money(value: unknown) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') return `₩${value.toLocaleString('ko-KR')}`;
    return escapeHtml(value);
}

function fieldRows(rows: Array<[string, unknown]>) {
    return rows
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([label, value]) => `
            <tr>
                <th>${escapeHtml(label)}</th>
                <td>${escapeHtml(value)}</td>
            </tr>
        `)
        .join('');
}

function cta(label: string, url: string) {
    return `
        <div class="cta-wrap">
            <a class="btn" href="${escapeHtml(url)}">${escapeHtml(label)}</a>
            <p class="url-note">버튼이 열리지 않으면 아래 주소를 복사해 주세요:<br><span>${escapeHtml(url)}</span></p>
        </div>
    `;
}

function baseLayout(preheader: string, content: string) {
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${BRAND}</title>
<style>
  body{margin:0;padding:0;background:#f6f7f8;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;line-height:1.65;}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;}
  .wrap{max-width:640px;margin:28px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(224,11,65,.10);}
  .header{background:#E00B41;padding:30px 34px;color:#fff;}
  .brand{font-size:13px;letter-spacing:.18em;text-transform:uppercase;opacity:.85;margin:0 0 8px;}
  .header h1{font-size:22px;line-height:1.35;margin:0;font-weight:800;}
  .body{padding:34px;}
  .lead{font-size:16px;font-weight:700;margin:0 0 14px;color:#111827;}
  p{font-size:14px;margin:0 0 16px;color:#475467;}
  .notice{background:#fff1f3;border:1px solid #ffd9e0;border-radius:14px;padding:16px 18px;margin:22px 0;color:#7a1230;font-size:14px;}
  .panel{border:1px solid #eceef1;border-radius:14px;overflow:hidden;margin:22px 0;background:#fcfcfd;}
  .panel-title{margin:0;padding:13px 16px;background:#fff5f7;color:#E00B41;font-size:13px;font-weight:800;letter-spacing:.02em;}
  table{width:100%;border-collapse:collapse;}
  th,td{font-size:14px;padding:12px 16px;border-top:1px solid #eceef1;vertical-align:top;}
  th{width:34%;text-align:left;color:#7a8694;font-weight:700;background:#fcfcfd;}
  td{color:#1f2937;font-weight:650;text-align:right;}
  .steps{padding-left:18px;margin:10px 0 0;color:#475467;font-size:14px;}
  .steps li{margin:6px 0;}
  .cta-wrap{text-align:center;margin:28px 0 20px;}
  .btn{display:inline-block;background:#E00B41;color:#fff!important;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:800;}
  .url-note{font-size:12px;color:#98a2b3;margin-top:10px;word-break:break-all;}
  .url-note span{color:#E00B41;}
  .footer{background:#f9fafb;padding:22px 34px;text-align:center;font-size:12px;color:#7a8694;}
  .footer a{color:#E00B41;text-decoration:none;font-weight:700;}
  @media(max-width:680px){.wrap{margin:0;border-radius:0}.header,.body,.footer{padding-left:22px;padding-right:22px}th,td{display:block;width:auto;text-align:left}td{padding-top:0;border-top:none}th{padding-bottom:4px}}
</style>
</head>
<body>
<div class="preheader">${escapeHtml(preheader)}</div>
<div class="wrap">${content}</div>
</body>
</html>`;
}

function footer() {
    return `
        <div class="footer">
            ${BRAND} · 몽골 현지 여행사<br>
            <a href="${SITE_URL}">tripmongolia.kr</a> · <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
        </div>
    `;
}

function tplReservationRequested(data: any) {
    return baseLayout('예약 요청이 접수되었습니다. 예약금 입금 방법을 안내해 드립니다.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>예약 요청이 접수되었습니다</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>${BRAND}를 이용해 주셔서 진심으로 감사합니다. 담당자가 내용을 확인한 뒤, 예약금 입금 방법과 이후 진행 절차를 안내해 드립니다.</p>
  <div class="panel">
    <p class="panel-title">예약 내용</p>
    <table>${fieldRows([
        ['예약번호', data.reservationId || data.reservationNumber],
        ['투어명', data.productName],
        ['예약금', money(data.depositAmount)],
        ['현지 결제 예정액', money(data.localAmount)],
    ])}</table>
  </div>
  <div class="notice">
    <strong>이후 진행 안내</strong>
    <ol class="steps">
      <li>안내해 드리는 계좌로 예약금을 입금해 주세요(무통장입금).</li>
      <li>예약금 입금이 확인되면 현지 수배를 시작합니다.</li>
      <li>확정 일정표, 계약서, 가이드 정보를 순서대로 안내해 드립니다.</li>
    </ol>
  </div>
  ${cta('예약 현황 확인하기', `${SITE_URL}/mypage/reservations${data.reservationDbId ? `/${data.reservationDbId}` : ''}`)}
</div>
${footer()}`);
}

function tplAdminNewReservation(data: any) {
    return baseLayout('새 예약이 접수되었습니다. 관리자 화면에서 확인해 주세요.', `
<div class="header">
  <p class="brand">Admin Notice</p>
  <h1>새 예약이 접수되었습니다</h1>
</div>
<div class="body">
  <p>관리자 화면에서 예약 내용을 확인하고, 입금 안내와 수배 상태를 업데이트해 주세요.</p>
  <div class="panel">
    <p class="panel-title">예약 정보</p>
    <table>${fieldRows([
        ['예약번호', data.reservationId || data.reservationNumber],
        ['고객명', data.customerName],
        ['투어명', data.productName],
        ['이메일', data.customerEmail],
        ['전화번호', data.customerPhone],
        ['예약금', money(data.depositAmount)],
    ])}</table>
  </div>
  ${cta('관리자 화면 열기', `${SITE_URL}/admin/reservations`)}
</div>
${footer()}`);
}

function tplQuoteReceived(data: any) {
    return baseLayout('견적 요청이 접수되었습니다. 담당자가 연락드립니다.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>견적 요청이 접수되었습니다</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>요청하신 내용을 확인한 뒤, 담당자가 보통 24시간 이내에 연락드립니다. 일정·인원·예산에 맞춰 최적의 플랜을 제안해 드립니다.</p>
  <div class="panel">
    <p class="panel-title">상담 내용</p>
    <table>${fieldRows([
        ['내용', data.productName || data.destination || '맞춤 여행 상담'],
    ])}</table>
  </div>
  ${cta('마이페이지 확인하기', `${SITE_URL}/mypage/estimates`)}
</div>
${footer()}`);
}

function tplAdminNewQuote(data: any) {
    return baseLayout('새 견적 상담이 접수되었습니다.', `
<div class="header">
  <p class="brand">Admin Notice</p>
  <h1>새 견적 상담이 접수되었습니다</h1>
</div>
<div class="body">
  <div class="panel">
    <p class="panel-title">상담자 정보</p>
    <table>${fieldRows([
        ['고객명', data.customerName],
        ['이메일', data.customerEmail],
        ['전화번호', data.customerPhone],
        ['내용', data.productName || data.destination],
    ])}</table>
  </div>
  ${cta('견적 관리 열기', `${SITE_URL}/admin/quotes`)}
</div>
${footer()}`);
}

function tplGuideAssigned(data: any) {
    return baseLayout('담당 가이드와 숙소 정보를 안내해 드립니다.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>담당 가이드·숙소 안내</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>여행을 함께할 담당 가이드와 현지 수배 정보가 확정되어 안내해 드립니다. 출발 전 확인할 사항이 있으면 담당자가 추가로 연락드립니다.</p>
  <div class="panel">
    <p class="panel-title">담당 정보</p>
    <table>${fieldRows([
        ['투어명', data.productName],
        ['담당 가이드', data.guideName],
        ['가이드 연락처', data.guidePhone],
    ])}</table>
  </div>
  ${cta('예약 상세 확인하기', `${SITE_URL}/mypage/reservations${data.reservationDbId ? `/${data.reservationDbId}` : ''}`)}
</div>
${footer()}`);
}

function tplEstimateCompleted(data: any) {
    return baseLayout('견적이 완성되었습니다. 내용을 확인해 주세요.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>견적이 완성되었습니다</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>요청하신 내용에 맞춘 몽골 여행 플랜 견적을 준비했습니다. 내용을 확인하시고, 궁금한 점이나 조정을 원하시면 편하게 회신해 주세요.</p>
  <div class="panel">
    <p class="panel-title">견적 개요</p>
    <table>${fieldRows([
        ['목적지', data.destination],
        ['합계 금액', money(data.totalAmount)],
    ])}</table>
  </div>
  ${data.adminNote ? `<div class="notice"><strong>담당자 메모</strong><br>${escapeHtml(data.adminNote).replace(/\n/g, '<br>')}</div>` : ''}
  ${cta('견적·여행 일정 확인하기', `${SITE_URL}/estimate/${data.quoteId || data.reservationId || ''}`)}
  ${data.estimateUrl ? `<p style="text-align:center;margin-top:8px"><a href="${data.estimateUrl}" style="color:#E00B41;font-size:13px">외부 견적서(PDF·자료) 보기</a></p>` : ''}
</div>
${footer()}`);
}

function tplContractReady(data: any) {
    const url = data.contractUrl || `${SITE_URL}/documents/contract/${data.reservationId || ''}`;
    return baseLayout('여행 계약서를 준비했습니다. 내용을 확인해 주세요.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>여행 계약서 안내</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>여행 계약서를 준비했습니다. 여행 조건, 여행자 정보, 결제 내용을 확인해 주세요. 수정이 필요하시면 이 메일로 회신해 주세요.</p>
  <div class="panel">
    <p class="panel-title">계약서 정보</p>
    <table>${fieldRows([
        ['투어명', data.productName],
        ['여행 기간', data.travelDates],
        ['예약번호', data.reservationNumber || data.reservationId],
    ])}</table>
  </div>
  <div class="notice">예약금 입금이 확인되면 계약 내용에 따라 현지 수배를 진행합니다.</div>
  ${cta('계약서 확인하기', url)}
</div>
${footer()}`);
}

function tplItineraryReady(data: any) {
    const url = data.itineraryUrl || `${SITE_URL}/documents/itinerary/${data.reservationId || ''}`;
    return baseLayout('확정 일정표를 준비했습니다. 집합 시간·숙소·일정을 확인해 주세요.', `
<div class="header">
  <p class="brand">${BRAND}</p>
  <h1>확정 일정표 안내</h1>
</div>
<div class="body">
  <p class="lead">${escapeHtml(data.customerName || '고객')} 님</p>
  <p>여행의 확정 일정표를 준비했습니다. 일자별 일정, 숙소, 담당 가이드 정보를 확인해 주세요.</p>
  <div class="panel">
    <p class="panel-title">여행 정보</p>
    <table>${fieldRows([
        ['투어명', data.productName],
        ['여행 기간', data.travelDates],
        ['예약번호', data.reservationNumber || data.reservationId],
    ])}</table>
  </div>
  <div class="notice">
    <strong>출발 전 확인해 주세요</strong>
    <ol class="steps">
      <li>집합 시간, 항공 정보, 숙소에 오류가 없는지 확인해 주세요.</li>
      <li>날씨나 도로 상황에 따라 현지에서 안전을 우선해 순서가 조정될 수 있습니다.</li>
      <li>변경 희망이나 궁금한 점은 출발 전 담당자에게 연락해 주세요.</li>
    </ol>
  </div>
  ${cta('일정표 확인하기', url)}
</div>
${footer()}`);
}

app.post('/', async (c) => {
    try {
        const { to, type, data = {} } = await c.req.json();
        const apiKey = c.env.RESEND_API_KEY;
        const adminEmail = c.env.ADMIN_EMAIL || 'ts.dejidlala@gmail.com';

        // 이메일 키가 없어도 인앱 알림은 계속 생성해야 하므로 여기서 중단하지 않음
        if (!apiKey) {
            console.error('RESEND_API_KEY not set — skipping email, in-app notification만 생성');
        }

        let subject = '';
        let html = '';
        let adminSubject = '';
        let adminHtml = '';

        switch (type) {
            case 'RESERVATION_REQUESTED':
                subject = `[예약 접수] ${data.productName || '몽골 여행'} 신청 감사합니다 | ${BRAND}`;
                html = tplReservationRequested(data);
                adminSubject = `[신규 예약] ${data.customerName || '고객'} - ${data.productName || '투어'}`;
                adminHtml = tplAdminNewReservation({ ...data, customerEmail: to });
                break;

            case 'QUOTE_RECEIVED':
                subject = `[견적 접수] 상담 감사합니다 | ${BRAND}`;
                html = tplQuoteReceived(data);
                adminSubject = `[신규 견적] ${data.customerName || '고객'}`;
                adminHtml = tplAdminNewQuote({ ...data, customerEmail: to });
                break;

            case 'GUIDE_ASSIGNED':
                subject = `[가이드 배정] ${data.productName || '여행'} 현지 안내 | ${BRAND}`;
                html = tplGuideAssigned(data);
                break;

            case 'ESTIMATE_COMPLETED':
                subject = `[견적 완성] 몽골 여행 플랜을 확인해 주세요 | ${BRAND}`;
                html = tplEstimateCompleted(data);
                break;

            case 'ITINERARY_READY':
                subject = `[확정 일정표] ${data.productName || '여행'} 안내 | ${BRAND}`;
                html = tplItineraryReady(data);
                break;

            case 'CONTRACT_READY':
                subject = `[여행 계약서] ${data.productName || '여행'} 안내 | ${BRAND}`;
                html = tplContractReady(data);
                break;

            default:
                return c.json({ error: `Unknown email type: ${type}` }, 400);
        }

        if (apiKey) {
            try {
                await sendEmail(apiKey, to, subject, html);
            } catch (mailErr) {
                console.error('Email send failed (continuing to create in-app notification):', mailErr);
            }
        }

        const targetUserId = data.userId || data.user_id;
        if (targetUserId && c.env.DB) {
            const inAppTitle = subject.replace(new RegExp(`\\s*\\|\\s*${BRAND}\\s*$`), '');
            const inAppMessage =
                type === 'ITINERARY_READY' ? '확정 일정표를 준비했습니다. 내용을 확인해 주세요.' :
                type === 'CONTRACT_READY' ? '여행 계약서를 준비했습니다. 내용을 확인해 주세요.' :
                type === 'GUIDE_ASSIGNED' ? '담당 가이드와 현지 안내 정보를 전달했습니다.' :
                type === 'RESERVATION_REQUESTED' ? '예약 요청이 접수되었습니다.' :
                type === 'QUOTE_RECEIVED' ? '견적 요청이 접수되었습니다.' :
                type === 'ESTIMATE_COMPLETED' ? '견적이 완성되었습니다. 내용을 확인해 주세요.' : '';
            const link =
                type === 'ITINERARY_READY' ? (data.reservationDbId ? `/mypage/reservations/${data.reservationDbId}` : `/documents/itinerary/${data.reservationId || ''}`) :
                type === 'CONTRACT_READY' ? (data.reservationDbId ? `/mypage/reservations/${data.reservationDbId}` : `/documents/contract/${data.reservationId || ''}`) :
                type === 'ESTIMATE_COMPLETED' ? `/estimate/${data.quoteId || data.reservationId || ''}` :
                type === 'GUIDE_ASSIGNED' || type === 'RESERVATION_REQUESTED' ? (data.reservationDbId ? `/mypage/reservations/${data.reservationDbId}` : '/mypage/reservations') :
                type === 'QUOTE_RECEIVED' ? '/mypage/estimates' : undefined;

            await createNotification(c.env.DB, {
                userId: targetUserId,
                type: 'reservation',
                title: inAppTitle,
                message: inAppMessage,
                link,
            });
        }

        if (adminSubject && adminHtml && apiKey) {
            try {
                await sendEmail(apiKey, adminEmail, adminSubject, adminHtml);
            } catch (adminErr) {
                console.error('Admin email send failed:', adminErr);
            }
        }

        // 관리자 카카오톡 알림(나에게 보내기) — 신규 견적·예약일 때만, 연결돼 있으면 발송
        if (type === 'QUOTE_RECEIVED' || type === 'RESERVATION_REQUESTED') {
            const kakaoText = type === 'QUOTE_RECEIVED'
                ? `🆕 새 견적 요청\n고객: ${data.customerName || '고객'}\n목적지: ${data.destination || data.productName || '-'}`
                : `🆕 새 예약 요청\n고객: ${data.customerName || '고객'}\n상품: ${data.productName || '-'}`;
            const kakaoLink = type === 'QUOTE_RECEIVED' ? `${SITE_URL}/admin/quotes` : `${SITE_URL}/admin/reservations`;
            await notifyAdminKakao(c.env as any, kakaoText, kakaoLink);
        }

        return c.json({ success: true });
    } catch (e: any) {
        console.error('Email send error:', e);
        return c.json({ error: e.message || 'Failed to send email' }, 500);
    }
});

export default app;
