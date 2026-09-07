import { Form, Head } from '@inertiajs/react';
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

export default function DomainsIndex({ domains }: { domains: Domain[] }) {
    return (
        <>
            <Head title="Custom domains" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-semibold">Custom domains</h1>
                    <p className="text-muted-foreground text-sm">
                        Point a hostname at this app. Active custom hosts are resolved to this tenant automatically.
                    </p>
                </div>
                <Form action="/settings/domains" method="post" className="flex max-w-xl gap-2">
                    <Input name="hostname" placeholder="hr.acme.com" required />
                    <Button type="submit">Add domain</Button>
                </Form>
                <ul className="max-w-xl space-y-2">
                    {domains.map((domain) => (
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
                                    <Form action={`/settings/domains/${domain.id}`} method="delete">
                                        <Button size="sm" variant="ghost" type="submit">
                                            Remove
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

DomainsIndex.layout = {
    breadcrumbs: [{ title: 'Custom domains', href: '/settings/domains' }],
};
