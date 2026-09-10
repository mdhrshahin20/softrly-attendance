import { Form, Head, Link } from '@inertiajs/react';
import { CheckCircle2, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { FaceCameraPreview } from '@/components/face-camera-preview';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useFaceCamera } from '@/hooks/use-face-camera';

const REQUIRED_SAMPLES = 3;

/**
 * Inertia surfaces nested validation keys as literal dotted names
 * (e.g. "descriptors.0"), so match on the prefix.
 */
function firstError(errors: Record<string, string>, prefix: string): string | undefined {
    const match = Object.keys(errors).find(
        (key) => key === prefix || key.startsWith(`${prefix}.`),
    );

    return match ? errors[match] : undefined;
}

type Props = {
    enrolled: boolean;
    enrolledAt: string | null;
    sampleCount: number | null;
    hasPhoto: boolean;
    required: boolean;
    threshold: number;
    employeeCode: string | null;
    canEnrol: boolean;
};

export default function FaceEnrol({
    enrolled,
    enrolledAt,
    sampleCount,
    hasPhoto,
    required,
    threshold,
    employeeCode,
    canEnrol,
}: Props) {
    const { videoRef, status, error, start, capture } = useFaceCamera(true);
    const [samples, setSamples] = useState<number[][]>([]);
    const [selfie, setSelfie] = useState<string>('');
    const [capturing, setCapturing] = useState(false);

    const ready = status === 'ready';

    async function addSample() {
        setCapturing(true);

        try {
            const result = await capture();

            if (result !== null) {
                setSamples((current) => [...current, result.descriptor]);
                // Keep the clearest (first) frame as the reference photo.
                setSelfie((current) => current || result.selfie);
            }
        } finally {
            setCapturing(false);
        }
    }

    function reset() {
        setSamples([]);
        setSelfie('');
    }

    return (
        <>
            <Head title="Face verification" />
            <PageShell>
                <PageHeader
                    title="Face verification"
                    description="Enrol your face once, then verify it when you check in and out."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                            <CardDescription>
                                {required
                                    ? 'Your workspace requires face verification at check-in.'
                                    : 'Face verification is available but not currently required.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {enrolled ? (
                                    <StatusBadge
                                        status="active"
                                        label="Face enrolled"
                                    />
                                ) : (
                                    <StatusBadge
                                        status="pending"
                                        label="Not enrolled"
                                    />
                                )}
                                {enrolledAt ? (
                                    <span className="text-muted-foreground text-xs">
                                        since{' '}
                                        {new Date(
                                            enrolledAt,
                                        ).toLocaleDateString()}
                                    </span>
                                ) : null}
                            </div>

                            <dl className="space-y-1.5 text-sm">
                                {employeeCode ? (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Employee
                                        </dt>
                                        <dd className="font-medium">
                                            {employeeCode}
                                        </dd>
                                    </div>
                                ) : null}
                                {enrolled && sampleCount ? (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Samples averaged
                                        </dt>
                                        <dd className="font-medium">
                                            {sampleCount}
                                        </dd>
                                    </div>
                                ) : null}
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Match sensitivity
                                    </dt>
                                    <dd className="font-medium">
                                        {threshold.toFixed(2)}
                                    </dd>
                                </div>
                            </dl>

                            <p className="text-muted-foreground text-xs leading-5">
                                Only a numeric face descriptor is stored — it
                                cannot be turned back into a picture.{' '}
                                {hasPhoto
                                    ? 'A reference photo is also kept so you or HR can review the enrolment.'
                                    : 'No photo is kept on file.'}
                            </p>

                            {enrolled ? (
                                <div className="flex flex-wrap gap-2 border-t pt-4">
                                    <DeleteConfirm
                                        action="/face"
                                        title="Remove your face data?"
                                        description="Your stored descriptor and reference photo will be permanently deleted. You will not be able to check in until you enrol again."
                                        confirmLabel="Remove face data"
                                        triggerLabel={
                                            <>
                                                <Trash2 className="size-3.5" />
                                                Remove face data
                                            </>
                                        }
                                    />
                                    {hasPhoto ? (
                                        <Button variant="outline" asChild>
                                            <a
                                                href="/face/photo"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                View reference photo
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {enrolled
                                    ? 'Re-enrol your face'
                                    : 'Enrol your face'}
                            </CardTitle>
                            <CardDescription>
                                Capture {REQUIRED_SAMPLES} samples. Slight
                                changes in angle improve matching accuracy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!canEnrol ? (
                                <p className="text-muted-foreground text-sm">
                                    Face verification is not included in your
                                    current plan.
                                </p>
                            ) : (
                                <>
                                    <FaceCameraPreview
                                        videoRef={videoRef}
                                        status={status}
                                        error={error}
                                        onStart={start}
                                    />

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            onClick={addSample}
                                            disabled={
                                                !ready ||
                                                capturing ||
                                                samples.length >=
                                                    REQUIRED_SAMPLES
                                            }
                                        >
                                            <ScanFace className="size-4" />
                                            {capturing
                                                ? 'Capturing…'
                                                : samples.length === 0
                                                  ? 'Capture face'
                                                  : 'Capture another angle'}
                                        </Button>
                                        {samples.length > 0 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={reset}
                                            >
                                                Reset
                                            </Button>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {Array.from({
                                            length: REQUIRED_SAMPLES,
                                        }).map((_, index) => (
                                            <span
                                                key={index}
                                                className={`h-1.5 flex-1 rounded-full ${
                                                    index < samples.length
                                                        ? 'bg-primary'
                                                        : 'bg-muted'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                            {samples.length}/{REQUIRED_SAMPLES}
                                        </span>
                                    </div>

                                    <Form
                                        action="/face"
                                        method="post"
                                        className="border-t pt-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="descriptors"
                                                    value={JSON.stringify(
                                                        samples,
                                                    )}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="selfie"
                                                    value={selfie}
                                                />
                                                {errors.face ? (
                                                    <p className="text-destructive mb-2 text-sm">
                                                        {errors.face}
                                                    </p>
                                                ) : null}
                                                {firstError(errors, 'descriptors') ? (
                                                    <p className="text-destructive mb-2 text-sm">
                                                        {firstError(errors, 'descriptors')}
                                                    </p>
                                                ) : null}
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        samples.length < 1
                                                    }
                                                    className="w-full"
                                                >
                                                    <ShieldCheck className="size-4" />
                                                    {processing
                                                        ? 'Saving…'
                                                        : enrolled
                                                          ? 'Replace my face data'
                                                          : 'Save my face'}
                                                </Button>
                                                <p className="text-muted-foreground mt-2 text-xs">
                                                    By saving, you consent to
                                                    Attendrly storing your face
                                                    descriptor for attendance
                                                    verification. You can remove
                                                    it at any time.
                                                </p>
                                            </>
                                        )}
                                    </Form>

                                    {samples.length >= REQUIRED_SAMPLES ? (
                                        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                                            <CheckCircle2 className="size-3.5" />
                                            Ready to save.
                                        </p>
                                    ) : null}
                                </>
                            )}

                            <p className="text-muted-foreground border-t pt-3 text-xs">
                                Prefer not to use face verification?{' '}
                                <Link href="/dashboard" className="underline">
                                    Go back to your dashboard
                                </Link>{' '}
                                and ask HR to record your attendance manually.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </PageShell>
        </>
    );
}

FaceEnrol.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Face verification', href: '/face' },
    ],
};
