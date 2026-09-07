import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

export default function OfficesIndex({ offices }: { offices: Office[] }) {
    return (
        <>
            <Head title="Offices" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Offices & networks</h1>
                    <p className="text-muted-foreground text-sm">
                        Attendance is allowed only from these public IPs or CIDR ranges.
                    </p>
                </div>

                <Form action="/offices" method="post" className="grid max-w-4xl gap-2 sm:grid-cols-4">
                    <Input name="name" placeholder="Dhaka Head Office" required />
                    <Input name="code" placeholder="DHK001" required />
                    <Input name="city" placeholder="Dhaka" />
                    <Input name="latitude" placeholder="Latitude" />
                    <Input name="longitude" placeholder="Longitude" />
                    <Input name="allowed_radius" placeholder="Radius (m)" defaultValue="200" />
                    <input type="hidden" name="country" value="BD" />
                    <input type="hidden" name="timezone" value="Asia/Dhaka" />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add office</Button>
                </Form>

                <div className="grid gap-4">
                    {offices.map((office) => (
                        <div key={office.id} className="rounded-xl border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="font-medium">{office.name}</div>
                                    <div className="text-muted-foreground text-sm">
                                        {office.code} · {office.city ?? 'No city'} · {office.employees_count} employees
                                        {office.latitude && office.longitude
                                            ? ` · ${office.latitude}, ${office.longitude} (${office.allowed_radius}m)`
                                            : ''}
                                    </div>
                                </div>
                                <Badge>{office.status}</Badge>
                            </div>

                            <Form action={`/offices/${office.id}`} method="put" className="mt-4 grid gap-2 sm:grid-cols-4">
                                <input type="hidden" name="name" value={office.name} />
                                <input type="hidden" name="code" value={office.code} />
                                <input type="hidden" name="city" value={office.city ?? ''} />
                                <input type="hidden" name="country" value="BD" />
                                <input type="hidden" name="timezone" value="Asia/Dhaka" />
                                <input type="hidden" name="status" value={office.status} />
                                <Input name="latitude" defaultValue={office.latitude ?? ''} placeholder="Latitude" />
                                <Input name="longitude" defaultValue={office.longitude ?? ''} placeholder="Longitude" />
                                <Input name="allowed_radius" defaultValue={office.allowed_radius} placeholder="Radius (m)" />
                                <Button type="submit" variant="outline">Save location</Button>
                            </Form>

                            <ul className="mt-4 space-y-2 text-sm">
                                {office.networks.map((network) => (
                                    <li key={network.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                                        <span>
                                            {network.name}: {network.ip_address ?? network.ip_range ?? 'No IP'}
                                        </span>
                                        <Form action={`/office-networks/${network.id}`} method="delete">
                                            <Button variant="ghost" size="sm" type="submit">
                                                Remove
                                            </Button>
                                        </Form>
                                    </li>
                                ))}
                            </ul>

                            <Form action={`/offices/${office.id}/networks`} method="post" className="mt-4 flex flex-wrap gap-2">
                                <Input name="name" placeholder="Main Office WiFi" required />
                                <Input name="ip_address" placeholder="103.42.10.10" />
                                <Input name="ip_range" placeholder="103.42.10.0/24" />
                                <input type="hidden" name="network_type" value="static_ip" />
                                <input type="hidden" name="status" value="active" />
                                <Button type="submit" variant="outline">
                                    Add network
                                </Button>
                            </Form>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

OfficesIndex.layout = {
    breadcrumbs: [{ title: 'Offices', href: '/offices' }],
};
