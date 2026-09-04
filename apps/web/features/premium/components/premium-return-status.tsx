'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { premiumApi } from '../api/premium-api';
import { PREMIUM_STATUS_QUERY_KEY } from '../hooks/use-premium-status';

const POLL_INTERVAL_MS = 2000;

function StateCard({ icon: Icon, tone = 'neutral', eyebrow, title, description, ctaHref, ctaLabel, onRetry }: { icon: LucideIcon; tone?: 'neutral' | 'success' | 'caution'; eyebrow: string; title: string; description: string; ctaHref?: string; ctaLabel?: string; onRetry?: () => void }) {
  return <section aria-labelledby="payment-status-heading" className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#d5ad62]/20 bg-[#0a101c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] tablet:p-8">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(213,173,98,0.12),transparent_70%)]" />
    <div className="relative flex flex-col items-center text-center"><div className={cn('grid h-14 w-14 place-items-center rounded-full border', tone === 'success' && 'border-trust/35 bg-trust/10 text-trust', tone === 'caution' && 'border-caution/35 bg-caution/10 text-caution', tone === 'neutral' && 'border-[#d5ad62]/30 bg-[#d5ad62]/10 text-[#d5ad62]')}><Icon className={cn('h-7 w-7', tone === 'neutral' && 'animate-pulse motion-reduce:animate-none')} aria-hidden="true" /></div><p className="mt-5 text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">{eyebrow}</p><h1 id="payment-status-heading" className="mt-2 font-display text-heading-lg text-text-primary">{title}</h1><p className="mt-3 max-w-sm text-body-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="mt-6 flex w-full flex-col gap-3 tablet:flex-row tablet:justify-center">{onRetry && <Button variant="primary" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden="true" />Kiểm tra lại</Button>}{ctaHref && ctaLabel && <Link href={ctaHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-insight/35 px-4 text-body-md font-semibold text-text-primary transition hover:border-insight hover:bg-insight/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight">{ctaLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}</div>
      <p className="mt-6 border-t border-white/[0.07] pt-4 text-caption leading-relaxed text-text-tertiary">Trạng thái được đối chiếu với hệ thống Mệnh Vi — không dựa vào thông tin trên đường dẫn quay về.</p>
    </div>
  </section>;
}

export function PremiumReturnStatus() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const queryClient = useQueryClient();
  const { data: order, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['payment', 'order', orderId], queryFn: () => premiumApi.getOrder(orderId as string), enabled: Boolean(orderId), refetchInterval: (query) => query.state.data?.status === 'PENDING' ? POLL_INTERVAL_MS : false });
  useEffect(() => { if (order?.status === 'PAID') queryClient.invalidateQueries({ queryKey: PREMIUM_STATUS_QUERY_KEY }); }, [order?.status, queryClient]);

  if (!orderId) return <StateCard icon={XCircle} tone="caution" eyebrow="Không tìm thấy đơn hàng" title="Thiếu mã đơn hàng" description="Mệnh Vi chưa xác định được đơn hàng cần kiểm tra. Bạn có thể quay lại trang Premium để bắt đầu lại." ctaHref="/premium" ctaLabel="Về trang Premium" />;
  if (isLoading && !order) return <StateCard icon={Clock3} eyebrow="Đang kiểm tra" title="Đang xác nhận thanh toán…" description="Mệnh Vi đang chờ trạng thái đáng tin cậy từ hệ thống. Quá trình này thường chỉ mất một chút thời gian." />;
  if (isError || !order) return <StateCard icon={XCircle} tone="caution" eyebrow="Kết nối gián đoạn" title="Chưa thể kiểm tra thanh toán" description="Nếu bạn đã hoàn tất thanh toán, Premium vẫn sẽ được kích hoạt sau khi hệ thống xác nhận. Bạn có thể kiểm tra lại an toàn." onRetry={() => { if (!isFetching) refetch(); }} ctaHref="/premium" ctaLabel="Về trang Premium" />;
  if (order.status === 'PAID') return <StateCard icon={CheckCircle2} tone="success" eyebrow="Đã xác minh" title="Premium đã được kích hoạt" description="Thanh toán đã được xác nhận và quyền lợi Premium hiện đã hoạt động trên tài khoản của bạn." ctaHref="/discover/tarot" ctaLabel="Tiếp tục với Tarot" />;
  if (order.status === 'PENDING') return <StateCard icon={Clock3} eyebrow="Đang xử lý" title="Đang xác nhận thanh toán…" description="Mệnh Vi đang chờ xác nhận từ đơn vị thanh toán. Trang này sẽ tự động cập nhật; bạn không cần thanh toán lại." onRetry={() => { if (!isFetching) refetch(); }} ctaHref="/premium" ctaLabel="Về trang Premium" />;
  return <StateCard icon={XCircle} tone="caution" eyebrow="Chưa hoàn tất" title="Thanh toán chưa thành công" description="Đơn hàng này chưa được hoàn tất. Mệnh Vi không ghi nhận thanh toán thành công; bạn có thể thử lại khi sẵn sàng." ctaHref="/premium" ctaLabel="Thử lại" />;
}
