'use client';

import { useEffect, useState } from 'react';
import { formatViDateTime, greetingForHour } from '../lib/format-greeting';
import { mvUser } from '../data/mock-dashboard';

export function MvGreeting() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timestamp = now ? formatViDateTime(now) : '';
  const greeting = greetingForHour(now ? now.getHours() : 19);

  return (
    <div>
      <p className="text-caption uppercase tracking-wider text-mv-text-secondary/80">{timestamp || ' '}</p>
      <h1 className="mt-1 font-display text-heading-lg text-mv-text tablet:mt-2 tablet:text-display-lg">
        {greeting}, {mvUser.firstName}{' '}
        <span aria-hidden="true" className="text-mv-gold">
          ✦
        </span>
      </h1>
      <p className="mt-1.5 max-w-md text-body-sm text-mv-text-secondary tablet:mt-3 tablet:text-body-md">
        Đừng cố biết trước mọi thứ. Hôm nay chỉ cần hiểu mình thêm một chút.
      </p>
    </div>
  );
}
