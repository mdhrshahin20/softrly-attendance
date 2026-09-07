import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M9.2 8.4c3.4-2.6 8.3-2.4 11.4.6 1.5 1.5 2.4 3.4 2.6 5.4"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <path
                d="M22.8 23.6c-3.4 2.6-8.3 2.4-11.4-.6-1.5-1.5-2.4-3.4-2.6-5.4"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <circle cx="10.2" cy="17.6" r="2.1" fill="currentColor" />
            <circle cx="21.8" cy="14.4" r="2.1" fill="currentColor" />
        </svg>
    );
}
