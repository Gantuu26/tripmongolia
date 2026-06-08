import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { ReservationCompleteDesktop } from '../components/reservation-desktop/ReservationCompleteDesktop';

export const ReservationComplete: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [reservation, setReservation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const reservationId = location.state?.reservationId;

    useEffect(() => {
        if (!reservationId) {
            navigate('/', { replace: true });
            return;
        }

        const fetchReservation = async () => {
            try {
                const data = await api.reservations.get(reservationId);
                setReservation(data);
            } catch (error) {
                console.error('Error fetching reservation:', error);
                alert('예약 정보를 불러오지 못했습니다.');
                navigate('/', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchReservation();
    }, [reservationId, navigate]);

    const formatPrice = (price: number) => price ? price.toLocaleString() : '0';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!reservation) return null;

    const { price_breakdown } = reservation;

    // Desktop: render the wizard's final step. Mobile UI untouched.
    if (isDesktop) {
        return (
            <ReservationCompleteDesktop
                productName={reservation.product_name || ''}
                email={reservation.customer_info?.email || ''}
                total={price_breakdown?.total || 0}
                deposit={price_breakdown?.deposit || 0}
            />
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
            <div className="max-w-[430px] mx-auto bg-white dark:bg-zinc-900 min-h-screen flex flex-col relative overflow-x-hidden shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-4 justify-between border-b border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#0e1a18] dark:text-white flex size-10 shrink-0 items-center justify-start cursor-pointer"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="text-[#0e1a18] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">예약 신청 완료</h2>
                    <div className="size-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto pb-48 px-6">
                    <div className="pt-12 pb-10 text-center">
                        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl font-bold">check</span>
                        </div>
                        <h3 className="text-[#0e1a18] dark:text-white text-2xl font-bold mb-3">예약 신청이 완료되었습니다!</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">
                            입력하신 이메일 주소로<br />PayPal 청구서를 보내드립니다.<br />
                            <strong className="text-primary font-bold">결제가 완료되면 예약이 확정됩니다.</strong>
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="mb-6">
                            <p className="text-[13px] font-bold text-gray-400 mb-1 uppercase tracking-wider">결제할 예약금</p>
                            <p className="text-3xl font-bold text-[#0e1a18] dark:text-white">{formatPrice(price_breakdown?.deposit)}원</p>
                        </div>
                        <div className="h-px bg-gray-200 dark:bg-zinc-700 w-full mb-6"></div>
                        <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-green-500 text-lg shrink-0 mt-0.5">mark_email_read</span>
                                <p>등록하신 이메일로 결제용 PayPal 청구 메일을 보내드립니다.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-green-500 text-lg shrink-0 mt-0.5">credit_score</span>
                                <p>메일 안의 링크를 통해 신용카드 등으로 안전하고 간편하게 결제하실 수 있습니다.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-orange-500 text-lg shrink-0 mt-0.5">warning</span>
                                <p>결제가 확인되지 않을 경우 예약이 자동으로 취소될 수 있습니다.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-start gap-3 px-2">
                        <span className="material-symbols-outlined text-gray-400 text-xl">info</span>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            결제가 완료되면 즉시 예약이 확정되고 안내 메일이 발송됩니다. 궁금한 점이 있으시면 문의해 주세요.
                        </p>
                    </div>
                </div>

                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 pb-10 z-[60] text-center">
                    <button
                        onClick={() => navigate('/mypage/reservations')}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mb-4 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">receipt_long</span>
                        예약 내역 확인하기
                    </button>
                    <button
                        onClick={() => navigate('/products')}
                        className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
};
