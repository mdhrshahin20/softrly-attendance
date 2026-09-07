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
                    {allowed ? 'Office network connected' : 'Network not authorized'}
                </span>
            </div>
            <p className="text-muted-foreground text-sm">
                {allowed
                    ? [officeName, networkName].filter(Boolean).join(' · ') ||
                      'Authorized office network'
                    : message ||
                      'Connect to your organization’s office network to mark attendance.'}
            </p>
            {showTechnical && ip ? (
                <p className="text-muted-foreground font-mono text-xs">{ip}</p>
            ) : null}
        </div>
    );
}
