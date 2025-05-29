// Add shadcn/ui Button as a reusable component
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export default function Button({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800",
        className
      )}
      {...props}
    />
  );
}
