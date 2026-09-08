import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { OfficeLocationPicker } from '@/components/office-location-picker';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Network = {
    id: number;
    name: string;
    ip_address: string | null;
    ip_range: string | null;
    status: string;
};

type Office = {
    id: number;
    name: string;
    code: string;
    city: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    allowed_radius: number;
    status: string;
    employees_count: number;
    networks: Network[];
};

type AttendancePolicy = {
    mode: string;
    label: string;
    description: string;
    requires_network: boolean;
    requires_location: boolean;
    requires_device: boolean;
};

function policyIntro(policy: AttendancePolicy): string {
    if (policy.requires_network && policy.requires_location) {
        return `Current mode: ${policy.label}. Check-in needs an approved office public IP and GPS inside the map radius.`;
    }

    if (policy.requires_network) {
        return `Current mode: ${policy.label}. Check-in is allowed only from these office public IPs — the same IP the server sees, not a 192.168.x Wi‑Fi address.`;
    }

    if (policy.requires_location) {
        return `Current mode: ${policy.label}. Check-in is allowed only inside the office GPS radius. Network IPs are not used.`;
    }

    return `Current mode: ${policy.label}. Network and GPS checks are off. Offices still group employees.`;
}

function coordValue(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    return String(value);
}

function CreateOfficeForm({ requiresLocation }: { requiresLocation: boolean }) {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('200');

    return (
        <Form action="/offices" method="post" className="space-y-4 rounded-xl border p-4">
            <div className="grid gap-2 sm:grid-cols-3">
                <Input name="name" placeholder="Dhaka Head Office" required />
                <Input name="code" placeholder="DHK001" required />
                <Input name="city" placeholder="Dhaka" />
            </div>
            <input type="hidden" name="country" value="BD" />
            <input type="hidden" name="timezone" value="Asia/Dhaka" />
            <input type="hidden" name="status" value="active" />
            {requiresLocation ? (
                <>
                    <OfficeLocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        radius={Number(radius) || 200}
                        onChange={(coords) => {
                            setLatitude(coords.latitude);
                            setLongitude(coords.longitude);
                        }}
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                        <Input
                            name="latitude"
                            value={latitude}
                            onChange={(event) => setLatitude(event.target.value)}
                            placeholder="Latitude"
                        />
                        <Input
                            name="longitude"
                            value={longitude}
                            onChange={(event) => setLongitude(event.target.value)}
                            placeholder="Longitude"
                        />
                        <Input
                            name="allowed_radius"
                            type="number"
                            min={10}
                            max={5000}
                            value={radius}
                            onChange={(event) => setRadius(event.target.value)}
                            placeholder="Radius (m)"
                        />
                    </div>
                </>
            ) : null}
            <Button type="submit">Add office</Button>
        </Form>
    );
}

function LocationFields({ office }: { office: Office }) {
    const [latitude, setLatitude] = useState(coordValue(office.latitude));
    const [longitude, setLongitude] = useState(coordValue(office.longitude));
    const [radius, setRadius] = useState(String(office.allowed_radius || 200));

    return (
        <Form action={`/offices/${office.id}`} method="put" className="mt-4 space-y-3">
            <input type="hidden" name="name" value={office.name} />
            <input type="hidden" name="code" value={office.code} />
            <input type="hidden" name="city" value={office.city ?? ''} />
            <input type="hidden" name="country" value="BD" />
            <input type="hidden" name="timezone" value="Asia/Dhaka" />
            <input type="hidden" name="status" value={office.status} />
            <OfficeLocationPicker
                latitude={latitude}
                longitude={longitude}
                radius={Number(radius) || 200}
                onChange={(coords) => {
                    setLatitude(coords.latitude);
                    setLongitude(coords.longitude);
                }}
            />
            <div className="grid gap-2 sm:grid-cols-4">
                <Input
                    name="latitude"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    placeholder="Latitude"
                />
                <Input
                    name="longitude"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    placeholder="Longitude"
                />
                <Input
                    name="allowed_radius"
                    type="number"
                    min={10}
                    max={5000}
                    value={radius}
                    onChange={(event) => setRadius(event.target.value)}
                    placeholder="Radius (m)"
                />
                <Button type="submit" variant="outline">
                    Save location
                </Button>
            </div>
        </Form>
    );
}

