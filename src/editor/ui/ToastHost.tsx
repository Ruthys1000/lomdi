import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore, type ToastTone } from '@/state/toastStore';

const icons: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const tones: Record<ToastTone, string> = {
  info: 'text-fg-muted',
  success: 'text-ok',
  error: 'text-danger',
};

/**
 * מציג את ההודעות הקצרות.
 *
 * aria-live="polite" ולא "assertive": ההודעות מאשרות פעולה שהמשתמש
 * הרגע ביצע, ואין סיבה לקטוע בגללן את מה שקורא המסך מקריא.
 */
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toastItem) => {
        const Icon = icons[toastItem.tone];

        return (
          <div
            key={toastItem.id}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-edge bg-panel py-2.5 ps-4 pe-2.5 text-sm text-fg shadow-lg"
          >
            <Icon className={cn('size-4 shrink-0', tones[toastItem.tone])} aria-hidden />
            <span>{toastItem.message}</span>

            {toastItem.action && (
              <button
                type="button"
                onClick={() => {
                  toastItem.action?.run();
                  dismiss(toastItem.id);
                }}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-volt transition hover:bg-panel/10"
              >
                {toastItem.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={() => dismiss(toastItem.id)}
              aria-label="סגירת ההודעה"
              className="rounded-lg p-1 text-fg-muted transition hover:bg-panel-2 hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
