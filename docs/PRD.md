# Multi-Tenant Leave Management & Attendance SaaS
## Product Requirements & Technical Architecture
Technology: Laravel + Inertia.js + React/Vue + MySQL + Redis
Application Type: Multi-Tenant SaaS
Core Modules: Attendance, Leave Management, Holiday, Employee Management, Reporting, Subscription, Platform Administration

1. Product Overview
এই সিস্টেমটি একটি Multi-Tenant SaaS HR application হবে যেখানে বিভিন্ন Company/Organization আলাদা Tenant হিসেবে software ব্যবহার করবে।
প্রতিটি Tenant তাদের:
Employees
Departments
Designations
Office/Branches
Attendance
Leave
Holidays
Working Days
Work Shifts
Attendance Policies
Leave Policies
নিজস্বভাবে manage করতে পারবে।
Platform Owner হিসেবে একটি আলাদা Super Admin / Platform Admin Panel থাকবে, যেখান থেকে SaaS-এর সকল Tenant, Subscription, Plan, Payment, Trial, Marketing এবং platform analytics manage করা যাবে।

2. Main Business Rule
Application-এর সবচেয়ে গুরুত্বপূর্ণ security rule:
General Application Access
Employee নিচের network যেকোনোটি ব্যবহার করে application access করতে পারবে:
Office Wi-Fi
Home Wi-Fi
Mobile Data
Other Wi-Fi
VPN, যদি tenant policy block না করে
তারা যেকোনো network থেকে:
Login
Dashboard দেখা
Leave Apply
Leave Status দেখা
Attendance history দেখা
Profile দেখা
Notification দেখা
করতে পারবে।
Attendance Check-In / Check-Out
কিন্তু:
Check In এবং Check Out শুধুমাত্র Tenant কর্তৃক approved Office Network থেকে করা যাবে।
Example:
Company A:
Office Network:
Office: Dhaka Head Office

Public IP:
103.xx.xx.xx

Employee request IP যদি approved network-এর IP-এর সাথে match করে:
Attendance Allowed

অন্য IP হলে:
Attendance Blocked

Message:
You must be connected to an authorized office network to mark attendance.

3. Important Wi-Fi Technical Architecture
Browser security/privacy restrictions-এর কারণে web application থেকে reliably router SSID detect করা উচিত নয়।
Example:
Office WiFi SSID:
Softrly-Office

Laravel backend সরাসরি জানতে পারবে না user আসলেই Softrly-Office SSID-তে connected কি না।
তাই system মূলত verify করবে:
Employee Device
        ↓
Office Wi-Fi
        ↓
Office Router
        ↓
Public Internet IP
        ↓
Laravel Server

Laravel request থেকে পাওয়া IP:
$request->ip();

Tenant configuration-এর approved IP-এর সঙ্গে compare করা হবে।
Recommended Production Setup
প্রতিটি office/branch-এর জন্য ISP থেকে:
Dedicated / Static Public IP
নেওয়া সবচেয়ে ভালো।
Example:
Tenant:
Softrly Ltd

Office:
Dhaka Head Office

Router Public IP:
103.42.xx.xx

এটি Tenant Admin configure করবে।

4. Multi-Office Network Support
একটি Tenant-এর একাধিক office থাকতে পারবে।
Example:
Softrly Ltd
│
├── Dhaka Head Office
│   └── 103.42.10.10
│
├── Uttara Office
│   └── 103.42.11.50
│
└── Chittagong Office
    └── 103.42.12.20

Employee কোন office থেকে attendance দিচ্ছে সেটিও save হবে।

5. Attendance Verification Flow
Employee:
Login
 ↓
Dashboard
 ↓
Press Check In
 ↓
Identify Tenant
 ↓
Get Employee
 ↓
Get Request IP
 ↓
Find Active Office Network
 ↓
IP Match?

If YES:
Check work schedule
 ↓
Check already checked-in?
 ↓
Determine Late / On-Time
 ↓
Create Attendance
 ↓
Success

If NO:
Reject Attendance

