import { Form, Head } from '@inertiajs/react';
import { Fingerprint, Globe, MapPin, ScanFace, Users, Wifi, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Mode = {
    value: string;
    label: string;
    description: string;
    requires_location: boolean;
};

type FaceSettings = {
    enabled: boolean;
    threshold: number;
    store_selfie: boolean;
    enrolled_count: number;
    total_employees: number;
};

function modeIcon(mode: Mode): LucideIcon {
    if (mode.requires_location) {
        return MapPin;
    }

    if (/network|wifi/i.test(`${mode.label} ${mode.description}`)) {
        return Wifi;
    }

    return Globe;
}

export default function AttendanceSettings({
    mode,
    modes,
    canUseLocation,
    canUseFace = false,
    face,
}: {
    mode: string;
    modes: Mode[];
    canUseLocation: boolean;
    canUseFace?: boolean;
    face?: FaceSettings;
}) {
    const [faceEnabled, setFaceEnabled] = useState(face?.enabled ?? false);
    const [storeSelfie, setStoreSelfie] = useState(face?.store_selfie ?? true);

    return (
        <>
            <Head title="Attendance settings" />
            <div>
                <div>
                    <h2 className="text-lg font-semibold">Attendance mode</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Choose how employees prove they are at work. Employees must follow the
                        active rule every time they check in.
                    </p>
                </div>

                <Form action="/settings/attendance" method="put" className="mt-5 max-w-2xl space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-3">
                                {modes.map((item) => {
                                    const Icon = modeIcon(item);
                                    const disabled = item.requires_location && !canUseLocation;
                                    const selected = mode === item.value;

                                    return (
                                        <label
                                            key={item.value}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                                selected
                                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                                    : 'bg-card hover:border-border',
                                                disabled && 'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="attendance_method"
                                                value={item.value}
                                                defaultChecked={selected}
                                                disabled={disabled}
                                                className="accent-primary mt-1"
                                            />
                                            <span
                                                className={cn(
                                                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                                                    selected
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium">
                                                    {item.label}
                                                </span>
                                                <span className="text-muted-foreground mt-0.5 block text-sm">
                                                    {item.description}
                                                </span>
                                                {item.requires_location && !canUseLocation ? (
                                                    <span className="text-destructive mt-1 block text-xs">
                                                        Requires the location attendance plan.
                                                    </span>
                                                ) : null}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.attendance_method || errors.plan ? (
                                <p className="text-destructive text-sm">
                                    {errors.attendance_method ?? errors.plan}
                                </p>
                            ) : null}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ScanFace className="size-4" />
                                        Face verification
                                    </CardTitle>
                                    <CardDescription>
                                        Adds a face check on top of the mode above. The match is
                                        decided on the server against the descriptor the employee
                                        enrolled — nothing is verified in the browser.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!canUseFace ? (
                                        <p className="text-muted-foreground text-sm">
                                            Face verification is not included in your current plan.
                                        </p>
                                    ) : (
                                        <>
                                            <input type="hidden" name="face_verification" value="0" />
                                            <input type="hidden" name="face_store_selfie" value="0" />

                                            <label className="flex cursor-pointer items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        Require a face check to mark attendance
                                                    </div>
                                                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                                                        Employees must enrol their face and verify it
                                                        at every check-in and check-out.
                                                    </p>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                                                        faceEnabled ? 'bg-primary' : 'bg-muted',
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="face_verification"
                                                        value="1"
                                                        checked={faceEnabled}
                                                        onChange={(event) =>
                                                            setFaceEnabled(event.target.checked)
                                                        }
                                                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                        aria-label="Require face verification"
                                                    />
                                                    <span
                                                        className={cn(
                                                            'bg-background absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm transition-transform',
                                                            faceEnabled && 'translate-x-5',
                                                        )}
                                                    />
                                                </span>
                                            </label>

                                            {faceEnabled ? (
                                                <div className="space-y-4 border-t pt-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="face_match_threshold">
                                                            Match sensitivity
                                                        </Label>
                                                        <Input
                                                            id="face_match_threshold"
                                                            name="face_match_threshold"
                                                            type="number"
                                                            step="0.05"
                                                            min={0.1}
                                                            max={1.2}
                                                            defaultValue={face?.threshold ?? 0.5}
                                                            className="max-w-40"
                                                        />
                                                        <p className="text-muted-foreground text-xs leading-5">
                                                            Lower is stricter. 0.50 is a balanced
                                                            default. Raise it if genuine employees
                                                            are rejected, lower it if impostors get
                                                            through.
                                                        </p>
                                                    </div>

                                                    <label className="flex cursor-pointer items-center justify-between gap-4">
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                Keep the check-in selfie
                                                            </div>
                                                            <p className="text-muted-foreground mt-1 text-xs leading-5">
                                                                Stores a small reference image per
                                                                check-in so HR can review a disputed
                                                                record. Turn off to keep only the match
                                                                score.
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                                                                storeSelfie
                                                                    ? 'bg-primary'
                                                                    : 'bg-muted',
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                name="face_store_selfie"
                                                                value="1"
                                                                checked={storeSelfie}
                                                                onChange={(event) =>
                                                                    setStoreSelfie(event.target.checked)
                                                                }
                                                                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                                aria-label="Keep check-in selfie"
                                                            />
                                                            <span
                                                                className={cn(
                                                                    'bg-background absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm transition-transform',
                                                                    storeSelfie && 'translate-x-5',
                                                                )}
                                                            />
                                                        </span>
                                                    </label>

                                                    <p className="text-muted-foreground flex items-center gap-2 text-xs">
                                                        <Users className="size-3.5" />
                                                        {face?.enrolled_count ?? 0} of{' '}
                                                        {face?.total_employees ?? 0} active employees
                                                        enrolled.
                                                    </p>
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Button type="submit" disabled={processing}>
                                Save attendance settings
                            </Button>
                        </>
                    )}
                </Form>

                <Card className="mt-8 max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">How this protects attendance</CardTitle>
                        <CardDescription>
                            The rule applies to every check-in from every device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground flex items-start gap-2">
                            <Fingerprint className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                            Employees submit attendance only from the office network or GPS radius
                            you authorize under Offices &amp; Wi-Fi.
                        </p>
                        <p className="text-muted-foreground flex items-start gap-2">
                            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                            Network and location checks run server-side, so off-site check-ins are
                            rejected automatically.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AttendanceSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Attendance settings', href: '/settings/attendance' },
    ],
};
