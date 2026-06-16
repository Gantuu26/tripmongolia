const FROM = 'Trip Mongolia <noreply@tripmongolia.kr>';
const REPLY_TO = 'ts.dejidlala@gmail.com';

export async function sendEmail(
    apiKey: string,
    to: string | string[],
    subject: string,
    html: string,
) {
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
    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
    return res.json();
}

export function baseLayout(content: string) {
    return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;color:#1f2937;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(224,11,65,.10);}
  .header{background:#E00B41;padding:28px 32px;text-align:center;}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px;}
  .header p{margin:4px 0 0;color:rgba(255,255,255,.9);font-size:13px;}
  .body{padding:32px;}
  .greeting{font-size:16px;font-weight:600;margin-bottom:20px;}
  .card{background:#fff5f7;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #E00B41;}
  .card-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0e3e6;font-size:14px;}
  .card-row:last-child{border-bottom:none;}
  .card-row .label{color:#8a6f76;font-weight:500;}
  .card-row .value{font-weight:600;text-align:right;}
  .highlight{background:#fff3cd;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;border-left:4px solid #f59e0b;}
  .alert{background:#fee2e2;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;border-left:4px solid #ef4444;}
  .btn{display:inline-block;background:#E00B41;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0;}
  .footer{background:#f9fafb;padding:20px 32px;text-align:center;font-size:12px;color:#8a6f76;}
  .footer a{color:#E00B41;text-decoration:none;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#E00B41;color:#fff;padding:8px 12px;text-align:left;}
  td{padding:8px 12px;border-bottom:1px solid #f0e3e6;}
  tr:last-child td{border-bottom:none;}
</style>
</head>
<body><div class="wrap">${content}</div></body>
</html>`;
}