6. Additional Attendance Security
শুধু IP matching ব্যবহার না করে নিচের security layer রাখা উচিত।
Layer 1 — Tenant Validation
Employee শুধুমাত্র নিজের tenant-এর attendance endpoint ব্যবহার করতে পারবে।
Layer 2 — Authentication
User authenticated হতে হবে।
Layer 3 — Active Employee
Employee status:
active

হতে হবে।
Layer 4 — Approved Office Network
Request IP tenant-এর configured network-এর সঙ্গে match করতে হবে।
Layer 5 — Device Tracking
Attendance request-এর সময় save:
device_id
browser
operating_system
user_agent
ip_address

Layer 6 — Optional Location Verification
Tenant চাইলে location policy enable করতে পারবে।
Example:
Office:
Latitude: 23.xxxxx
Longitude: 90.xxxxx
Allowed Radius: 200 metres

তখন attendance-এর জন্য:
Approved Network
        +
Location Radius

দুটোই match করতে হবে।
এই feature optional রাখতে হবে।

7. Recommended Tenant Architecture
প্রথম version-এর জন্য:
Single Database Multi-Tenancy
recommended।
প্রায় প্রতিটি tenant-owned table-এ থাকবে:
tenant_id

Example:
employees
tenant_id

attendances
tenant_id

leave_requests
tenant_id

holidays
tenant_id

এতে development, reporting, maintenance এবং SaaS operation সহজ হবে।
Spatie-এর current Laravel Multitenancy package single এবং multiple database—দুই architecture-ই support করে এবং request অনুযায়ী current tenant resolve করতে পারে। Domain-based TenantFinder-ও built in আছে।
Future Enterprise Plan-এর জন্য optionally:
Separate Database Per Tenant

support যোগ করা যেতে পারে।

8. Tenant Identification
Tenant access করা যেতে পারে:
Option A — Subdomain
Recommended।
Example:
softrly.yourapp.com
companyabc.yourapp.com
xyzcompany.yourapp.com

Option B — Custom Domain
Enterprise feature:
hr.companyabc.com

Option C — Shared Domain
app.yourapp.com

Login করার পরে user's tenant identify করা।
Recommended architecture:
tenant.yourapp.com

Spatie Multitenancy-এর DomainTenantFinder hostname থেকে current tenant resolve করতে পারে।

9. User Roles
Platform Level
Platform Super Admin
Software owner।
Can manage:
All tenants
Plans
Subscriptions
Payments
Trials
Marketing campaigns
Coupons
SaaS revenue
Feature availability
Support
System configuration

10. Tenant Roles
Default tenant roles:
Tenant Owner
Highest company authority।
HR Admin
Manages:
Employees
Leave
Attendance
Holidays
Policies
Manager
Can:
View own team
Approve/reject leave
View team attendance
Employee
Can:
Check In
Check Out
Apply Leave
View Leave
View Attendance
View Holiday
Update limited profile information
Accountant / Viewer
Optional permission-based roles।

11. Permission System
Role-এর পরিবর্তে granular permission system রাখতে হবে।
Example:
employee.view
employee.create
employee.update
employee.delete

attendance.view
attendance.create
attendance.edit
attendance.export

leave.view
leave.apply
leave.approve
leave.reject

holiday.view
holiday.manage

department.manage

settings.manage

Tenant চাইলে custom role তৈরি করতে পারবে।
Recommended:
Spatie Laravel Permission

12. Platform Database Tables
Central SaaS tables:
tenants
plans
plan_features
subscriptions
subscription_items
payments
invoices
coupons
coupon_usages
tenant_domains
platform_users
marketing_campaigns
tenant_trials
activity_logs

13. Tenant Table
tenants

id
uuid
name
slug
email
phone
logo
country
timezone
currency
status
trial_ends_at
created_at
updated_at

Status:
trial
active
suspended
cancelled
expired

14. Tenant Settings Table
tenant_settings

id
tenant_id
key
value
type
created_at
updated_at

Example:
timezone = Asia/Dhaka
attendance_method = network
week_start = sunday
late_grace_minutes = 10

15. Office / Branch Management
Table:
offices

id
tenant_id
name
code
address
city
country
latitude
longitude
allowed_radius
timezone
status

Example:
Dhaka Head Office
DHK001

