import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      offset={{ bottom: "1rem", left: "1rem", right: "1rem" }}
      mobileOffset={{ bottom: "4.5rem", left: "1rem", right: "1rem" }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl md:group-[.toaster]:rounded-xl group-[.toaster]:p-4 md:group-[.toaster]:p-3.5 group-[.toaster]:px-5 md:group-[.toaster]:px-4 group-[.toaster]:text-sm md:group-[.toaster]:text-xs backdrop-blur-md max-w-[440px] md:max-w-[370px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs sm:group-[.toast]:text-sm md:group-[.toast]:text-xs group-[.toast]:mt-1 md:group-[.toast]:mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:h-8 group-[.toast]:px-3",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:h-8 group-[.toast]:px-3",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
