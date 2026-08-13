import { Moon, Star, Sparkle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mvEvents } from '../data/mock-dashboard';

const ICONS: LucideIcon[] = [Moon, Star, Sparkle];

export function MvEventsList() {
  return (
    <div className="rounded-xl border border-mv-border bg-mv-elevated p-5">
      <div className="flex items-center justify-between">
        <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Sự kiện sắp diễn ra</p>
        <button type="button" className="text-caption text-mv-text-secondary hover:text-mv-text">
          Xem tất cả
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {mvEvents.map((event, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={event.date} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mv-violet/15">
                <Icon className="h-4 w-4 text-mv-violet-secondary" aria-hidden="true" />
              </span>
              <div>
                <p className="text-caption text-mv-text-secondary">{event.date}</p>
                <p className="text-body-sm font-medium text-mv-text">{event.title}</p>
                <p className="text-caption text-mv-text-secondary">{event.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
