import { Form, Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CatalogItem = {
    name: string;
    label: string;
    enabled: boolean;
    configured: boolean;
    default: boolean;
};

type Props = {
    payments: Record<string, unknown>;
    mail: Record<string, unknown>;
    sms: Record<string, unknown>;
    catalog: CatalogItem[];
    recentMessages: Paginated<{
        id: number;
        channel: string;
        driver: string | null;
        to: string;
        subject: string | null;
        status: string;
        created_at: string | null;
    }>;
};

function str(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

function bool(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
}

export default function PlatformGateways({ payments, mail, sms, catalog, recentMessages }: Props) {
    return (
        <>
            <Head title="Gateways" />
            <PageShell>
                <PageHeader
                    title="Payment, email & SMS"
                    description="Connect SSLCommerz, bKash, SMTP / Amazon SES / Brevo, and SMS. More payment drivers can be added the same way."
                />
                <div className="flex flex-wrap gap-2">
                    {catalog.map((item) => (
                        <Badge key={item.name} variant={item.configured ? 'default' : 'secondary'}>
                            {item.label}
                            {item.default ? ' · default' : ''}
                            {item.configured ? ' · ready' : ' · setup needed'}
                        </Badge>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Payment gateways</CardTitle>
                        <CardDescription>
                            Manual stays available for demos and bank transfers. Enable SSLCommerz or bKash when you have merchant credentials. Live checkout redirects only after credentials are saved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form action="/platform/gateways/payments" method="put" className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="default_gateway">Default gateway</Label>
                                    <select id="default_gateway" name="default_gateway" defaultValue={str(payments.default_gateway) || 'manual'} className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                                        <option value="manual">Manual / bank transfer</option>
                                        <option value="sslcommerz">SSLCommerz</option>
                                        <option value="bkash">bKash</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="mode">Mode</Label>
                                    <select id="mode" name="mode" defaultValue={str(payments.mode) || 'sandbox'} className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                                        <option value="sandbox">Sandbox</option>
                                        <option value="live">Live</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-lg border p-4">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input type="hidden" name="sslcommerz_enabled" value="0" />
                                        <input type="checkbox" name="sslcommerz_enabled" value="1" defaultChecked={bool(payments['sslcommerz.enabled'])} />
                                        Enable SSLCommerz
                                    </label>
                                    <Input name="sslcommerz_store_id" defaultValue={str(payments['sslcommerz.store_id'])} placeholder="Store ID" />
                                    <Input name="sslcommerz_store_password" type="password" placeholder="Store password" />
                                </div>
                                <div className="space-y-3 rounded-lg border p-4">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input type="hidden" name="bkash_enabled" value="0" />
                                        <input type="checkbox" name="bkash_enabled" value="1" defaultChecked={bool(payments['bkash.enabled'])} />
                                        Enable bKash
                                    </label>
                                    <Input name="bkash_app_key" defaultValue={str(payments['bkash.app_key'])} placeholder="App key" />
                                    <Input name="bkash_app_secret" type="password" placeholder="App secret" />
                                    <Input name="bkash_username" defaultValue={str(payments['bkash.username'])} placeholder="Username" />
                                    <Input name="bkash_password" type="password" placeholder="Password" />
                                </div>
                            </div>
                            <Button type="submit">Save payment gateways</Button>
                        </Form>
                    </CardContent>
                </Card>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email (SMTP / SES / Brevo)</CardTitle>
                            <CardDescription>Invoices, trials, cancellations, and leave notices use this gateway.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Form action="/platform/gateways/mail" method="put" className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="mail_driver">Driver</Label>
                                    <select id="mail_driver" name="driver" defaultValue={str(mail.driver) || 'log'} className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                                        <option value="log">Log (local)</option>
                                        <option value="smtp">SMTP</option>
                                        <option value="ses">Amazon SES (SMTP)</option>
                                        <option value="brevo">Brevo</option>
                                    </select>
                                </div>
                                <Input name="from_address" type="email" defaultValue={str(mail.from_address)} placeholder="From address" required />
                                <Input name="from_name" defaultValue={str(mail.from_name)} placeholder="From name" required />
                                <Input name="smtp_host" defaultValue={str(mail.smtp_host)} placeholder="SMTP host" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input name="smtp_port" type="number" defaultValue={str(mail.smtp_port)} placeholder="Port" />
                                    <Input name="smtp_encryption" defaultValue={str(mail.smtp_encryption)} placeholder="tls or ssl" />
                                </div>
                                <Input name="smtp_username" defaultValue={str(mail.smtp_username)} placeholder="SMTP username" />
                                <Input name="smtp_password" type="password" placeholder={str(mail.smtp_password) ? 'Password saved' : 'SMTP password'} />
                                <Input name="ses_region" defaultValue={str(mail.ses_region)} placeholder="SES region" />
                                <Input name="ses_host" defaultValue={str(mail.ses_host)} placeholder="SES SMTP host (optional)" />
                                <Input name="ses_username" defaultValue={str(mail.ses_username)} placeholder="SES SMTP username" />
                                <Input name="ses_password" type="password" placeholder={str(mail.ses_password) ? 'SES password saved' : 'SES SMTP password'} />
                                <Input name="brevo_login" defaultValue={str(mail.brevo_login)} placeholder="Brevo SMTP login" />
                                <Input name="brevo_key" type="password" placeholder={str(mail.brevo_key) ? 'Brevo key saved' : 'Brevo SMTP key'} />
                                <Button type="submit">Save email</Button>
                            </Form>
                            <Form action="/platform/gateways/mail/test" method="post" className="flex gap-2">
                                <Input name="to" type="email" required placeholder="Send test to" />
                                <Button type="submit" variant="outline">Send test</Button>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>SMS gateway</CardTitle>
                            <CardDescription>BulkSMSBD, SSL Wireless, or a generic HTTP endpoint. Log driver writes messages locally.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Form action="/platform/gateways/sms" method="put" className="space-y-3">
                                <select name="driver" defaultValue={str(sms.driver) || 'log'} className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                                    <option value="log">Log (local)</option>
                                    <option value="bulksmsbd">BulkSMSBD</option>
                                    <option value="sslwireless">SSL Wireless</option>
                                    <option value="http">Custom HTTP</option>
                                </select>
                                <Input name="sender_id" defaultValue={str(sms.sender_id)} placeholder="Sender ID" />
                                <Input name="api_url" defaultValue={str(sms.api_url)} placeholder="API URL (custom / SSL Wireless)" />
                                <Input name="api_key" type="password" placeholder={str(sms.api_key) ? 'API key saved' : 'API key'} />
                                <Input name="api_secret" type="password" placeholder={str(sms.api_secret) ? 'API secret saved' : 'API secret'} />
                                <Button type="submit">Save SMS</Button>
                            </Form>
                            <Form action="/platform/gateways/sms/test" method="post" className="flex gap-2">
                                <Input name="to" required placeholder="01XXXXXXXXX" />
                                <Button type="submit" variant="outline">Send test SMS</Button>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Channel</th>
                                        <th className="px-4 py-2">To</th>
                                        <th className="px-4 py-2">Subject</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentMessages.data.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="px-4 py-2">{row.channel} · {row.driver}</td>
                                            <td className="px-4 py-2">{row.to}</td>
                                            <td className="px-4 py-2">{row.subject ?? '—'}</td>
                                            <td className="px-4 py-2"><Badge>{row.status}</Badge></td>
                                        </tr>
                                    ))}
                                    {recentMessages.data.length === 0 && (
                                        <tr>
                                            <td className="text-muted-foreground px-4 py-4" colSpan={4}>No messages sent yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination paginator={recentMessages} />
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

PlatformGateways.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Gateways', href: '/platform/gateways' },
    ],
};
