import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Device = {
    id: number;
    device_name: string | null;
    browser: string | null;
    os: string | null;
    last_ip: string | null;
    last_seen_at: string | null;
    trusted: boolean;
    user: { id: number; name: string; email: string } | null;
    is_mine: boolean;
};

export default function DevicesIndex({ devices, canManage }: { devices: Device[]; canManage: boolean }) {
    return (
        <>
            <Head title="Trusted devices" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-semibold">Trusted devices</h1>
                    <p className="text-muted-foreground text-sm">
                        When attendance requires a trusted device, only devices marked trusted can check in.
                    </p>
                </div>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Device</th>
                                {canManage && <th className="px-4 py-3">User</th>}
                                <th className="px-4 py-3">Last seen</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => (
                                <tr key={device.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{device.device_name ?? 'Unknown device'}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {device.browser} · {device.os} · {device.last_ip}
                                        </div>
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3">{device.user?.name ?? '—'}</td>
                                    )}
                                    <td className="px-4 py-3">{device.last_seen_at ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={device.trusted ? 'default' : 'secondary'}>
                                            {device.trusted ? 'Trusted' : 'Untrusted'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {canManage && (
                                                <Form
                                                    action={device.trusted ? `/devices/${device.id}/untrust` : `/devices/${device.id}/trust`}
                                                    method="post"
                                                >
                                                    <Button size="sm" variant="outline" type="submit">
                                                        {device.trusted ? 'Untrust' : 'Trust'}
                                                    </Button>
                                                </Form>
                                            )}
                                            <Form action={`/devices/${device.id}`} method="delete">
                                                <Button size="sm" variant="ghost" type="submit">
                                                    Remove
                                                </Button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {devices.length === 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-4 py-8" colSpan={5}>
                                        No devices captured yet. Check in once to register this browser.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

DevicesIndex.layout = {
    breadcrumbs: [{ title: 'Devices', href: '/devices' }],
};
