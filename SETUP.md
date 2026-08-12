# Think Easy Operations Portal Setup

## 1. HR Team Setup

- The first run auto-creates `data/auth-users.json` with these default staff accounts:
  - **HR Manager** — `hr-manager@thinkeasy.local` / `Manager123!`
  - **HR Recruiter** — `hr-recruiter@thinkeasy.local` / `Recruit123!`
- Sign in at `/hr-operations`.
- The HR Manager can open `/admin/settings` to:
  - adjust the platform fee percentage
  - toggle auto-approval for client projects or driver applications
  - edit the required document checklist
- The HR Recruiter can access `/hr-operations`, `/hr-operations/employees`, `/hr-operations/documents`, and `/admin/driver-codes`.

## 2. Design Team Setup

- The first run auto-creates a design account:
  - **Design Lead** — `design@thinkeasy.local` / `Design123!`
- Sign in at `/design-studio`.
- Open any project from the dashboard to:
  - review vehicle specs and branding
  - upload revision files
  - add notes
  - export a production ZIP package with specs, client requirements, and uploaded files

## 3. Client Onboarding Setup

- HR Manager creates invite codes at `/admin/settings`.
- Share the invite code with the client.
- Client registers at `/client-onboard/register`.
- After registration, the client signs in at `/client-onboard` and manages projects at `/client-onboard/projects`.

## 4. Driver Onboarding Setup

- Share `/driver-onboard` publicly.
- Applicants complete the multi-step form and upload license + insurance files.
- HR reviews submitted applications from `/hr-operations`.
- HR Manager can approve/reject/request changes through the driver application API or by workflow pages that call it.
- Approved drivers receive a generated access code stored in `data/driver-codes.json` and can use `/driver-portal`.

## 5. Initial Data Setup

- Empty JSON files are created automatically inside `/data/` the first time routes or APIs run:
  - `employees.json`
  - `payroll.json`
  - `documents.json`
  - `design-projects.json`
  - `design-files.json`
  - `clients.json`
  - `client-projects.json`
  - `client-invites.json`
  - `driver-applications.json`
  - `auth-users.json`
  - `settings.json`
  - `activity-log.json`
- Upload directories are created automatically inside `/public/uploads/`.
- Demo mode is the default because the seeded staff accounts above are created automatically.

## Local Run

```bash
npm ci
npm run dev
```

## Notes

- Sessions are cookie-based and also mirrored in browser `sessionStorage` for current-session UX.
- File uploads are capped at 10MB.
- Employee, design, client, and driver data all persist in JSON files with no external database dependency.
