// Material Symbols 아이콘 폰트 서브셋 생성기
// ──────────────────────────────────────────────────────────────
// 전체 가변폰트는 3.5MB라 모바일에서 FOUT(아이콘 자리에 'check' 같은 글자가
// 잠깐 보이는 현상)가 심합니다. 이 스크립트는 소스에서 실제로 쓰는 아이콘만
// 골라 Google Fonts에서 서브셋 woff2(보통 200~300KB)를 받아
// public/fonts/MaterialSymbolsOutlined.woff2 를 갱신합니다.
//
// 새 아이콘을 추가했거나 폰트가 깨져 보이면 실행:  node scripts/subset-material-symbols.mjs
// (Node 18+ 필요 — 전역 fetch 사용)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_OUT = path.join(root, 'public/fonts/MaterialSymbolsOutlined.woff2');
const CODEPOINTS_URL =
    'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints';
// 모바일 Chrome UA — 이게 있어야 Google이 woff2(가장 작은 포맷)를 내려줌
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

function walk(dir, out = []) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const s = fs.statSync(p);
        if (s.isDirectory()) {
            if (!/node_modules|dist|\.git/.test(p)) walk(p, out);
        } else if (/\.(tsx?|jsx?|html)$/.test(f)) out.push(p);
    }
    return out;
}

const run = async () => {
    console.log('· 공식 아이콘 목록(codepoints) 받는 중...');
    const cpText = await (await fetch(CODEPOINTS_URL)).text();
    const valid = new Set(cpText.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
    console.log(`  유효 아이콘 ${valid.size}개`);

    console.log('· 소스에서 사용 아이콘 추출 중...');
    const files = walk(path.join(root, 'src'));
    files.push(path.join(root, 'index.html'));
    const used = new Set();
    const reTok = /["'`]([a-z][a-z0-9_]{1,})["'`]/g;
    const reLig = /material-symbols-(?:outlined|rounded|sharp)[^>]*>\s*([a-z0-9_]+)\s*</g;
    for (const file of files) {
        const t = fs.readFileSync(file, 'utf8');
        let m;
        while ((m = reTok.exec(t))) if (valid.has(m[1])) used.add(m[1]);
        while ((m = reLig.exec(t))) if (valid.has(m[1])) used.add(m[1]);
    }
    const names = [...used].sort();
    console.log(`  사용 아이콘 ${names.length}개`);
    if (names.length === 0) throw new Error('추출된 아이콘이 없습니다 — 중단');

    console.log('· Google Fonts에서 서브셋 woff2 받는 중...');
    const cssUrl =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' +
        `&icon_names=${names.join(',')}&display=block`;
    const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text();
    const woff2Url = css.match(/https:\/\/fonts\.gstatic\.com\/l\/font\?kit=[^)]+/)?.[0];
    if (!woff2Url) throw new Error('서브셋 woff2 URL을 찾지 못함 — CSS 응답 확인 필요');

    const buf = Buffer.from(await (await fetch(woff2Url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') throw new Error('받은 파일이 woff2가 아님');
    fs.writeFileSync(FONT_OUT, buf);
    console.log(`✓ 완료: ${FONT_OUT} (${(buf.length / 1024).toFixed(0)} KB, 아이콘 ${names.length}개)`);
};

run().catch((e) => { console.error('✗ 실패:', e.message); process.exit(1); });
