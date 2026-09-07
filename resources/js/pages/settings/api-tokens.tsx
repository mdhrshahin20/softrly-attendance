import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Token = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string | null;
};

export default function ApiTokensIndex({
    tokens,
    plainToken,
}: {
    tokens: Token[];
    plainToken?: string | null;
}) {
    return (
        <>
            <Head title="API tokens" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-semibold">API tokens</h1>
                    <p className="text-muted-foreground text-sm">
                        Use <code>Authorization: Bearer TOKEN</code> against <code>/api/v1/</code> for attendance and leave.
                    </p>
                </div>
                {plainToken && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
                        Copy this token now. It will not be shown again.
                        <pre className="mt-2 overflow-x-auto rounded bg-white p-2">{plainToken}</pre>
                    </div>
                )}
                <Form action="/settings/api-tokens" method="post" className="flex max-w-md gap-2">
                    <Input name="name" placeholder="Mobile app" required />
                    <Button type="submit">Create token</Button>
                </Form>
                <ul className="max-w-xl space-y-2">
                    {tokens.map((token) => (
                        <li key={token.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <div>
                                <div className="font-medium">{token.name}</div>
                                <div className="text-muted-foreground text-xs">
                                    Created {token.created_at} · Last used {token.last_used_at ?? 'never'}
                                </div>
                            </div>
                            <Form action={`/settings/api-tokens/${token.id}`} method="delete">
                                <Button size="sm" variant="ghost" type="submit">
                                    Revoke
                                </Button>
                            </Form>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

ApiTokensIndex.layout = {
    breadcrumbs: [{ title: 'API tokens', href: '/settings/api-tokens' }],
};
