import { Form, Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

function passwordStrength(password: string): { score: number; label: string } {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    return { score, label: labels[score] ?? 'Too weak' };
}

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const [password, setPassword] = useState('');
    const strength = useMemo(() => passwordStrength(password), [password]);

    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Create a strong password"
                                passwordrules={passwordRules}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            {password ? (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <span
                                                key={index}
                                                className={cn(
                                                    'h-1.5 flex-1 rounded-full',
                                                    index < strength.score
                                                        ? strength.score >= 4
                                                            ? 'bg-success'
                                                            : strength.score >= 3
                                                              ? 'bg-warning'
                                                              : 'bg-destructive'
                                                        : 'bg-muted',
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Strength: {strength.label}
                                    </p>
                                </div>
                            ) : null}
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm your password"
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing ? <Spinner /> : null}
                            Update password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Choose a new password',
    description: 'Use a strong password you have not used elsewhere.',
};
