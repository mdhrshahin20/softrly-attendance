export type FaceVerifyResult = {
    matched: boolean;
    score: number;
    threshold: number;
    message: string | null;
};

function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[2]) : '';
}

/**
 * Ask the server whether a captured descriptor matches the signed-in user's
 * enrolled face.
 *
 * The decision is never made in the browser — this only relays the descriptor.
 */
export async function verifyFaceDescriptor(
    descriptor: number[],
): Promise<FaceVerifyResult> {
    try {
        const response = await fetch('/face/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
            },
            body: JSON.stringify({ face_descriptor: descriptor }),
        });

        if (response.status === 419) {
            return {
                matched: false,
                score: 1,
                threshold: 0,
                message: 'Your session expired. Reload the page and try again.',
            };
        }

        if (response.status === 429) {
            return {
                matched: false,
                score: 1,
                threshold: 0,
                message: 'Too many attempts. Wait a moment and try again.',
            };
        }

        if (!response.ok) {
            return {
                matched: false,
                score: 1,
                threshold: 0,
                message: 'Verification failed. Please try again.',
            };
        }

        return (await response.json()) as FaceVerifyResult;
    } catch {
        return {
            matched: false,
            score: 1,
            threshold: 0,
            message: 'Could not reach the server. Check your connection.',
        };
    }
}
