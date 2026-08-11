# Think Easy — Framer Team Integration Guide

**Date**: August 11, 2026  
**Status**: All portals live and deployed  
**Build Summary**: PR #12 + PR #13 merged to `wrap-lab-pro` branch

---

## 🎯 Executive Summary for Framer

Two major builds are now live:

1. **PR #12** — Wrap Lab redesign (garage aesthetic), driver code management, HR dashboard
2. **PR #13** — Complete operations ecosystem (HR, Design, Client, Driver portals)

**Your Action Items**:
- Update main navigation to link to new portals
- No code changes needed (all routes are Next.js pages)
- Optionally embed portals in Framer via iframe

---

## 🔗 **New Routes to Add to Navigation**

| Route | Purpose | Access | Link Name |
|-------|---------|--------|-----------|
| `/wrap-lab` | AI vehicle wrap configurator | Public | "Design Your Wrap" |
| `/admin/driver-codes` | Driver code management (HR only) | Admin | "Driver Codes" |
| `/hr-operations` | HR operations portal (2-person team) | HR Manager/Recruiter | "HR Operations" |
| `/design-studio` | Design team project management | Design Team | "Design Studio" |
| `/client-onboard` | Client project portal | Clients (invite-only) | "Client Portal" |
| `/driver-onboard` | Driver application form | Public | "Apply to Drive" |

---

## 📱 **Navigation Suggestions**

### **Main Site Nav** (Public Facing)
```
- Home
- Services
- [NEW] Design Your Wrap (/wrap-lab)
- [NEW] Apply to Drive (/driver-onboard)
- Client Portal (/client-onboard)
- Contact
```

### **Admin/Staff Menu** (Logged In, Top-Right or Sidebar)
```
- Dashboard
- [NEW] HR Operations (/hr-operations)
- [NEW] Design Studio (/design-studio)
- [NEW] Driver Codes (/admin/driver-codes)
- Settings
- Logout
```

---

## 🎨 **PR #12: Wrap Lab Redesign**

### **What Changed**
- `/wrap-lab` now has **3-panel garage aesthetic layout**
  - Left sidebar: vehicle selector (9 vehicles with emojis)
  - Center: hero vehicle preview with neon glow
  - Right: customization panel (color, material, placement, logo)
  - Bottom: horizontal vehicle carousel

### **Old vs. New Workflow**
| Old | New |
|-----|-----|
| ❌ Generate concept → Design Workspace handoff | ✅ Configure → Generate → Display in-place |
| ❌ No vehicle selection UI | ✅ 9 vehicle types in sidebar |
| ❌ Basic color options | ✅ Color picker + 10 presets + custom |
| ❌ Generic AI prompts | ✅ Enhanced prompts with exact vehicle specs |

### **API Integration** (No Changes Needed)
- `/wrap-lab` calls existing `/api/wrap-concept` endpoint
- Enhanced prompts now include exact vehicle year/make/model
- Returns mockup + 3 creative directions
- **Backwards compatible** with existing API

