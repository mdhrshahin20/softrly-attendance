import { Form, Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Option = { id: number; name?: string; first_name?: string; last_name?: string; department_id?: number | null };

type Employee = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string | null;
    email: string;
    phone: string | null;
    department_id: number | null;
    designation_id: number | null;
    office_id: number | null;
    shift_id: number | null;
    manager_id: number | null;
    joining_date: string | null;
    employment_type: string;
    status: string;
    role?: string | null;
};

type Props = {
    employee: Employee | null;
    departments: Option[];
    designations: Option[];
    offices: Option[];
    shifts: Option[];
    managers: Option[];
    employmentTypes: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    roles?: { value: string; label: string }[];
};

const fieldClass =
    'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none';

export default function EmployeeForm({
    employee,
    departments,
    designations,
    offices,
    shifts,
    managers,
    employmentTypes,
    statuses,
    roles = [],
}: Props) {
    const action = employee ? `/employees/${employee.id}` : '/employees';

    return (
        <>
            <Head title={employee ? 'Edit employee' : 'Add employee'} />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {employee ? 'Edit employee' : 'Add employee'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        An invitation-ready login is created with the employee record.
                    </p>
                </div>

                <Form
                    action={action}
                    method={employee ? 'put' : 'post'}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Employee code" error={errors.employee_code}>
                                    <Input name="employee_code" defaultValue={employee?.employee_code} required />
                                </Field>
                                <Field label="Email" error={errors.email}>
                                    <Input type="email" name="email" defaultValue={employee?.email} required />
                                </Field>
                                <Field label="First name" error={errors.first_name}>
                                    <Input name="first_name" defaultValue={employee?.first_name} required />
                                </Field>
                                <Field label="Last name" error={errors.last_name}>
                                    <Input name="last_name" defaultValue={employee?.last_name ?? ''} />
                                </Field>
                                <Field label="Phone" error={errors.phone}>
                                    <Input name="phone" defaultValue={employee?.phone ?? ''} />
                                </Field>
                                <Field label="Joining date" error={errors.joining_date}>
                                    <Input type="date" name="joining_date" defaultValue={employee?.joining_date ?? ''} />
                                </Field>
                                <Field label="Department" error={errors.department_id}>
                                    <select name="department_id" defaultValue={employee?.department_id ?? ''} className={fieldClass}>
                                        <option value="">None</option>
                                        {departments.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Designation" error={errors.designation_id}>
                                    <select name="designation_id" defaultValue={employee?.designation_id ?? ''} className={fieldClass}>
                                        <option value="">None</option>
                                        {designations.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Office" error={errors.office_id}>
                                    <select name="office_id" defaultValue={employee?.office_id ?? ''} className={fieldClass}>
                                        <option value="">None</option>
                                        {offices.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Shift" error={errors.shift_id}>
                                    <select name="shift_id" defaultValue={employee?.shift_id ?? ''} className={fieldClass}>
                                        <option value="">None</option>
                                        {shifts.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Manager" error={errors.manager_id}>
                                    <select name="manager_id" defaultValue={employee?.manager_id ?? ''} className={fieldClass}>
                                        <option value="">None</option>
                                        {managers.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.first_name} {item.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Employment type" error={errors.employment_type}>
                                    <select name="employment_type" defaultValue={employee?.employment_type ?? 'permanent'} className={fieldClass}>
                                        {employmentTypes.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Status" error={errors.status}>
                                    <select name="status" defaultValue={employee?.status ?? 'active'} className={fieldClass}>
                                        {statuses.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </Field>
                                {roles.length > 0 && (
                                    <Field label="Role" error={errors.role}>
                                        <select name="role" defaultValue={employee?.role ?? 'employee'} className={fieldClass}>
                                            {roles.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                )}
                                {!employee && (
                                    <Field label="Temporary password" error={errors.password}>
                                        <Input name="password" type="password" placeholder="Optional" />
                                    </Field>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/employees">Cancel</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

EmployeeForm.layout = {
    breadcrumbs: [
        { title: 'Employees', href: '/employees' },
        { title: 'Form', href: '/employees/create' },
    ],
};
