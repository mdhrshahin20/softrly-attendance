import { Form, Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';

type Payslip = {
    id: number;
    period: string | null;
    status: string | null;
    status_label: string | null;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    designation: string | null;
    office: string | null;
    working_days: number;
    present_days: number;
    late_days: number;
    leave_days: number;
    absent_days: number;
    overtime_minutes: number;
    late_minutes: number;
    basic_salary: number;
    house_rent: number;
    medical: number;
    other_allowance: number;
    overtime_pay: number;
    absence_deduction: number;
    late_deduction: number;
    advance_deduction: number;
    tax: number;
    gross: number;
    deductions: number;
    net: number;
    paid_at: string | null;
    can_pay: boolean;
};

function Line({ label, amount, currency }: { label: string; amount: number; currency: string }) {
    if (!amount) {
        return null;
    }

    return (
        <div className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <span>{formatMoney(amount, currency)}</span>
        </div>
    );
}

export default function PayslipShow({
    payslip,
    currency,
    backHref,
}: {
    payslip: Payslip;
    currency: string;
    backHref: string;
}) {
    return (
        <>
            <Head title={`Payslip · ${payslip.period}`} />
            <PageShell className="max-w-3xl">
                <PageHeader
                    title={payslip.period ?? 'Payslip'}
                    description="Attendance-linked salary for this period."
                    leading={
                        <PersonIdentity
                            name={payslip.employee ?? 'Employee'}
                            avatar={payslip.avatar}
                            size="lg"
                            hideText
                        />
                    }
                    actions={
                        <div className="flex gap-2">
                            {payslip.can_pay ? (
                                <Form action={`/payroll/payslips/${payslip.id}/pay`} method="post">
                                    <Button type="submit">Mark as paid</Button>
                                </Form>
                            ) : null}
                            <Button variant="outline" asChild>
                                <Link href={backHref}>Back</Link>
                            </Button>
                        </div>
                    }
                />

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>{payslip.employee}</CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {[payslip.employee_code, payslip.designation, payslip.department, payslip.office]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        {payslip.status ? (
                            <StatusBadge
                                status={payslip.status}
                                label={payslip.status_label ?? payslip.status}
                                withIcon={false}
                            />
                        ) : null}
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                            <Stat label="Working days" value={payslip.working_days} />
                            <Stat label="Present" value={payslip.present_days} />
                            <Stat label="Leave" value={payslip.leave_days} />
                            <Stat label="Absent" value={payslip.absent_days} />
                            <Stat label="Late min" value={payslip.late_minutes} />
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">Earnings</h3>
                                <Line label="Basic" amount={payslip.basic_salary} currency={currency} />
                                <Line label="House rent" amount={payslip.house_rent} currency={currency} />
                                <Line label="Medical" amount={payslip.medical} currency={currency} />
                                <Line label="Other allowance" amount={payslip.other_allowance} currency={currency} />
                                <Line label="Overtime" amount={payslip.overtime_pay} currency={currency} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">Deductions</h3>
                                <Line label="Unpaid absence" amount={payslip.absence_deduction} currency={currency} />
                                <Line label="Late" amount={payslip.late_deduction} currency={currency} />
                                <Line label="Salary advance" amount={payslip.advance_deduction} currency={currency} />
                                <Line label="Tax" amount={payslip.tax} currency={currency} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div>
                                <div className="text-muted-foreground text-sm">Gross</div>
                                <div className="font-medium">{formatMoney(payslip.gross, currency)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-muted-foreground text-sm">Net pay</div>
                                <div className="text-2xl font-semibold">{formatMoney(payslip.net, currency)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}

PayslipShow.layout = {
    breadcrumbs: [
        { title: 'Payroll', href: '/payroll/runs' },
        { title: 'Payslip', href: '#' },
    ],
};