16. Office Networks
office_networks

id
tenant_id
office_id
name
ip_address
ip_range
network_type
status
created_at
updated_at

Example:
name:
Main Office WiFi

ip_address:
103.42.xx.xx

network_type:
static_ip

Allow multiple networks per office।

17. Department Management
departments

id
tenant_id
name
code
manager_id
status

Examples:
Engineering
HR
Accounts
Marketing
Sales
Support

18. Designation Management
designations

id
tenant_id
name
department_id
status

Example:
Software Engineer
Senior Software Engineer
Team Lead
HR Executive
Accountant

19. Employee Management
employees

id
tenant_id
user_id
employee_code
first_name
last_name
email
phone
department_id
designation_id
manager_id
office_id
shift_id
joining_date
employment_type
status
created_at
updated_at

Employment type:
permanent
probation
contract
intern
part_time

20. Work Shift Management
Tenant একাধিক shift তৈরি করতে পারবে।
shifts

id
tenant_id
name
start_time
end_time
grace_minutes
minimum_work_minutes
status

Example:
General Shift

Start:
09:00 AM

End:
06:00 PM

Grace:
10 Minutes

21. Employee Shift
employee_shifts

id
tenant_id
employee_id
shift_id
effective_from
effective_to

Shift history রাখা যাবে।

22. Working Days
Tenant configure করবে:
Saturday
Sunday
Monday
Tuesday
Wednesday
Thursday
Friday

Example Bangladesh company:
Sunday    Working
Monday    Working
Tuesday   Working
Wednesday Working
Thursday  Working
Friday    Holiday
Saturday  Holiday

23. Attendance Table
attendances

id
tenant_id
employee_id
office_id
attendance_date

check_in_at
check_out_at

check_in_ip
check_out_ip

check_in_device_id
check_out_device_id

check_in_latitude
check_in_longitude

check_out_latitude
check_out_longitude

status
late_minutes
early_leave_minutes
work_minutes
overtime_minutes

check_in_method
check_out_method

notes
created_at
updated_at

24. Attendance Status
Possible values:
present
late
absent
half_day
leave
holiday
weekend
work_from_home
manual

25. Check-In Logic
Example:
Shift:
09:00 AM

Grace:
10 minutes

Employee:
09:07 AM

Result:
Present

Employee:
09:18 AM

Result:
Late
Late Minutes = 8

Policy অনুযায়ী grace calculation configurable হবে।

26. Check-Out Logic
Check-in ছাড়া Check-out করা যাবে না।
Example:
Check In:
09:05

Check Out:
18:10

Calculate:
Total Duration
Break Duration
Working Duration
Overtime
Early Leave

27. Attendance Middleware
Attendance-specific route:
POST /attendance/check-in
POST /attendance/check-out

Middleware chain conceptually:
auth
tenant
active.employee
subscription.active
office.network
attendance.policy

Important:
office.network middleware শুধু attendance endpoints-এ থাকবে।
এটি:
leave
profile
dashboard
reports

routes-এ থাকবে না।
Tenant routes-এ valid current tenant এবং valid tenant session নিশ্চিত করার জন্য dedicated tenancy middleware ব্যবহার করা উচিত। Spatie নিজেও NeedsTenant এবং EnsureValidTenantSession একসঙ্গে ব্যবহারের pattern document করে।

28. Attendance Network Middleware Concept
Pseudo logic:
$userIp = request()->ip();

$allowed = OfficeNetwork::query()
    ->where('tenant_id', tenant()->id)
    ->where('status', 'active')
    ->where('ip_address', $userIp)
    ->exists();

if (! $allowed) {
    abort(403, 'Connect to an authorized office network.');
}

Production version-এ:
IPv4
IPv6
CIDR range
Proxy configuration
Trusted proxies
Cloudflare headers
সঠিকভাবে handle করতে হবে।
বিশেষ করে Cloudflare/Load Balancer ব্যবহার করলে request()->ip() যেন proxy IP না দিয়ে real client IP return করে সেটি নিশ্চিত করতে হবে।

29. Attendance Dashboard
Employee dashboard:
Hello, Hasan

