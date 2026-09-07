import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Lead = {
    id: number;
    company_name: string | null;
    name: string | null;
    email: string;
    source: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    status: string;
    tenant: string | null;
    created_at: string | null;
};

type Props = {
    leads: { data: Lead[] };
    filters: { search: string | null };
    stats: { total: number; converted: number };
};

export default function PlatformLeads({ leads, filters, stats }: Props) {
    return (
        <>
            <Head title="Leads" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Lead tracking</h1>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Total leads</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Converted</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">{stats.converted}</CardContent>
                    </Card>
                </div>
                <form
                    className="flex max-w-md gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get('/platform/leads', { search: String(new FormData(event.currentTarget).get('search') ?? '') });
                    }}
                >
                    <Input name="search" defaultValue={filters.search ?? ''} placeholder="Search email or company" />
                    <Button type="submit" variant="outline">Search</Button>
                </form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3">UTM</th>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.data.map((lead) => (
                                <tr key={lead.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{lead.company_name ?? lead.name}</div>
                                        <div className="text-muted-foreground">{lead.email}</div>
                                        <div className="text-muted-foreground text-xs">{lead.created_at}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {lead.utm_source ?? '—'}
                                        {lead.utm_campaign ? ` / ${lead.utm_campaign}` : ''}
                                    </td>
                                    <td className="px-4 py-3">{lead.tenant ?? '—'}</td>
                                    <td className="px-4 py-3"><Badge>{lead.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

PlatformLeads.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/platform/leads' }],
};
