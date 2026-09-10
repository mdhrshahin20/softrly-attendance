import { Camera, Loader2, RotateCcw, VideoOff } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FaceCameraStatus } from '@/hooks/use-face-camera';

export function FaceCameraPreview({
    videoRef,
    status,
    error,
    onStart,
    className,
}: {
    videoRef: RefObject<HTMLVideoElement | null>;
    status: FaceCameraStatus;
    error: string | null;
    onStart: () => void;
    className?: string;
}) {
    const active = status === 'ready';
    const busy = status === 'loading-models' || status === 'starting';

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    'bg-muted/40 relative aspect-4/3 w-full overflow-hidden rounded-xl border',
                    className,
                )}
            >
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={cn(
                        'size-full scale-x-[-1] object-cover',
                        active ? 'opacity-100' : 'opacity-0',
                    )}
                />

                {!active ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                        {busy ? (
                            <>
                                <Loader2 className="text-muted-foreground size-6 animate-spin" />
                                <p className="text-muted-foreground text-sm">
                                    {status === 'loading-models'
                                        ? 'Loading face recognition…'
                                        : 'Starting camera…'}
                                </p>
                            </>
                        ) : (
                            <>
                                <VideoOff className="text-muted-foreground size-6" />
                                <p className="text-muted-foreground text-sm">
                                    Your camera is off.
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={onStart}
                                >
                                    <Camera className="size-4" />
                                    {status === 'error'
                                        ? 'Try again'
                                        : 'Open camera'}
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    // Guide frame so the employee centres their face.
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="border-primary/50 size-40 rounded-full border-2 border-dashed sm:size-48" />
                    </div>
                )}
            </div>

            {status === 'ready' ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <RotateCcw className="size-3" />
                    Centre your face in the circle and hold still.
                </p>
            ) : null}

            {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
    );
}
