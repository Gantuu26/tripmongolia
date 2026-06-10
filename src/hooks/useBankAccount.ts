import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export const DEFAULT_BANK_ACCOUNT: BankAccount = {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
};

/**
 * 무통장 입금 계좌 정보 (settings key: `bank_account`).
 * 관리자 페이지(/admin/payment)에서 한 번 입력하면 결제 화면(모바일·PC)에 공통 표시됩니다.
 * GET /api/settings 는 전체 키→값 맵을 반환하므로 거기서 `bank_account` 를 꺼내 파싱합니다.
 */
export function normalizeBankAccount(raw: unknown): BankAccount {
    let parsed: Partial<BankAccount> = {};
    if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw); } catch { /* keep default */ }
    } else if (raw && typeof raw === 'object') {
        parsed = raw as Partial<BankAccount>;
    }
    return {
        bankName: parsed.bankName || '',
        accountNumber: parsed.accountNumber || '',
        accountHolder: parsed.accountHolder || '',
    };
}

export function useBankAccount(): { account: BankAccount; isLoading: boolean } {
    const { data, isLoading } = useQuery<BankAccount>({
        queryKey: ['settings', 'bank_account'],
        queryFn: async () => {
            try {
                const res = await api.settings.get();
                return normalizeBankAccount(res?.bank_account);
            } catch {
                return DEFAULT_BANK_ACCOUNT;
            }
        },
        staleTime: 1000 * 60 * 10, // 10 min — rarely changes
    });
    return { account: data ?? DEFAULT_BANK_ACCOUNT, isLoading };
}
