import React from 'react';
import { openKakaoChat } from '../../constants/contact';

/**
 * 카카오톡 상담 플로팅 버튼.
 * (이전 채널톡 위젯을 대체 — 2026-06-08)
 */
export const FloatingConsultation: React.FC = () => {
    return (
        <button
            type="button"
            onClick={openKakaoChat}
            aria-label="카카오톡 상담"
            title="카카오톡 상담"
            className="fixed right-4 bottom-24 md:bottom-6 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#FEE500' }}
        >
            <img
                src="/assets/icons/kakaotalk.webp"
                alt="카카오톡 상담"
                className="h-9 w-9 object-contain"
                loading="lazy"
                width={36}
                height={36}
            />
        </button>
    );
};
