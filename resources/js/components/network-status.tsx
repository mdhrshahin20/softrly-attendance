import { cn } from '@/lib/utils';

type NetworkStatusProps = {
    allowed: boolean;
    officeName?: string | null;
    networkName?: string | null;
    message?: string | null;
    showTechnical?: boolean;
    ip?: string | null;
};

export function NetworkStatus({
    allowed,
    officeName,
    networkName,
    message,
    showTechnical = false,
    ip,
}: NetworkStatusProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
                <span
                    className={cn(
                        'size-2 rounded-full',
                        allowed ? 'bg-success' : 'bg-destructive',
                    )}
                    aria-hidden="true"
                />
                <span>
                    {allowed
                        ? "You're connected to an approved office network."
                        : 'Attendance is only available from an approved office network.'}
                </span>
            </div>
            <p className="text-muted-foreground text-sm">
                {allowed
                    ? [officeName, networkName].filter(Boolean).join(' · ') ||
                      'You can check in from this location.'
                    : message ||
                      'Connect to your office network, then try again.'}
            </p>
            {showTechnical && ip ? (
                <p className="text-muted-foreground font-mono text-xs">{ip}</p>
            ) : null}
        </div>
    );
}
