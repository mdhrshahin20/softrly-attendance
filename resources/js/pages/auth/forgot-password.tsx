import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            {status ? (
                <div className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-foreground">
                    {status}
                </div>
            ) : null}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@company.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                ) : null}
                                Send reset link
                            </Button>
                        </>
                    )}
                </Form>

                <div className="text-muted-foreground text-center text-sm">
                    Remembered your password?{' '}
                    <TextLink href={login()}>Sign in</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Reset your password',
    description: 'Enter your email and we will send you a secure reset link.',
};
