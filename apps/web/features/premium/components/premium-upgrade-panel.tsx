'use client';

import { useMutation } from '@tanstack/react-query';
import { CalendarDays, Check, LockKeyhole, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { premiumApi } from '../api/premium-api';
import { usePremiumStatus } from '../hooks/use-premium-status';
import { PremiumMatrix } from './premium-matrix';

function checkoutErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PAYMENT_PROVIDER_UNAVAILABLE' || error.code === 'PAYMENTS_DISABLED') return 'Thanh toán đang tạm thời gián đoạn. Vui lòng thử lại sau.';
    if (error.code === 'RATE_LIMITED') return 'Bạn đã thử vài lần liên tiếp. Vui lòng chờ một chút rồi thử lại.';
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi thanh toán.';
  }
  return 'Chưa thể mở trang thanh toán. Vui lòng thử lại.';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export function PremiumUpgradePanel() {
  const { data: status, isLoading, isError, refetch, isFetching } = usePremiumStatus();
  const checkout = useMutation({ mutationFn: () => premiumApi.checkout(), onSuccess: (order) => { if (order.checkoutUrl) window.location.href = order.checkoutUrl; } });

  if (isLoading) return <div aria-label="Đang tải thông tin Premium" className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_25rem]"><Skeleton className="h-80 w-full rounded-xl" /><Skeleton className="h-80 w-full rounded-xl" /></div>;
  if (isError || !status) return <div role="alert" className="rounded-xl border border-caution/30 bg-caution/5 p-7 text-center"><p className="text-body-lg font-semibold text-text-primary">Chưa thể tải trạng thái Premium</p><p className="mt-2 text-body-sm text-text-secondary">Kết nối có thể đang gián đoạn. Hãy thử kiểm tra lại.</p><Button variant="secondary" size="sm" className="mt-5" loading={isFetching} onClick={() => refetch()}>Thử lại</Button></div>;

  if (status.isPremium) return <div className="flex flex-col gap-6"><section id="goi-premium" aria-labelledby="active-plan-heading" className="relative overflow-hidden rounded-xl border border-[#d5ad62]/25 bg-[radial-gradient(circle_at_90%_0%,rgba(213,173,98,0.14),transparent_30%),#0a101c] p-6 tablet:p-8"><div className="flex flex-col gap-6 tablet:flex-row tablet:items-center tablet:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Gói hiện tại</p><Badge variant="insight">Đang hoạt động</Badge></div><h2 id="active-plan-heading" className="mt-3 font-display text-heading-lg text-text-primary">Bạn đang dùng Premium</h2><p className="mt-2 text-body-sm text-text-secondary">Quyền lợi được xác nhận từ tài khoản của bạn.</p></div>{status.expiresAt && <div className="rounded-lg border border-white/10 bg-black/10 px-5 py-4"><p className="text-caption uppercase tracking-wider text-text-tertiary">Có hiệu lực đến</p><p className="mt-1 font-display text-heading-md text-text-primary">{formatDate(status.expiresAt)}</p></div>}</div></section><PremiumMatrix /></div>;

  return <div className="flex flex-col gap-7">
    <section id="goi-premium" aria-labelledby="plan-heading" className="grid overflow-hidden rounded-xl border border-[#d5ad62]/25 bg-[#0a101c] desktop:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="p-5 tablet:p-8 desktop:p-9"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Một gói duy nhất</p><h2 id="plan-heading" className="mt-2 font-display text-heading-lg text-text-primary">Premium · 30 ngày</h2><p className="mt-3 max-w-xl text-body-sm leading-relaxed text-text-secondary">Dành cho lúc bạn muốn khám phá thường xuyên hơn và giữ lại trọn vẹn hành trình của mình.</p><ul className="mt-6 grid gap-3 text-body-sm text-text-primary tablet:grid-cols-2 desktop:grid-cols-1">{['Tối đa 15 trải một lá mỗi ngày', 'Tối đa 10 trải ba lá mỗi ngày', 'Luận giải sâu hơn, cá nhân hóa bằng ký ức', 'Lịch sử đọc không giới hạn'].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d5ad62]" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>
      <aside aria-label="Thông tin thanh toán" className="border-t border-[#d5ad62]/20 bg-[linear-gradient(145deg,rgba(213,173,98,0.1),rgba(213,173,98,0.025))] p-5 tablet:p-8 desktop:border-l desktop:border-t-0">
        <div className="flex items-center gap-2 text-text-secondary"><Sparkles className="h-4 w-4 text-[#d5ad62]" aria-hidden="true" /><span className="text-caption font-semibold uppercase tracking-[0.14em]">Mệnh Vi Premium</span></div>
        <p className="mt-5 font-display text-display-lg leading-none text-text-primary">{status.priceVnd.toLocaleString('vi-VN')} <span className="text-body-md font-body text-text-secondary">{status.currency}</span></p>
        <div className="mt-3 flex items-center gap-2 text-body-sm text-text-secondary"><CalendarDays className="h-4 w-4" aria-hidden="true" /><span>Thanh toán một lần · sử dụng 30 ngày</span></div>
        <p className="mt-2 text-caption leading-relaxed text-text-tertiary">Không tự động gia hạn.</p>
        {status.isMvpTestPrice && <p className="mt-4 rounded-md border border-white/10 bg-black/10 px-3 py-2 text-caption leading-relaxed text-text-secondary">Đây là mức giá thử nghiệm MVP, chưa phải mức giá cuối cùng.</p>}
        {status.paymentsEnabled ? <>
          <Button variant="primary" size="lg" fullWidth className="mt-6" onClick={() => checkout.mutate()} loading={checkout.isPending}>{checkout.isPending ? 'Đang mở thanh toán' : 'Nâng cấp Premium'}</Button>
          {checkout.isError && <div role="alert" className="mt-3 rounded-md border border-caution/25 bg-caution/5 p-3 text-body-sm text-text-primary"><p>{checkoutErrorMessage(checkout.error)}</p><button type="button" className="mt-2 min-h-10 font-semibold text-[#e6c980] hover:underline" onClick={() => checkout.reset()}>Đóng thông báo</button></div>}
          <div className="mt-4 flex items-start gap-2 text-caption leading-relaxed text-text-tertiary"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>Bạn sẽ được chuyển đến trang thanh toán do PayOS cung cấp. Premium chỉ được kích hoạt sau khi thanh toán được xác nhận.</p></div>
        </> : <p role="status" className="mt-6 rounded-md border border-white/10 bg-black/10 p-4 text-body-sm text-text-secondary">Nâng cấp đang tạm thời gián đoạn. Vui lòng quay lại sau.</p>}
      </aside>
    </section>
    <PremiumMatrix />
    <section aria-labelledby="payment-process-heading" className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-5 tablet:grid-cols-[minmax(0,1fr)_minmax(17rem,.7fr)] tablet:p-7">
      <div><p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Sau khi chọn nâng cấp</p><h2 id="payment-process-heading" className="mt-1 font-display text-heading-md text-text-primary">Thanh toán được xác nhận như thế nào?</h2><p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-text-secondary">Mệnh Vi tạo đơn hàng từ máy chủ, chuyển bạn sang PayOS, rồi kiểm tra lại trạng thái từ hệ thống sau khi bạn quay về. Việc quay lại trang Mệnh Vi không tự động được xem là thanh toán thành công.</p></div>
      <ol className="grid gap-2 text-body-sm text-text-secondary"><li className="flex gap-3"><span className="text-[#d5ad62]">01</span><span>Mở trang thanh toán PayOS</span></li><li className="flex gap-3"><span className="text-[#d5ad62]">02</span><span>Xác nhận trạng thái từ backend</span></li><li className="flex gap-3"><span className="text-[#d5ad62]">03</span><span>Kích hoạt Premium khi đã xác minh</span></li></ol>
    </section>
  </div>;
}
