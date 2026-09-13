import { Form, Head } from '@inertiajs/react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Domain = {
    id: number;
    hostname: string;
    type: string;
    is_primary: boolean;
    status: string;
};

export default function DomainsIndex({ domains }: { domains: Paginated<Domain> }) {
    return (
        <>
            <Head title="Custom domains" />
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-semibold">Custom domains</h2>
                    <p className="text-muted-foreground text-sm">
                        Point a hostname at this app. Active custom hosts are resolved to this tenant automatically.
                    </p>
                </div>
                <Form action="/settings/domains" method="post" className="flex max-w-xl gap-2">
                    <Input name="hostname" placeholder="hr.acme.com" required />
                    <Button type="submit">Add domain</Button>
                </Form>
                <ul className="max-w-xl space-y-2">
                    {domains.data.map((domain) => (
                        <li key={domain.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <div>
                                <div className="font-medium">{domain.hostname}</div>
                                <div className="text-muted-foreground text-xs">
                                    {domain.type} · {domain.status}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {domain.is_primary && <Badge>Primary</Badge>}
                                {domain.type === 'custom' && (
                                    <DeleteConfirm
                                        action={`/settings/domains/${domain.id}`}
                                        title={`Remove ${domain.hostname}?`}
                                        description={`${domain.hostname} will stop pointing at this workspace.`}
                                        triggerLabel="Remove"
                                        confirmLabel="Remove"
                                    />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                <Pagination paginator={domains} />
            </div>
        </>
    );
}

DomainsIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Custom domains', href: '/settings/domains' },
    ],
};
