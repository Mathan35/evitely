import { Bone } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/errors/show.tsx`. */
export function ErrorSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative flex min-h-screen animate-in fade-in flex-col items-center justify-center bg-background px-6 text-center text-foreground duration-300',
                className,
            )}
            aria-hidden
            data-skeleton-page="error"
        >
            <Bone className="absolute top-4 right-4 size-10 rounded-full" />
            <Bone className="h-8 w-20" />
            <Bone className="mt-3 h-12 w-64 max-w-full" />
            <div className="mt-4 max-w-md space-y-2">
                <Bone className="mx-auto h-4 w-full" />
                <Bone className="mx-auto h-4 w-[85%]" />
            </div>
            <Bone className="mt-8 h-10 w-36 rounded-full" />
        </div>
    );
}

export function GenericSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('mx-auto w-full max-w-6xl animate-in fade-in space-y-4 px-4 py-10 duration-300', className)} aria-hidden>
            <Bone className="h-8 w-48" />
            <Bone className="h-4 w-80 max-w-full" />
            <Bone className="mt-6 h-48 w-full rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
                <Bone className="h-28 rounded-2xl" />
                <Bone className="h-28 rounded-2xl" />
            </div>
        </div>
    );
}
