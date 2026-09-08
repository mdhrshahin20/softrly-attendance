import { useEffect, useRef, useState } from 'react';
import type { Circle, CircleMarker, Map as LeafletMap } from 'leaflet';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

const DHAKA: [number, number] = [23.8103, 90.4125];

function parseCoord(value: string): number | null {
    if (value.trim() === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

export function OfficeLocationPicker({
    latitude,
    longitude,
    radius,
    onChange,
}: {
    latitude: string;
    longitude: string;
    radius: number;
    onChange: (coords: { latitude: string; longitude: string }) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<CircleMarker | null>(null);
    const circleRef = useRef<Circle | null>(null);
    const onChangeRef = useRef(onChange);
    const [mapReady, setMapReady] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    onChangeRef.current = onChange;

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);
    const hasPoint = lat !== null && lng !== null;
    const radiusMeters = radius > 0 ? radius : 200;

    useEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        let cancelled = false;
        let map: LeafletMap | null = null;

        void (async () => {
            const leaflet = await import('leaflet');

            if (cancelled || !containerRef.current) {
                return;
            }

            const L = leaflet.default ?? leaflet;
            map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(DHAKA, 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            map.on('click', (event) => {
                onChangeRef.current({
                    latitude: event.latlng.lat.toFixed(7),
                    longitude: event.latlng.lng.toFixed(7),
                });
            });

            mapRef.current = map;
            setMapReady(true);
            requestAnimationFrame(() => map?.invalidateSize());
        })();

        return () => {
            cancelled = true;
            setMapReady(false);
            map?.remove();
            mapRef.current = null;
            markerRef.current = null;
            circleRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;

        if (!mapReady || !map || !hasPoint || lat === null || lng === null) {
            return;
        }

        void import('leaflet').then((leaflet) => {
            if (mapRef.current !== map) {
                return;
            }

            const L = leaflet.default ?? leaflet;
            const point: [number, number] = [lat, lng];

            if (markerRef.current) {
                markerRef.current.setLatLng(point);
            } else {
                markerRef.current = L.circleMarker(point, {
                    radius: 8,
                    color: '#4f46e5',
                    weight: 2,
                    fillColor: '#4f46e5',
                    fillOpacity: 1,
                }).addTo(map);
            }

            if (circleRef.current) {
                circleRef.current.setLatLng(point);
                circleRef.current.setRadius(radiusMeters);
            } else {
                circleRef.current = L.circle(point, {
                    radius: radiusMeters,
                    color: '#4f46e5',
                    weight: 1,
                    fillColor: '#6366f1',
                    fillOpacity: 0.15,
                }).addTo(map);
            }

            map.setView(point, Math.max(map.getZoom(), 16));
        });
    }, [hasPoint, lat, lng, mapReady, radiusMeters]);

    function useMyLocation() {
        if (!navigator.geolocation) {
            setLocationError('This browser cannot share your location.');

            return;
        }

        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                onChange({
                    latitude: position.coords.latitude.toFixed(7),
                    longitude: position.coords.longitude.toFixed(7),
                });
            },
            () => {
                setLocationError('Allow location access, or click the map instead.');
            },
        );
    }

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                className="z-0 h-72 w-full overflow-hidden rounded-lg border"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                    Click the map to set the office pin. The circle is the allowed check-in radius.
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={useMyLocation}>
                    Use my current location
                </Button>
            </div>
            {locationError ? <p className="text-destructive text-xs">{locationError}</p> : null}
        </div>
    );
}
