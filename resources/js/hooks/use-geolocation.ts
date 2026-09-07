import { useEffect, useState } from 'react';

type GeoState = {
    latitude: string;
    longitude: string;
    error: string | null;
    ready: boolean;
};

export function useGeolocation(enabled: boolean): GeoState {
    const [state, setState] = useState<GeoState>({
        latitude: '',
        longitude: '',
        error: null,
        ready: !enabled,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (!navigator.geolocation) {
            setState({
                latitude: '',
                longitude: '',
                error: 'Geolocation is not supported in this browser.',
                ready: true,
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    latitude: String(position.coords.latitude),
                    longitude: String(position.coords.longitude),
                    error: null,
                    ready: true,
                });
            },
            () => {
                setState({
                    latitude: '',
                    longitude: '',
                    error: 'Location permission is required to mark attendance.',
                    ready: true,
                });
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
        );
    }, [enabled]);

    return state;
}
