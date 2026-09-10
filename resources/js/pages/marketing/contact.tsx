import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
    const [sent, setSent] = useState(false);

    return (
        <>
            <Head title="Contact">
                <meta
                    head-key="description"
                    name="description"
                    content="Contact Attendrly for product questions, demos, and enterprise support."
                />
            </Head>
            <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
                <div>
                    <p className="text-primary text-sm font-medium">Contact</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Talk to the Attendrly team</h1>
                    <p className="text-muted-foreground mt-4 text-base leading-7">
                        Questions about plans, onboarding, or office network attendance? Send a note and
                        we’ll get back to you.
                    </p>
                    <div className="mt-8 space-y-3 text-sm">
                        <p>
                            <span className="font-medium">Email:</span>{' '}
                            <a className="text-primary hover:underline" href="mailto:hello@softrly.com">
                                hello@softrly.com
                            </a>
                        </p>
                        <p className="text-muted-foreground">
                            Prefer to explore first?{' '}
                            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
                                View pricing
                            </Link>
                            .
                        </p>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border p-6 sm:p-8">
                    {sent ? (
                        <div>
                            <h2 className="text-xl font-semibold">Message ready</h2>
                            <p className="text-muted-foreground mt-2 text-sm leading-6">
                                Your mail client should open with the details filled in. If it didn’t,
                                email us directly at hello@softrly.com.
                            </p>
                            <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
                                Send another
                            </Button>
                        </div>
                    ) : (
                        <form
                            className="grid gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                const name = String(data.get('name') ?? '');
                                const email = String(data.get('email') ?? '');
                                const company = String(data.get('company') ?? '');
                                const message = String(data.get('message') ?? '');
                                const subject = encodeURIComponent(`Attendrly inquiry from ${name}`);
                                const body = encodeURIComponent(
                                    `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`,
                                );
                                window.location.href = `mailto:hello@softrly.com?subject=${subject}&body=${body}`;
                                setSent(true);
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required placeholder="Your name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Work email</Label>
                                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="company">Company</Label>
                                <Input id="company" name="company" placeholder="Company name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">Message</Label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    className="border-input focus-visible:ring-ring rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <Button type="submit">Send message</Button>
                        </form>
                    )}
                </div>
            </section>
        </>
    );
}