function AddNetworkForm({ officeId }: { officeId: number }) {
    const [ip, setIp] = useState('');
    const [detecting, setDetecting] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState<boolean | null>(null);

    async function detectIp() {
        setDetecting(true);
        setHint(null);

        try {
            const response = await fetch('/offices/detect-ip', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const data = (await response.json()) as {
                ip?: string;
                is_public?: boolean;
                message?: string;
            };

            if (!response.ok || !data.ip) {
                setHint('Could not detect this connection’s IP.');

                return;
            }

            setIp(data.ip);
            setIsPublic(data.is_public ?? null);
            setHint(data.message ?? null);
        } catch {
            setHint('Could not detect this connection’s IP.');
        } finally {
            setDetecting(false);
        }
    }

    return (
        <Form action={`/offices/${officeId}/networks`} method="post" className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
                <Input name="name" placeholder="Main Office WiFi" required className="sm:max-w-56" />
                <Input
                    name="ip_address"
                    value={ip}
                    onChange={(event) => setIp(event.target.value)}
                    placeholder="103.42.10.10"
                    className="sm:max-w-44"
                />
                <Input name="ip_range" placeholder="103.42.10.0/24" className="sm:max-w-44" />
                <input type="hidden" name="network_type" value="static_ip" />
                <input type="hidden" name="status" value="active" />
                <Button type="button" variant="secondary" onClick={() => void detectIp()} disabled={detecting}>
                    {detecting ? 'Detecting…' : 'Detect this Wi‑Fi IP'}
                </Button>
                <Button type="submit" variant="outline">
                    Add network
                </Button>
            </div>
            {hint ? (
                <p className={`text-xs ${isPublic === false ? 'text-amber-700' : 'text-muted-foreground'}`}>{hint}</p>
            ) : (
                <p className="text-muted-foreground text-xs">
                    Detect while connected to the office internet. This captures the public IP check-in will see, not 192.168.x.
                </p>
            )}
        </Form>
    );
}

export default function OfficesIndex({
    offices,
    attendancePolicy,
}: {
    offices: Paginated<Office>;
    attendancePolicy: AttendancePolicy;
}) {
    return (
        <>
            <Head title="Offices" />
            <PageShell>
                <PageHeader title="Offices & networks" description={policyIntro(attendancePolicy)} />

                <CreateOfficeForm requiresLocation={attendancePolicy.requires_location} />

                <div className="grid gap-4">
                    {offices.data.map((office) => (
                        <div key={office.id} className="rounded-xl border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="font-medium">{office.name}</div>
                                    <div className="text-muted-foreground text-sm">
                                        {office.code} · {office.city ?? 'No city'} · {office.employees_count} employees
                                        {attendancePolicy.requires_location && office.latitude && office.longitude
                                            ? ` · ${office.latitude}, ${office.longitude} (${office.allowed_radius}m)`
                                            : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={office.status} withIcon={false} />
                                    <DeleteConfirm
                                        action={`/offices/${office.id}`}
                                        title={`Delete ${office.name}?`}
                                        description={`This cannot be undone. ${office.name} will be permanently deleted.`}
                                        disabled={office.employees_count > 0}
                                        disabledTitle="Reassign employees before deleting"
                                    />
                                </div>
                            </div>

                            {attendancePolicy.requires_location ? <LocationFields office={office} /> : null}

                            {attendancePolicy.requires_network ? (
                                <>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        {office.networks.length === 0 ? (
                                            <li className="text-muted-foreground">No office networks yet.</li>
                                        ) : (
                                            office.networks.map((network) => (
                                                <li
                                                    key={network.id}
                                                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                                                >
                                                    <span>
                                                        {network.name}: {network.ip_address ?? network.ip_range ?? 'No IP'}
                                                    </span>
                                                    <DeleteConfirm
                                                        action={`/office-networks/${network.id}`}
                                                        title={`Remove ${network.name}?`}
                                                        description={`${network.name} will be removed from this office. Devices on this network will no longer be authorized.`}
                                                        triggerLabel="Remove"
                                                        confirmLabel="Remove"
                                                    />
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                    <AddNetworkForm officeId={office.id} />
                                </>
                            ) : null}
                        </div>
                    ))}
                </div>
                <Pagination paginator={offices} />
            </PageShell>
        </>
    );
}

OfficesIndex.layout = {
    breadcrumbs: [{ title: 'Offices', href: '/offices' }],
};