Today
-----------------
Status: Not Checked In

[ Check In ]

Shift:
09:00 AM – 06:00 PM

Office:
Dhaka Head Office

Network:
Office Network Detected

Check-in-এর পরে:
Checked In
09:03 AM

Working:
04h 21m

[ Check Out ]

30. Attendance Calendar
Employee monthly calendar।
Color/status:
P  = Present
L  = Late
A  = Absent
LV = Leave
H  = Holiday
WO = Weekly Off

Click করলে details দেখা যাবে।

31. Attendance Report
Filters:
Date Range
Employee
Department
Designation
Office
Status
Shift

Reports:
Daily Attendance
Monthly Attendance
Employee Attendance
Late Report
Absent Report
Overtime Report
Office Report
Department Report

Export:
Excel
CSV
PDF

32. Manual Attendance
HR/Admin manual attendance add/edit করতে পারবে।
But reason mandatory:
Reason:
Employee forgot to check out.

Audit log রাখতে হবে:
Before
After
Changed By
Reason
Timestamp

33. Leave Types
Tenant custom leave type তৈরি করতে পারবে।
Examples:
Casual Leave
Sick Leave
Annual Leave
Maternity Leave
Paternity Leave
Unpaid Leave
Emergency Leave
Compensatory Leave

34. Leave Type Table
leave_types

id
tenant_id
name
code
days_per_year
is_paid
carry_forward
maximum_carry_forward
requires_attachment
minimum_notice_days
status

35. Leave Balance
leave_balances

id
tenant_id
employee_id
leave_type_id
year
allocated
used
pending
carried_forward
remaining

Formula:
Remaining =
Allocated
+ Carried Forward
- Used
- Pending

36. Leave Application
Employee select করবে:
Leave Type
From Date
To Date
Half Day / Full Day
Reason
Attachment

System automatically calculate করবে working leave days।
Friday/Saturday বা configured holiday automatically exclude করা যাবে।

37. Leave Request Table
leave_requests

id
tenant_id
employee_id
leave_type_id

start_date
end_date

total_days
duration_type

reason
attachment

status

current_approver_id

approved_at
rejected_at
cancelled_at

created_at
updated_at

Status:
draft
pending
approved
rejected
cancelled

38. Leave Approval Workflow
Basic:
Employee
   ↓
Manager
   ↓
HR

Optional Advanced:
Employee
   ↓
Team Lead
   ↓
Department Manager
   ↓
HR
   ↓
Admin

Tenant policy অনুযায়ী approval levels configure করা যাবে।

39. Leave Approvals
leave_approvals

id
tenant_id
leave_request_id
approver_id
level
status
comment
action_at

40. Leave Calendar
Manager/HR calendar-এ দেখতে পারবে:
Who is on leave
Which department
Leave duration
Approved/Pending

Team overlap বুঝতে সুবিধা হবে।

41. Holiday Management
Tenant holidays configure করতে পারবে।
holidays

id
tenant_id
name
date
end_date
holiday_type
office_id
department_id
status

Examples:
Eid-ul-Fitr
Eid-ul-Adha
Victory Day
Independence Day
Company Holiday

42. Different Holiday Per Employee Group
আপনার requirement অনুযায়ী সবার holiday এক হওয়া বাধ্যতামূলক নয়।
Holiday scope:
All Company
Specific Office
Specific Department
Specific Employee Group
Specific Employee

Example:
Dhaka Office:
Friday + Saturday Off

Support Team:
Friday Off

Operations:
Custom roster।

43. Company Policies
Tenant Admin settings:
Attendance Policy
Grace Period
Late Rules
Early Leave Rules
Overtime Rules
Minimum Work Hours
Check-in Window
Check-out Window
Multiple Check-In Allowed?

Leave Policy
Annual Allocation
Probation Leave
Carry Forward
Leave Encashment
Minimum Notice
Maximum Consecutive Leave
Attachment Requirement

44. Employee Dashboard
Employee Dashboard widgets:
Today's Attendance
Check-In / Check-Out

This Month:
Present
Late
Absent
Leave

Leave Balance

Upcoming Holidays

Recent Leave Requests

Announcements

