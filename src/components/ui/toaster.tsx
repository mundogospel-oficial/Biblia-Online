import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { AlertCircle, Bell, ShieldAlert, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive";
        const Icon = isDestructive ? AlertCircle : Bell;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-2.5 sm:gap-3 w-full pr-4 sm:pr-5">
              <div
                className={`mt-0.5 shrink-0 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border flex items-center justify-center ${
                  isDestructive
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                    : "bg-accent/15 text-accent border-accent/20"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="grid gap-0.5 flex-1 text-left min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
