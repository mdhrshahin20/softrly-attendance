import { useId } from 'react';

/**
 * Minimal, dependency-free trend sparkline. Fill uses the currentColor
 * at a low alpha so it follows its container's tone.
 */
export function Sparkline({
    data,
    className,
    strokeClassName,
    height = 28,
}: {
    data: number[];
    className?: string;
    strokeClassName?: string;
    height?: number;
}) {
    const gradientId = useId();
    const width = 72;

    if (data.length < 2) {
        return null;
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const points = data.map((value, index) => {
        const x = index * step;
        const y = height - 3 - ((value - min) / range) * (height - 6);

        return [x, y] as const;
    });

    const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            style={{ width, height }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`0,${height} ${line} ${width},${height}`}
                fill={`url(#${gradientId})`}
            />
            <polyline
                points={line}
                fill="none"
                className={strokeClassName ?? 'text-primary'}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