45. HR Dashboard
Widgets:
Total Employees

Present Today
Late Today
Absent Today
On Leave Today

Pending Leave Requests

Departments

Attendance Trend

Upcoming Holidays

New Employees

46. Tenant Admin Dashboard
Additional SaaS information:
Employees Used
Employee Limit

Subscription Plan
Subscription Expiry

Storage Used

Branches

Monthly Attendance Summary

47. Platform Super Admin
Platform Admin হবে tenant application থেকে সম্পূর্ণ আলাদা logical area।
Example:
admin.yourapp.com

48. Platform Dashboard
Show:
Total Tenants
Active Tenants
Trial Tenants
Suspended Tenants

Total Users

MRR
ARR

New Subscriptions

Churn

Trial Conversion

Plan Distribution

Recent Payments

49. Tenant Management
Platform admin থেকে:
Tenant List
Tenant Details
Create Tenant
Activate
Suspend
Delete
Extend Trial
Change Plan
Login As Tenant
View Usage
View Subscription
View Payments

50. Plan Management
Example plans:
Starter
Up to 10 Employees
1 Office
Attendance
Leave
Holiday
Basic Reports

Business
Up to 50 Employees
5 Offices
Advanced Attendance
Advanced Leave
Reports
Exports

Professional
Up to 200 Employees
Unlimited Offices
Advanced Reports
API
Custom Roles

Enterprise
Custom Employee Limit
Custom Domain
Dedicated Database
Priority Support
Advanced Security

51. Plan Feature Architecture
Do feature flags use করুন।
Example:
attendance
leave_management
multiple_offices
custom_roles
advanced_reports
location_attendance
api_access
custom_domain
audit_log

Tenant-এর plan feature না থাকলে system access deny করবে।

52. Subscription Table
subscriptions

id
tenant_id
plan_id
status
billing_cycle
started_at
trial_ends_at
current_period_start
current_period_end
cancelled_at

Billing cycle:
monthly
yearly

53. Payments
Payment integration architecture flexible রাখতে হবে।
Bangladesh:
SSLCommerz
bKash
Nagad

International:
Stripe
Paddle

Payment record:
payments

id
tenant_id
subscription_id
amount
currency
gateway
transaction_id
status
paid_at

54. Subscription Restriction
Subscription expire করলে:
Tenant owner/admin:
Login Allowed
Billing Page Allowed

কিন্তু restricted functionality block করা যাবে।
Employees-এর ক্ষেত্রে product policy অনুযায়ী:
Read-only Mode

দেওয়া যেতে পারে।
Data কখনো সঙ্গে সঙ্গে delete করা উচিত নয়।

55. Trial System
Example:
14 Days Free Trial

During signup:
Create Tenant
Create Owner
Assign Trial Plan
Set trial_ends_at
Create default settings
Create leave types
Create default shift

56. SaaS Signup Flow
Landing Page
      ↓
Start Free Trial
      ↓
Company Information
      ↓
Owner Account
      ↓
Tenant Created
      ↓
Subdomain Created
      ↓
Default Settings
      ↓
Dashboard

Example:
Company:
Softrly

Slug:
softrly

URL:
softrly.yourapp.com

57. Tenant Onboarding
Wizard:
Step 1
Company Details
Step 2
Working Days
Step 3
Office
Step 4
Office Network
Step 5
Default Shift
Step 6
Leave Types
Step 7
Add Employees
Step 8
Finish

58. Employee Invitation
Admin employee create করলে email invitation যাবে।
Example:
You have been invited to Softrly HR.

Create Password

Employee invitation accept করলে account activate হবে।

59. Notifications
Channels:
In-App
Email
Optional SMS
Optional WhatsApp

Events:
Leave Submitted
Leave Approved
Leave Rejected
Leave Cancelled

Employee Added
Attendance Missed
Late Attendance
Missing Check-Out

Subscription Expiring
Payment Success
Payment Failed

60. Reminder System
Scheduler:
Shift started but no Check-In

Notification:
Your shift started at 9:00 AM. You have not checked in yet.
Check-out reminder:
Your shift has ended. Remember to check out.

