import { useToastStore } from "./toastStore";
import { ToastItemView } from "./ToastItemView";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastProgressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-100 flex max-h-screen flex-col items-end gap-3 p-2 sm:top-6 sm:right-6"
      >
        {toasts.map((item) => (
          <ToastItemView key={item.id} item={item} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}
