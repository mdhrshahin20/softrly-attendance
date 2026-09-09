import { Form, Head } from '@inertiajs/react';
import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ActionDialog } from '@/components/action-dialog';
import { DeleteConfirm } from '@/components/delete-confirm';
import { EmptyState } from '@/components/empty-state';
import { OfficeLocationPicker } from '@/components/office-location-picker';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusDot } from '@/components/status-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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

function CreateOfficeForm({
    requiresLocation,
    onDone,
}: {
    requiresLocation: boolean;
    onDone?: () => void;
}) {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('200');

    return (
        <Form
            action="/offices"
            method="post"
            className="space-y-4"
            options={{ preserveScroll: true, onSuccess: onDone } as never}
        >
            {({ processing, errors }) => (
                <>
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
                    {errors.name || errors.code ? (
                        <p className="text-destructive text-sm">{errors.name ?? errors.code}</p>
                    ) : null}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onDone}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Add office
                        </Button>
                    </DialogFooter>
                </>
            )}
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
    const [createOpen, setCreateOpen] = useState(false);
    const requiresLocation = attendancePolicy.requires_location;
    const requiresNetwork = attendancePolicy.requires_network;

    return (
        <>
            <Head title="Offices & Wi-Fi" />
            <PageShell>
                <PageHeader
                    title="Offices & Wi-Fi"
                    description="Attendance rules, authorized networks and office locations."
                    actions={
                        <Button onClick={() => setCreateOpen(true)}>
                            Add office
                        </Button>
                    }
                />

                <div className="rounded-xl border bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <WifiIcon />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium">
                                How attendance is verified here
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-sm">
                                {policyIntro(attendancePolicy)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                        <Badge variant={requiresNetwork ? 'success' : 'outline'}>
                            {requiresNetwork ? 'Wi-Fi required' : 'No network check'}
                        </Badge>
                        <Badge variant={requiresLocation ? 'info' : 'outline'}>
                            {requiresLocation ? 'GPS radius' : 'No location check'}
                        </Badge>
                    </div>
                </div>

                {offices.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Building2}
                            title="No offices yet"
                            description="Add your first office to group employees and enforce network attendance."
                        />
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {offices.data.map((office) => (
                            <OfficeCard
                                key={office.id}
                                office={office}
                                attendancePolicy={attendancePolicy}
                            />
                        ))}
                    </div>
                )}

                {offices.total && offices.total > offices.data.length ? (
                    <Pagination paginator={offices} />
                ) : null}
            </PageShell>

            <ActionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="Add an office"
                description="Create a location employees can be assigned to."
            >
                {() => (
                    <CreateOfficeForm
                        requiresLocation={attendancePolicy.requires_location}
                        onDone={() => setCreateOpen(false)}
                    />
                )}
            </ActionDialog>
        </>
    );
}

OfficesIndex.layout = {
    breadcrumbs: [{ title: 'Offices & Wi-Fi', href: '/offices' }],
};

function OfficeCard({
    office,
    attendancePolicy,
}: {
    office: Office;
    attendancePolicy: AttendancePolicy;
}) {
    const requiresNetwork = attendancePolicy.requires_network;
    const online = requiresNetwork
        ? office.networks.length > 0
        : office.employees_count > 0;
    const statusLabel = requiresNetwork
        ? online
            ? 'Authorized'
            : 'No network'
        : online
          ? 'Active'
          : 'No employees';
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl border bg-card">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <Building2 className="text-muted-foreground size-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{office.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                                {office.code}
                                {office.city ? ` · ${office.city}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <StatusDot
                            tone={online ? 'success' : 'muted'}
                            label={statusLabel}
                            pulse={online}
                            className="gap-1.5 [&>span:last-child]:hidden lg:[&>span:last-child]:inline"
                        />
                        <DeleteConfirm
                            action={`/offices/${office.id}`}
                            title={`Delete ${office.name}?`}
                            description={`This cannot be undone. ${office.name} will be permanently deleted.`}
                            disabled={office.employees_count > 0}
                            disabledTitle="Reassign employees before deleting"
                        />
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-medium">
                        {office.employees_count} employees
                    </span>
                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-medium">
                        {office.networks.length} authorized{' '}
                        {office.networks.length === 1 ? 'network' : 'networks'}
                    </span>
                    {attendancePolicy.requires_location && office.latitude && office.longitude ? (
                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-medium tabular-nums">
                            GPS · {office.allowed_radius}m radius
                        </span>
                    ) : null}
                </div>

                {attendancePolicy.requires_location ? (
                    <LocationFields office={office} />
                ) : null}

                {attendancePolicy.requires_network ? (
                    <button
                        type="button"
                        onClick={() => setExpanded((value) => !value)}
                        className="text-muted-foreground mt-3 inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
                        aria-expanded={expanded}
                    >
                        {expanded ? 'Hide' : 'Manage'} Wi-Fi networks
                        <ChevronDown
                            className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                ) : null}
            </div>

            {expanded && attendancePolicy.requires_network ? (
                <div className="border-t bg-muted/20 p-4">
                    {office.networks.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No authorized networks yet. Add the office internet below.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {office.networks.map((network) => (
                                <li
                                    key={network.id}
                                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <WifiIcon className="text-muted-foreground size-3.5 shrink-0" />
                                        <span className="truncate text-sm font-medium">
                                            {network.name}
                                        </span>
                                        <span className="text-muted-foreground font-mono text-xs">
                                            {network.ip_address ?? network.ip_range ?? 'No IP'}
                                        </span>
                                    </div>
                                    <DeleteConfirm
                                        action={`/office-networks/${network.id}`}
                                        title={`Remove ${network.name}?`}
                                        description={`${network.name} will be removed from this office. Devices on this network will no longer be authorized.`}
                                        triggerLabel="Remove"
                                        confirmLabel="Remove"
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                    {attendancePolicy.requires_network ? (
                        <AddNetworkForm officeId={office.id} />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function WifiIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M5 13a10 10 0 0 1 14 0" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 20 0" />
            <line x1="12" x2="12.01" y1="20" y2="20" />
        </svg>
    );
}
