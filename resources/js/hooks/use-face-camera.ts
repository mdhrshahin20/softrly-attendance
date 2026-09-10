import { useCallback, useEffect, useRef, useState } from 'react';

type FaceApi = typeof import('@vladmandic/face-api');

export type FaceCapture = {
    descriptor: number[];
    /** Downscaled JPEG data URL, for the enrolment/audit record. */
    selfie: string;
};

export type FaceCameraStatus =
    | 'idle'
    | 'loading-models'
    | 'starting'
    | 'ready'
    | 'error';

const MODEL_URL = '/models';
const MAX_SELFIE_WIDTH = 480;
const JPEG_QUALITY = 0.72;

/** How often we look for a face while watching, in milliseconds. */
const DETECT_INTERVAL_MS = 450;

/** Consecutive good detections required before auto-capturing. */
const REQUIRED_STABLE_FRAMES = 2;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

/**
 * Run one detection pass. face-api returns a thenable task rather than a real
 * Promise, so failures are normalised here.
 */
async function detectFace(
    faceapi: FaceApi,
    video: HTMLVideoElement,
    scoreThreshold: number,
): Promise<{ descriptor: Float32Array } | null> {
    try {
        const result = await faceapi
            .detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold,
                }),
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

        return result ?? null;
    } catch {
        return null;
    }
}

/**
 * face-api.js is heavy, so the models and the library are loaded once per page
 * and shared across every component that needs them.
 */
let faceApiPromise: Promise<FaceApi> | null = null;

async function loadFaceApi(): Promise<FaceApi> {
    if (faceApiPromise === null) {
        faceApiPromise = (async () => {
            const faceapi = await import('@vladmandic/face-api');

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);

            return faceapi;
        })().catch((error: unknown) => {
            // Allow a later retry rather than caching the failure forever.
            faceApiPromise = null;
            throw error;
        });
    }

    return faceApiPromise;
}

function toJpegDataUrl(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    const scale = Math.min(
        1,
        MAX_SELFIE_WIDTH / (video.videoWidth || MAX_SELFIE_WIDTH),
    );

    canvas.width = Math.round((video.videoWidth || MAX_SELFIE_WIDTH) * scale);
    canvas.height = Math.round((video.videoHeight || MAX_SELFIE_WIDTH) * scale);

    const context = canvas.getContext('2d');

    if (context === null) {
        return '';
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export function useFaceCamera(enabled: boolean) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceApiRef = useRef<FaceApi | null>(null);
    /** Bumped to cancel an in-flight auto-capture loop. */
    const watchTokenRef = useRef(0);

    const [status, setStatus] = useState<FaceCameraStatus>('idle');
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stop = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current !== null) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const start = useCallback(async () => {
        // Already live. Calling getUserMedia again would restart the stream.
        if (streamRef.current !== null) {
            setStatus('ready');

            return true;
        }

        setError(null);
        setStatus('loading-models');

        let faceapi: FaceApi;

        try {
            faceapi = await loadFaceApi();
            faceApiRef.current = faceapi;
        } catch {
            setStatus('error');
            setError(
                'Could not load the face recognition models. Check your connection and try again.',
            );
            return false;
        }

        setStatus('starting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current !== null) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => undefined);
            }

            setStatus('ready');

            return true;
        } catch {
            setStatus('error');
            setError(
                'Camera access was blocked. Allow camera permission in your browser, then try again.',
            );

            return false;
        }
    }, []);

    /**
     * Detect exactly one face and return its descriptor plus a downscaled selfie.
     */
    const capture = useCallback(async (): Promise<FaceCapture | null> => {
        const faceapi = faceApiRef.current;
        const video = videoRef.current;

        if (faceapi === null || video === null || video.readyState < 2) {
            setError('The camera is not ready yet.');
            return null;
        }

        const detection = await detectFace(faceapi, video, 0.4);

        if (!detection) {
            setError(
                'No face detected. Face the camera in good lighting and try again.',
            );
            return null;
        }

        setError(null);

        return {
            descriptor: Array.from(detection.descriptor),
            selfie: toJpegDataUrl(video),
        };
    }, []);

    /** Stop any running auto-capture loop. */
    const cancelWatch = useCallback(() => {
        watchTokenRef.current += 1;
        setDetecting(false);
    }, []);

    /**
     * Watch the camera and capture automatically once a face is held steady.
     *
     * Resolves with the capture, or null if cancelled (unmount, retry, or the
     * user navigating away). Never rejects.
     */
    const autoCapture = useCallback(async (): Promise<FaceCapture | null> => {
        const faceapi = faceApiRef.current;
        const video = videoRef.current;

        if (faceapi === null || video === null) {
            return null;
        }

        const token = (watchTokenRef.current += 1);

        setDetecting(true);
        setError(null);

        let stableFrames = 0;

        try {
            while (watchTokenRef.current === token) {
                if (video.readyState >= 2) {
                    const detection = await detectFace(faceapi, video, 0.5);

                    // A cancel may have landed while detection was running.
                    if (watchTokenRef.current !== token) {
                        break;
                    }

                    if (detection) {
                        stableFrames += 1;

                        if (stableFrames >= REQUIRED_STABLE_FRAMES) {
                            return {
                                descriptor: Array.from(detection.descriptor),
                                selfie: toJpegDataUrl(video),
                            };
                        }
                    } else {
                        stableFrames = 0;
                    }
                }

                await delay(DETECT_INTERVAL_MS);
            }
        } finally {
            if (watchTokenRef.current === token) {
                setDetecting(false);
            }
        }

        return null;
    }, []);

    // Release the camera whenever the consuming component unmounts.
    useEffect(() => {
        return () => {
            watchTokenRef.current += 1;
            stop();
        };
    }, [stop]);

    useEffect(() => {
        if (!enabled) {
            watchTokenRef.current += 1;
            setDetecting(false);
            stop();
            setStatus('idle');
        }
    }, [enabled, stop]);

    return {
        videoRef,
        status,
        detecting,
        error,
        start,
        stop,
        capture,
        autoCapture,
        cancelWatch,
        setError,
    };
}
