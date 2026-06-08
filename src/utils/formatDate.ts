// Shared date formatting helpers.
// Review/magazine timestamps come from D1 as either ISO strings, "YYYY-MM-DD HH:mm:ss",
// or "YYYY-MM-DD". Parsing Date(undefined/invalid) returns Invalid Date — guard against that.
// The site is Korean-only, so output is always Korean.

const toValidDate = (raw: string | number | Date | null | undefined): Date | null => {
    if (!raw) return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Short numeric date. Korean: "2026. 04. 22."
 * Used in list cards where space is tight.
 */
export const formatShortDate = (raw: string | number | Date | null | undefined): string => {
    const d = toValidDate(raw);
    if (!d) return '';
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}. ${m}. ${day}.`;
};

/**
 * Short date with abbreviated weekday in parentheses. Used on MyReviews cards.
 * "2026. 04. 22. (수)" in Korean. `locale` is accepted for call-site compatibility.
 */
export const formatDateWithWeekday = (raw: string | number | Date | null | undefined, locale: string = 'ko'): string => {
    const d = toValidDate(raw);
    if (!d) return '';
    const base = formatShortDate(d);
    const weekdayLocale = locale && locale.startsWith('ko') ? 'ko-KR' : 'ko-KR';
    const weekday = d.toLocaleDateString(weekdayLocale, { weekday: 'short' });
    return `${base} (${weekday})`;
};

/**
 * Relative time for reviews/comments/activity. e.g. "방금", "3분 전", "2시간 전", then falls back to short date.
 */
export const formatRelativeTime = (raw: string | number | Date | null | undefined): string => {
    const d = toValidDate(raw);
    if (!d) return '';
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return formatShortDate(d);

    const min = Math.floor(diffMs / 60_000);
    const hr = Math.floor(diffMs / 3_600_000);
    const day = Math.floor(diffMs / 86_400_000);

    if (min < 1) return '방금';
    if (min < 60) return `${min}분 전`;
    if (hr < 24) return `${hr}시간 전`;
    if (day < 7) return `${day}일 전`;
    return formatShortDate(d);
};
