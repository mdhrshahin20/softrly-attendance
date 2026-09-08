import { Form, Head } from '@inertiajs/react';
import { MiniBars } from '@/components/mini-bars';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    settings: {
        ga_measurement_id?: string;
        fb_pixel_id?: string;
        gtm_container_id?: string;
    };
    sources: { source: string; total: number; converted: number }[];
    series: { label: string; key: string; tenants: number; revenue: number; leads: number }[];
    leads: Paginated<{
        id: number;
        email: string;
        company_name: string | null;
        source: string;
        utm_medium: string | null;
        utm_campaign: string | null;
        utm_term: string | null;
        utm_content: string | null;
        referrer: string | null;
        landing_page: string | null;
        status: string;
        created_at: string | null;
    }>;
};

export default function PlatformMarketing({ settings, sources, series, leads }: Props) {
    return (
        <>
            <Head title="Marketing" />
            <PageShell>
                <PageHeader
                    title="Marketing tools"
                    description="Install Google Analytics, Google Tag Manager, and Meta Pixel once. Attribution for every lead is collected automatically."
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tracking pixels</CardTitle>
                            <CardDescription>These load on every public and signed-in page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form action="/platform/marketing" method="put" className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="ga">Google Analytics measurement ID</Label>
                                    <Input id="ga" name="ga_measurement_id" defaultValue={settings.ga_measurement_id ?? ''} placeholder="G-XXXXXXXXXX" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="gtm">Google Tag Manager container</Label>
                                    <Input id="gtm" name="gtm_container_id" defaultValue={settings.gtm_container_id ?? ''} placeholder="GTM-XXXXXXX" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fb">Meta / Facebook Pixel ID</Label>
                                    <Input id="fb" name="fb_pixel_id" defaultValue={settings.fb_pixel_id ?? ''} placeholder="1234567890" />
                                </div>
                                <Button type="submit">Save pixels</Button>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead volume</CardTitle>
                            <CardDescription>Captured from signup, pricing, and UTM links.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MiniBars data={series} valueKey="leads" />
                            <div className="mt-4 space-y-2 text-sm">
                                {sources.map((row) => (
                                    <div key={row.source} className="flex justify-between">
                                        <span className="capitalize">{row.source}</span>
                                        <span>{row.total} · {row.converted} converted</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Source log</CardTitle>
                        <CardDescription>UTM, referrer, and landing page for the latest leads.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Lead</th>
                                        <th className="px-4 py-2">Source</th>
                                        <th className="px-4 py-2">Campaign</th>
                                        <th className="px-4 py-2">Landing</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.data.map((lead) => (
                                        <tr key={lead.id} className="border-t align-top">
                                            <td className="px-4 py-2">
                                                <div className="font-medium">{lead.company_name ?? lead.email}</div>
                                                <div className="text-muted-foreground">{lead.email}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                {lead.source}
                                                {lead.utm_medium ? <div className="text-muted-foreground text-xs">{lead.utm_medium}</div> : null}
                                            </td>
                                            <td className="px-4 py-2">
                                                {lead.utm_campaign ?? '—'}
                                                {lead.utm_content ? <div className="text-muted-foreground text-xs">{lead.utm_content}</div> : null}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="max-w-xs truncate">{lead.landing_page ?? '—'}</div>
                                                <div className="text-muted-foreground max-w-xs truncate text-xs">{lead.referrer ?? ''}</div>
                                            </td>
                                            <td className="px-4 py-2"><Badge>{lead.status}</Badge></td>
                                        </tr>
                                    ))}
                                    {leads.data.length === 0 && (
                                        <tr>
                                            <td className="text-muted-foreground px-4 py-4" colSpan={5}>No leads captured yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination paginator={leads} />
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

PlatformMarketing.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Marketing', href: '/platform/marketing' },
    ],
};