61. Audit Log
Critical SaaS requirement।
Track:
Login
Employee Added
Employee Deleted
Attendance Modified
Leave Approved
Leave Rejected
Settings Changed
Office Network Changed
Plan Changed
Subscription Changed

Table:
activity_logs

tenant_id
user_id
action
entity_type
entity_id
old_values
new_values
ip_address
user_agent
created_at

62. Device Management
user_devices

id
tenant_id
user_id
device_uuid
device_name
browser
os
last_ip
last_seen_at
trusted

Future tenant option:
Only registered device can mark attendance.

63. Fraud Prevention
Potential attendance fraud:
Employee:
Office employee hotspot share
VPN
Proxy
Remote desktop
Credential sharing

তাই high-security tenant-এর জন্য combination:
Office Network
+
Trusted Device
+
Browser Location
+
Attendance Time Rules

ব্যবহার করা যাবে।
শুধুমাত্র public IP কখনো biometric-level proof নয়।

64. Recommended Attendance Modes
Product flexible রাখুন।
Tenant select করবে:
Network Only

Network + Location

Location Only

Trusted Device + Network

Manual

Future:
QR Attendance
Biometric API
Mobile App Attendance

এতে product international market-এর জন্য scalable হবে।

65. Reports Module
Attendance Reports:
Daily Report
Monthly Report
Late Report
Absent Report
Overtime Report
Work Hours Report
Office Report
Department Report
Employee Report

Leave Reports:
Leave Balance
Leave Usage
Employee Leave
Department Leave
Leave Type Report
Annual Report

66. Export
Exports:
PDF
Excel
CSV

Large exports queue-তে process করা উচিত।
Multi-tenant queued jobs-এর ক্ষেত্রে tenant context preserve করা গুরুত্বপূর্ণ; Spatie Multitenancy tenant-aware queued job support দেয়।

67. Search & Filters
Global employee search:
Name
Employee ID
Email
Department
Designation
Office

All admin lists:
Search
Filter
Sort
Pagination
Export

68. Application Structure
Recommended Laravel domain structure:
app/

Domain/
    Attendance/
    Leave/
    Employee/
    Tenant/
    Subscription/
    Billing/
    Holiday/
    Office/
    Report/
    Notification/

Actions/
DTOs/
Enums/
Events/
Jobs/
Listeners/
Models/
Policies/
Services/
Http/

Avoid putting business logic directly inside Controllers।

69. Service Layer
Example:
AttendanceService
LeaveService
LeaveBalanceService
HolidayService
WorkingDayService
SubscriptionService
TenantService
BillingService
NetworkVerificationService
ReportService

70. Attendance Service
Responsibilities:
validate employee
validate subscription
validate office network
validate shift
validate attendance window
create check-in
create check-out
calculate lateness
calculate work duration
calculate overtime

71. Network Verification Service
Create:
NetworkVerificationService

Methods conceptually:
verify(Request $request, Employee $employee)

getClientIp(Request $request)

matchesOfficeNetwork(string $ip, Office $office)

matchesCidr(string $ip, string $cidr)

Controller যেন network logic না জানে।

72. Leave Service
Responsibilities:
validate leave dates
calculate working days
exclude holidays
exclude weekly off
check leave balance
create leave request
start approval workflow
approve
reject
cancel
update leave balance

73. Events
Example:
EmployeeCreated
AttendanceCheckedIn
AttendanceCheckedOut

LeaveRequested
LeaveApproved
LeaveRejected

SubscriptionStarted
SubscriptionExpired
PaymentCompleted

Listeners notifications এবং background jobs process করবে।

74. Frontend
Recommended:
Laravel
Inertia.js
React
Tailwind CSS

or:
Laravel
Inertia.js
Vue
Tailwind CSS

React comfortable হলে:
Laravel + Inertia React + Tailwind
excellent choice।

75. Frontend Pages
Public:
Landing
Pricing
Login
Register
Forgot Password
Terms
Privacy

Employee:
Dashboard
Attendance
Attendance Calendar
Leave
Leave Apply
Leave Balance
Holiday
Profile
Notifications

HR:
Dashboard
Employees
Departments
Designations
Attendance
Leave Requests
Holiday
Shift
Office
Reports