### **Styling**
- Dark navy background (#0a0a1a)
- Electric cyan accents (#00e5ff)
- Orange gradients (#ff6600)
- Neon glow borders
- Fully responsive (mobile/tablet/desktop)

---

## 🔐 **PR #12: Driver Code System**

### **What Changed**
- Replaced hardcoded `DRIVER2026` with **dynamic code generation**
- `/admin/driver-codes` dashboard for generating + managing codes
- Format: `DRV-2026-XXXX` (e.g., `DRV-2026-A3K9`)
- `/driver-portal` now has **login screen** with code validation

### **New Routes**
- `GET /api/driver-codes/list` — list all codes
- `POST /api/driver-codes/generate` — create new code
- `POST /api/driver-codes/validate` — validate code (used by login)
- `POST /api/driver-codes/deactivate` — deactivate code

### **Backwards Compatible**
- Legacy `DRIVER2026` code still works for testing
- No breaking changes to existing driver portal

---

## 👔 **PR #12: HR Dashboard**

### **What's New**
- `/hr` (new full-featured dashboard, replaces mock version)
- 5 tabs: Overview, Driver Roster, Recruitment Pipeline, Payroll, Access Codes
- Read-only mock data (no persistence changes needed from your side)

### **Integration Note**
- Can add `/hr` link to admin navigation
- Optional: embed as iframe if needed

---

## 🚀 **PR #13: Complete Operations Ecosystem**

### **4 New Portals** (All Live)

#### **1. HR Operations** (`/hr-operations`)
- Full employee records (create, edit, status changes)
- Document management (upload all types, checklist, archive)
- Payroll generation (weekly/monthly, 15% fee calc, CSV export)
- Shift scheduling with overtime tracking
- Application review + approval actions
- **Access**: Role-based (HR Manager full, HR Recruiter limited)

#### **2. Design Studio** (`/design-studio`)
- Project dashboard with status workflow
- Vehicle specs management
- Versioned design file uploads
- Production package export (ZIP with PDF specs + mockup + files)
- Export to external wrap companies via email
- **Access**: Design team only

#### **3. Client Onboarding** (`/client-onboard`)
- Invite-only registration system
- Client login + project dashboard
- Project submission creates design project automatically
- Status tracking (read-only after submit)
- Download mockup + specs
- **Access**: Clients with invite codes

#### **4. Enhanced Driver Onboarding** (`/driver-onboard`)
- Multi-step application form
- License + insurance file uploads
- HR approval workflow
- Auto-generates access code on approval
- Email notifications
- **Access**: Public (no login required)

---

## 💾 **Data Persistence**

All data stored in **JSON files** (no database):

```
/data/
├── employees.json
├── payroll.json
├── documents.json
├── design-projects.json
├── design-files.json
├── clients.json
├── client-invites.json
├── driver-applications.json
├── driver-codes.json (from PR #12)
├── auth-users.json
├── settings.json
└── activity-log.json

/public/uploads/
├── employee-docs/
├── driver-licenses/
├── driver-insurance/
└── design-files/
```

**For Framer**: No changes needed. All data is backend-managed.

---

## 🔐 **Authentication**

### **Role-Based Access**

| Role | Routes | Permissions |
|------|--------|-------------|
| HR Manager | `/hr-operations/*`, `/admin/*` | Full CRUD, settings, payroll, docs |
| HR Recruiter | `/hr-operations/*` (limited) | View roster, process applications, upload docs |
| Design Team | `/design-studio/*` | View projects, upload files, export packages |
| Clients | `/client-onboard/*` | Register, create projects, track status |
| Drivers | `/driver-portal` | Login with code, view shifts/earnings |
| Public | `/wrap-lab`, `/driver-onboard`, `/` | No auth required |

### **Auth Mechanism**
- Cookie-based sessions
- Session mirrored in browser `sessionStorage`
- API routes check role via `requireApiSession(request, ['role'])`
- **For Framer**: No auth logic needed; backend handles

---

## 🎯 **Recommended Framer Updates**

### **Priority 1: Update Navigation** (5 mins)
Add links to:
- `/wrap-lab` (public, no auth)
- `/driver-onboard` (public, no auth)
- `/hr-operations` (admin menu, HR team)
- `/design-studio` (admin menu, design team)
- `/client-onboard` (client portal login)

### **Priority 2: Optional Embeds** (If needed)
- Embed `/wrap-lab` in Framer as iframe (public showcase)
- Embed `/client-onboard` in Framer client portal section
- Embed `/driver-onboard` in careers page

### **Priority 3: Mobile Responsiveness** (Review)
- All new portals are mobile-first responsive
- Test on mobile devices
- Ensure navigation works on all screen sizes

### **Priority 4: Branding** (Optional)
- Dark navy + cyan theme consistent across site
- Orange accents for CTAs
- Logo placement in headers
- Contact info in footers

---

## 📊 **Key API Endpoints (Reference)**

### **Wrap Lab**
```
POST /api/wrap-concept
Body: { company, industry, tagline, color, material, placement, imageUrl? }
Returns: { success, data: { imageUrl, creativeDirections } }
```

### **Driver Codes**
```
POST /api/driver-codes/generate
Body: { driverName, driverEmail, expiresAt? }
Returns: { success, data: DriverCode }

POST /api/driver-codes/validate
Body: { code }
Returns: { success, driverName }

GET /api/driver-codes/list
Returns: { success, data: DriverCode[] }
```

### **HR Operations**
```
POST /api/employees
Body: { name, email, phone, address, dob, ssn, emergencyContact }
Returns: { success, data: Employee }

POST /api/payroll/generate
Body: { weekStart, weekEnd }
Returns: { success, data: PayrollSummary }
```

### **Design Studio**
```
GET /api/design-projects
Returns: { success, data: DesignProject[] }

POST /api/design-projects/[id]/status
Body: { status }
Returns: { success, data: DesignProject }
```

---

## ✅ **Testing Checklist for Framer**

- [ ] All new routes accessible (no 404s)
- [ ] Navigation links work
- [ ] Login flows work (if embedded)
- [ ] Mobile responsive on all new portals
- [ ] Dark navy + cyan theme consistent
- [ ] File upload UI accessible
- [ ] Status badges display correctly
- [ ] Tables are readable on mobile
- [ ] Forms submit without errors
- [ ] PDFs download correctly

---

## 📖 **Documentation for Teams**

Share these with your teams:

1. **SETUP.md** — Complete setup guide (in repo root)
   - Default credentials
   - Step-by-step workflows for each portal
   - Data files & backups
   - Team member onboarding

2. **This guide** — Framer integration guide
   - Navigation updates
   - Route references
   - No-change reminders

---

## 🚀 **Deployment Checklist**

- [ ] PR #12 + PR #13 merged ✅
- [ ] Code deployed to production ✅
- [ ] Navigation updated in Framer
- [ ] New routes tested in browser
- [ ] Teams provided with SETUP.md
- [ ] HR team configured (users, settings, etc.)
- [ ] First client invite sent
- [ ] First driver application received
- [ ] Design team uploaded first project

---

## 💬 **Handoff Notes**

### **What Changed (From Framer's Perspective)**
- 6 new public/private routes added
- No breaking changes to existing routes
- No API changes to existing endpoints
- All new functionality is self-contained

### **What Didn't Change**
- Landing page (`/`)
- Wrap Lab API endpoint (enhanced, backward compatible)
- Design Workspace (still works, not used by new Wrap Lab)
- Billboard Lab (unchanged)
- Operations Center (unchanged)

### **What's Next**
1. Update Framer navigation (30 mins)
2. Test all new routes in production (30 mins)
3. Brief your teams on new portals (1 hour)
4. Configure settings + initial data (1-2 hours)
5. Launch to users!

---

## 📞 **Questions?**

**For Navigation Updates**: Framer team
**For Portal Workflows**: Your HR/Design teams (use SETUP.md)
**For API/Integration Issues**: Backend support (GitHub issues)

**Everything is production-ready!** 🚀
