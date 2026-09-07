import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PreviewRow = {
    line: number;
    data: Record<string, string>;
    valid: boolean;
    error: string | null;
};

type Preview = {
    headers: string[];
    rows: PreviewRow[];
    valid: number;
    invalid: number;
};

export default function EmployeeImport({ preview }: { preview?: Preview | null }) {

    return (
        <>
            <Head title="Import employees" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-semibold">Import employees</h1>
                    <p className="text-muted-foreground text-sm">
                        Upload a CSV, preview validation, then import valid rows.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href="/employees/import/template">Download template</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/employees">Back to employees</Link>
                    </Button>
                </div>
                <Form
                    action="/employees/import/preview"
                    method="post"
                    encType="multipart/form-data"
                    className="flex max-w-xl items-end gap-2"
                >
                    <Input type="file" name="file" accept=".csv,text/csv" required />
                    <Button type="submit">Preview</Button>
                </Form>
                {preview && (
                    <div className="space-y-4">
                        <p className="text-sm">
                            {preview.valid} valid · {preview.invalid} invalid
                        </p>
                        <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-3 py-2">Line</th>
                                        <th className="px-3 py-2">Code</th>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">Email</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row) => (
                                        <tr key={row.line} className="border-t">
                                            <td className="px-3 py-2">{row.line}</td>
                                            <td className="px-3 py-2">{row.data.employee_code}</td>
                                            <td className="px-3 py-2">
                                                {row.data.first_name} {row.data.last_name}
                                            </td>
                                            <td className="px-3 py-2">{row.data.email}</td>
                                            <td className="px-3 py-2">
                                                {row.valid ? 'Ready' : row.error}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {preview.valid > 0 && (
                            <Form action="/employees/import" method="post">
                                <Button type="submit">Import {preview.valid} employees</Button>
                            </Form>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

EmployeeImport.layout = {
    breadcrumbs: [
        { title: 'Employees', href: '/employees' },
        { title: 'Import', href: '/employees/import' },
    ],
};
