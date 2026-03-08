import { cn } from "@/lib/utils";

/**
 * A reusable Skeleton component that provides a pulsating background effect
 * to be used as a placeholder while data is loading.
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-white/10", className)}
            {...props}
        />
    );
}

export { Skeleton };
