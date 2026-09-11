import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ({ children, ...props }: React.ComponentProps<typeof ToastPrimitives.Provider>) => (
  <ToastPrimitives.Provider duration={5000} {...props}>{children}</ToastPrimitives.Provider>
);

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-[4.5rem] right-3 left-auto translate-x-0 z-[100] flex max-h-[80vh] w-[calc(100vw-1.5rem)] max-w-[370px] sm:max-w-[420px] md:max-w-[370px] flex-col gap-2.5 p-0 sm:bottom-5 sm:right-5 md:bottom-4 md:right-4",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-2xl md:rounded-xl border p-3.5 sm:p-4 md:p-3.5 md:py-3 shadow-2xl backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-border/60 bg-[#0F172A]/95 text-foreground shadow-black/50 ring-1 ring-white/10",
        destructive: "destructive group border-rose-500/30 bg-[#1A0C12]/95 text-foreground shadow-rose-950/50 ring-1 ring-rose-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ToastCustomProps {
  important?: boolean;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> &
    ToastCustomProps
>(({ className, variant, important, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded-lg border bg-transparent px-2.5 text-xs font-medium ring-offset-background transition-colors group-[.destructive]:border-red-500/20 hover:bg-secondary group-[.destructive]:hover:border-red-500/40 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 md:right-2 md:top-2 rounded-full p-1.5 md:p-1 text-muted-foreground/80 opacity-90 transition-all hover:bg-white/10 hover:text-foreground focus:opacity-100 focus:outline-none",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-xs sm:text-sm md:text-[13px] font-bold md:font-semibold tracking-tight text-foreground leading-snug", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-[11px] sm:text-xs md:text-xs text-muted-foreground/90 leading-relaxed mt-0.5 whitespace-normal break-words", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
