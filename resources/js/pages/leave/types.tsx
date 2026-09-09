import { Form, Head } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ActionDialog } from '@/components/action-dialog';
import { DataTable } from '@/components/data-table';
import { DeleteConfirm } from '@/components/delete-confirm';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LeaveType = {
    id: number;
    name: string;
    code: string;
    days_per_year: number;
    is_paid: boolean;
    carry_forward: boolean;
    maximum_carry_forward: number;
    requires_attachment: boolean;
    minimum_notice_days: number;
    status: string;
};

type FormState = LeaveType | null;

function BooleanField({
    name,
    label,
    defaultValue = false,
}: {
    name: string;
    label: string;
    defaultValue?: boolean;
}) {
    const [checked, setChecked] = useState(defaultValue);

    return (
        <label className="flex items-center gap-2 text-sm">
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => setChecked(Boolean(value))}
                aria-label={label}
            />
            <input type="hidden" name={name} value={checked ? '1' : '0'} />
            {label}
        </label>
    );
}

function TypeDialog({
    open,
    onOpenChange,
    state,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    state: FormState;
    onSuccess: () => void;
}) {
    const isEdit = state !== null;
    const action = isEdit ? `/leave/types/${state?.id}` : '/leave/types';

    return (
        <ActionDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? `Edit ${state?.name}` : 'Create leave type'}
            description="Leave types define the rules employees can apply against."
        >
            {() => (
                <Form
                    action={action}
                    method={isEdit ? 'put' : 'post'}
                    options={{ preserveScroll: true, onSuccess } as never}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={state?.name ?? ''}
                                        placeholder="Casual leave"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        defaultValue={state?.code ?? ''}
                                        placeholder="CL"
                                        className="font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="days_per_year">Days / year</Label>
                                    <Input
                                        id="days_per_year"
                                        name="days_per_year"
                                        type="number"
                                        min={0}
                                        max={365}
                                        defaultValue={state?.days_per_year ?? 10}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="minimum_notice_days">Notice (days)</Label>
                                    <Input
                                        id="minimum_notice_days"
                                        name="minimum_notice_days"
                                        type="number"
                                        min={0}
                                        max={60}
                                        defaultValue={state?.minimum_notice_days ?? 1}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        defaultValue={state?.status ?? 'active'}
                                        className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border bg-muted/30 p-3">
                                <BooleanField
                                    name="is_paid"
                                    label="Paid leave"
                                    defaultValue={state?.is_paid ?? true}
                                />
                                <BooleanField
                                    name="requires_attachment"
                                    label="Requires attachment"
                                    defaultValue={state?.requires_attachment ?? false}
                                />
                                <BooleanField
                                    name="carry_forward"
                                    label="Carry forward unused days"
                                    defaultValue={state?.carry_forward ?? false}
                                />
                            </div>

                            {errors.name || errors.code ? (
                                <p className="text-destructive text-sm">
                                    {errors.name ?? errors.code}
                                </p>
                            ) : null}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Save changes' : 'Create type'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            )}
        </ActionDialog>
    );
}

export default function LeaveTypes({ types }: { types: Paginated<LeaveType> }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editState, setEditState] = useState<FormState>(null);

    function openCreate() {
        setEditState(null);
        setDialogOpen(true);
    }

    function openEdit(type: LeaveType) {
        setEditState(type);
        setDialogOpen(true);
    }

    return (
        <>
            <Head title="Leave types" />
            <PageShell>
                <PageHeader
                    title="Leave types"
                    description="Configure the leave categories employees can request."
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Add type
                        </Button>
                    }
                />

                {types.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Pencil}
                            title="No leave types yet"
                            description="Create your first leave type to let employees apply."
                            action={
                                <Button onClick={openCreate}>Add leave type</Button>
                            }
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Code</th>
                                    <th scope="col">Days / year</th>
                                    <th scope="col">Notice</th>
                                    <th scope="col">Policy</th>
                                    <th scope="col">Status</th>
                                    <th scope="col" className="text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {types.data.map((type) => (
                                    <tr key={type.id}>
                                        <td className="font-medium">{type.name}</td>
                                        <td className="font-mono text-xs">{type.code}</td>
                                        <td className="tabular-nums">{type.days_per_year}</td>
                                        <td className="tabular-nums">
                                            {type.minimum_notice_days}d
                                        </td>
                                        <td className="text-muted-foreground text-sm">
                                            <PolicyTags type={type} />
                                        </td>
                                        <td>
                                            <StatusBadge status={type.status} />
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(type)}
                                                >
                                                    <Pencil className="size-3.5" />
                                                    Edit
                                                </Button>
                                                <DeleteConfirm
                                                    action={`/leave/types/${type.id}`}
                                                    title={`Delete ${type.name}?`}
                                                    description="Requests already using this type are kept, but it can no longer be selected."
                                                    confirmLabel="Delete"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                        <Pagination paginator={types} />
                    </>
                )}
            </PageShell>

            <TypeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                state={editState}
                onSuccess={() => setDialogOpen(false)}
            />
        </>
    );
}

function PolicyTags({ type }: { type: LeaveType }) {
    const tags: ReactNode[] = [];

    if (type.is_paid) {
        tags.push('Paid');
    } else {
        tags.push('Unpaid');
    }

    if (type.requires_attachment) {
        tags.push('Attachment required');
    }

    if (type.carry_forward) {
        tags.push(`Carries ${type.maximum_carry_forward}d`);
    }

    return <>{tags.length > 0 ? tags.join(' · ') : '—'}</>;
}

LeaveTypes.layout = {
    breadcrumbs: [
        { title: 'Leave', href: '/leave' },
        { title: 'Types', href: '/leave/types' },
    ],
};
