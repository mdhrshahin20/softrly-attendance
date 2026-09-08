import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage().props;
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (status === 'verification-link-sent') {
            setCooldown(COOLDOWN_SECONDS);
        }
    }, [status]);

    useEffect(() => {
        if (cooldown <= 0) {
            return;
        }

        const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    return (
        <>
            <Head title="Email verification" />

            <div className="space-y-6">
                {status === 'verification-link-sent' ? (
                    <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-foreground">
                        A new verification link has been sent
                        {auth.user?.email ? (
                            <>
                                {' '}
                                to <span className="font-medium">{auth.user.email}</span>
                            </>
                        ) : (
                            ' to your email'
                        )}
                        .
                    </div>
                ) : (
                    <div className="bg-muted/60 rounded-xl border px-4 py-3 text-sm leading-6">
                        We&apos;ve sent a verification link
                        {auth.user?.email ? (
                            <>
                                {' '}
                                to <span className="font-medium">{auth.user.email}</span>
                            </>
                        ) : (
                            ' to your email'
                        )}
                        . Open the link to activate your workspace.
                    </div>
                )}

                <Form {...send.form()} className="space-y-4">
                    {({ processing }) => (
                        <>
                            <Button
                                className="w-full"
                                disabled={processing || cooldown > 0}
                                variant="secondary"
                            >
                                {processing ? <Spinner /> : null}
                                {cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : 'Resend verification email'}
                            </Button>
                            <p className="text-muted-foreground text-center text-sm">
                                Wrong email?{' '}
                                <TextLink href={logout()} method="post" as="button">
                                    Sign out and try again
                                </TextLink>
                            </p>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description: "We've sent a verification link to your email. Confirm it to continue.",
};