Tenant Admin:
Company Settings
Attendance Settings
Leave Settings
Office Networks
Roles & Permissions
Subscription
Billing
Audit Logs

Platform Admin:
Dashboard
Tenants
Plans
Subscriptions
Payments
Coupons
Marketing
Reports
Settings
Support

76. API Design
Keep APIs versioned:
/api/v1/

Example:
POST /api/v1/attendance/check-in
POST /api/v1/attendance/check-out

GET /api/v1/attendance/today
GET /api/v1/attendance/history

GET /api/v1/leaves
POST /api/v1/leaves
GET /api/v1/leaves/{id}
POST /api/v1/leaves/{id}/approve
POST /api/v1/leaves/{id}/reject

এতে পরে Mobile App বানানো সহজ হবে।

77. Security
Mandatory:
CSRF Protection
Rate Limiting
Authorization Policies
Tenant Isolation
XSS Protection
SQL Injection Protection
Secure Cookies
HTTPS
Password Hashing
Email Verification
Audit Logging

Admin optional:
2FA

78. Tenant Isolation
এটি project-এর সবচেয়ে critical technical rule।
Tenant A যেন কখনো:
Tenant B Employee
Tenant B Attendance
Tenant B Leave

দেখতে না পারে।
Every tenant query tenant-scoped হতে হবে।
Example conceptual constraint:
WHERE tenant_id = currentTenantId

Cache, queue এবং filesystem-এর ক্ষেত্রেও tenancy isolation বিবেচনা করতে হবে। Current multitenancy tooling tenant switch-এর সময় cache prefixing/database switching-এর মতো environment tasks support করে।

79. Database Indexing
Frequently queried columns index করুন:
tenant_id
employee_id
attendance_date
department_id
office_id
status
start_date
end_date

Attendance table:
Composite unique index:
tenant_id
employee_id
attendance_date

যদি policy অনুযায়ী daily single attendance record থাকে।

80. Redis
Redis use করুন:
Cache
Session
Queue
Rate Limit
Tenant configuration cache

81. Queue
Queue:
Emails
Notifications
PDF Generation
Excel Export
Monthly Reports
Billing Events
Import

Production:
Redis + Laravel Horizon

82. Scheduler
Laravel Scheduler:
Detect Absent Employees
Missing Check-Out
Leave Balance Reset
Annual Leave Allocation
Subscription Expiration
Trial Expiration
Reminder Notifications
Generate Reports

83. Employee Import
Admin:
Import CSV / Excel

Fields:
Employee ID
Name
Email
Department
Designation
Office
Shift
Joining Date

Import preview + validation result থাকতে হবে।

84. SaaS Marketing Module
Platform admin-এর জন্য basic marketing management:
Leads
Campaign
Coupon
Trial User
Conversion
Source
UTM
Referral

Tenant signup capture:
utm_source
utm_medium
utm_campaign
utm_content
referral_code

এতে কোন marketing campaign থেকে SaaS customer আসছে বুঝতে পারবেন।

85. Lead Table
leads

id
name
email
phone
company
company_size
source
utm_source
utm_campaign
status
assigned_to
created_at

Status:
new
contacted
qualified
trial
customer
lost

86. SaaS Sales Funnel
Visitor
   ↓
Lead
   ↓
Free Trial
   ↓
Activated Tenant
   ↓
Paid Subscription
   ↓
Renewal

Platform dashboard conversion metrics দেখাবে।

87. Support Module
Future:
Support Tickets

Tenant owner create করতে পারবে।
Status:
Open
In Progress
Resolved
Closed

88. Platform Impersonation
Super Admin:
Login as Tenant

কিন্তু:
Action audit log করতে হবে
Original admin session preserve করতে হবে
Banner দেখাতে হবে
Example:
You are currently viewing Softrly Ltd as Platform Administrator.

89. Subscription Feature Middleware
Example concept:
subscription.active
feature:advanced_reports
employee.limit
office.limit

Employee create করার সময়:
Current Employees:
10

Plan Limit:
10

Result:
Upgrade Required

90. Suggested Core Tables
Final major table overview:
users
tenants
tenant_users

