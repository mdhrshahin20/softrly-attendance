import { Form, Head } from '@inertiajs/react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { Pagination, type Paginated } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RoleRow = {
    id: number;
    name: string;
    is_system: boolean;
    permissions: string[];
    users_count: number;
};

type Permission = { value: string; label: string };

export default function RolesIndex({ roles, permissions }: { roles: Paginated<RoleRow>; permissions: Permission[] }) {
    return (
        <>
            <Head title="Roles" />
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-semibold">Custom roles</h2>
                    <p className="text-muted-foreground text-sm">
                        Create extra roles and choose their permissions. Default roles cannot be deleted.
                    </p>
                </div>

                <Form action="/settings/roles" method="post" className="max-w-xl space-y-3 rounded-xl border p-4">
                    <Input name="name" placeholder="payroll-admin" required />
                    <div className="grid gap-2 sm:grid-cols-2">
                        {permissions.map((permission) => (
                            <label key={permission.value} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="permissions[]" value={permission.value} />
                                {permission.label}
                            </label>
                        ))}
                    </div>
                    <Button type="submit">Create role</Button>
                </Form>

                <div className="grid gap-4">
                    {roles.data.map((role) => (
                        <div key={role.id} className="rounded-xl border p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{role.name}</div>
                                    <div className="text-muted-foreground text-xs">{role.users_count} users</div>
                                </div>
                                {!role.is_system && (
                                    <DeleteConfirm
                                        action={`/settings/roles/${role.id}`}
                                        title={`Delete ${role.name}?`}
                                        description={`This cannot be undone. Users with this role will lose these permissions.`}
                                    />
                                )}
                            </div>
                            {role.name !== 'tenant-owner' ? (
                                <Form action={`/roles/${role.id}`} method="put" className="space-y-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {permissions.map((permission) => (
                                            <label key={permission.value} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    name="permissions[]"
                                                    value={permission.value}
                                                    defaultChecked={role.permissions.includes(permission.value)}
                                                />
                                                {permission.label}
                                            </label>
                                        ))}
                                    </div>
                                    <Button type="submit" size="sm" variant="outline">
                                        Save permissions
                                    </Button>
                                </Form>
                            ) : (
                                <p className="text-muted-foreground text-sm">Owner always has every permission.</p>
                            )}
                        </div>
                    ))}
                </div>
                <Pagination paginator={roles} />
            </div>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Roles', href: '/settings/roles' },
    ],
};
