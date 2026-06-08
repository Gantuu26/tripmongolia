// 카카오톡 상담 채널 링크.
// ⚠️ 실제 카카오톡 채널/오픈채팅 링크를 받으면 아래 KAKAO_CHANNEL_URL 값만 교체하세요.
export const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_REPLACE_ME';

/** 카카오톡 상담 채널을 새 탭에서 엽니다. (플로팅 버튼·상담 버튼 공통 사용) */
export const openKakaoChat = (): void => {
    if (typeof window === 'undefined') return;
    // 아직 실제 링크가 설정되지 않은 경우, 깨진 페이지로 이동하지 않도록 안내만.
    if (KAKAO_CHANNEL_URL.includes('REPLACE_ME')) {
        window.alert('카카오톡 상담 채널을 준비 중입니다. 곧 오픈됩니다.');
        return;
    }
    window.open(KAKAO_CHANNEL_URL, '_blank', 'noopener,noreferrer');
};