employees
departments
designations

offices
office_networks

shifts
employee_shifts
working_days

attendances
attendance_logs
attendance_adjustments

leave_types
leave_balances
leave_requests
leave_approvals

holidays
holiday_assignments

roles
permissions

notifications
activity_logs
user_devices

plans
plan_features
subscriptions
payments
invoices
coupons

leads
marketing_campaigns

91. MVP Scope
প্রথম release-এ সব feature একসঙ্গে build না করাই ভালো।
MVP Phase 1
Build:
Multi-Tenancy
Authentication
Tenant Admin
Employee Management
Department
Designation
Office
Office Network
Shift
Attendance Check-In
Attendance Check-Out
Attendance Report
Basic Dashboard

92. MVP Phase 2
Add:
Leave Types
Leave Balance
Leave Application
Leave Approval
Holiday
Working Days
Employee Calendar
Notifications

93. SaaS Phase
Add:
Platform Admin
Plans
Subscriptions
Trial
Payments
Employee Limits
Feature Limits
Billing Dashboard

94. Advanced Phase
Add:
Advanced Reports
Location Verification
Trusted Devices
Custom Roles
Audit Logs
Import/Export
Marketing
Lead Tracking
API
Custom Domain

95. Future Phase
Possible additions:
Payroll
Roster
Timesheet
Task Management
Expense
Recruitment
Performance Review
Asset Management
Employee Documents
Announcements
Mobile App
QR Attendance
Biometric Integration

96. Recommended Architecture Summary
Final recommended architecture:
                   SaaS Platform
                         │
               Platform Super Admin
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Tenant A       Tenant B       Tenant C
          │
     Company Admin
          │
   ┌──────┼──────┐
   │      │      │
  HR   Manager Employee
                 │
                 │
          General Features
                 │
        Any Internet Network
                 │
     ┌───────────┴───────────┐
     │                       │
 Leave / Dashboard       Attendance
     │                       │
Anywhere                Network Check
                             │
                        Authorized?
                         │       │
                       YES       NO
                        │         │
                    Check-In    Reject

97. Recommended Technology Stack
Backend:
Laravel
MySQL
Redis
Laravel Queue
Laravel Horizon
Laravel Scheduler

Frontend:
Inertia.js
React
Tailwind CSS

Authentication:
Laravel authentication
Sanctum for future API/mobile access

Authorization:
Laravel Policies
Spatie Permission

Tenancy:
Spatie Laravel Multitenancy

Spatie currently supports both single- and multiple-database tenancy, tenant resolution, tenant-aware queues, and custom tenancy behavior, making it a reasonable fit for this architecture.
Storage:
Local/S3-compatible object storage

Infrastructure:
Nginx
PHP-FPM
MySQL
Redis
Supervisor
SSL
Cloudflare optional

98. Critical Attendance Recommendation
এই product-এর web-based attendance-এর জন্য সবচেয়ে practical initial architecture:
Employee Login
       ↓
Attendance Button
       ↓
Laravel receives Client IP
       ↓
Tenant Office Network Lookup
       ↓
IP Match
   ┌───┴────┐
  YES       NO
   │         │
Optional     Block
Device Check
   │
Optional
Location Check
   │
Check Shift
   │
Attendance

Tenant settings:
Attendance Security Mode:

○ Office Network
○ Office Network + Location
○ Office Network + Trusted Device
○ Office Network + Location + Trusted Device

Default:
Office Network

এটি MVP-এর জন্য simple এবং maintainable থাকবে, আর enterprise customer-এর জন্য পরে stronger verification enable করা যাবে।

99. Product Positioning
Productটিকে শুধু:
Leave Management Software
হিসেবে position না করে:
Multi-Tenant Employee Attendance & Leave Management SaaS
হিসেবে design করা উচিত।
Core selling points:
Office Network-Based Attendance
Multi-Branch Management
Leave Automation
Attendance Reports
Employee Self-Service
Multi-Tenant SaaS
Subscription-Based Platform

এর ফলে ছোট company থেকে শুরু করে multi-branch organization পর্যন্ত একই platform ব্যবহার করতে পারবে।
