import fs from 'fs';
import path from 'path';
import { randomUUID, scryptSync, timingSafeEqual } from 'crypto';

export type UserRole = 'hr-manager' | 'hr-recruiter' | 'design-team' | 'client';
export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';
export type PayrollStatus = 'pending' | 'paid' | 'failed';
export type DriverApplicationStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested';
export type ClientInviteStatus = 'pending' | 'used' | 'expired';
export type DesignProjectStatus = 'pending' | 'in-progress' | 'ready-for-print' | 'delivered';
export type ClientProjectStatus =
  | 'created'
  | 'under-review'
  | 'design-generated'
  | 'ready-for-pickup'
  | 'completed';

export interface TimelineEvent {
  status: string;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  notes?: string;
}

export interface EmployeeDocumentSummary {
  id: string;
  type: string;
  filename: string;
  uploadDate: string;
  expiryDate: string | null;
  path: string;
  archived: boolean;
  uploadedBy: string;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  ssn: string;
  role: string;
  status: EmployeeStatus;
  joinDate: string;
  emergencyContact: string;
  sourceApplicationId?: string;
  documents: EmployeeDocumentSummary[];
  shiftAssignments: ShiftAssignment[];
}

export interface DocumentRecord extends EmployeeDocumentSummary {
  employeeId: string;
}

export interface PayrollAdjustment {
  label: string;
  amount: number;
  type: 'bonus' | 'deduction';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  weekStartDate: string;
  hoursWorked: number;
  hourlyRate: number;
  grossEarnings: number;
  platformFee: number;
  netPay: number;
  status: PayrollStatus;
  paymentDate: string | null;
  period: 'weekly' | 'monthly';
  overtimeHours: number;
  adjustments: PayrollAdjustment[];
}

export interface VehicleSpecs {
  year: string;
  make: string;
  model: string;
  dimensions: string;
  material: string;
  placement: string;
}

export interface ClientBranding {
  companyName: string;
  logoPath: string | null;
  colorPalettePath: string | null;
  tagline: string;
  companyInfo: string;
}

export interface DesignFileRecord {
  id: string;
  projectId: string;
  filename: string;
  path: string;
  uploadDate: string;
  version: number;
  note: string;
}

export interface NoteEntry {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface ProductionPackageRecord {
  id: string;
  generatedAt: string;
  generatedBy: string;
  filename: string;
}

export interface DesignProject {
  id: string;
  clientId: string;
  projectTitle: string;
  vehicleType: string;
  mockupImage: string | null;
  vehicleSpecs: VehicleSpecs;
  clientBranding: ClientBranding;
  status: DesignProjectStatus;
  createdDate: string;
  updatedDate: string;
  designNotes: NoteEntry[];
  designFiles: Pick<DesignFileRecord, 'filename' | 'uploadDate' | 'version' | 'path' | 'id'>[];
  externalCompany: string | null;
  communicationHistory: NoteEntry[];
  productionPackages: ProductionPackageRecord[];
}

export interface ClientInvite {
  id: string;
  email: string;
  inviteCode: string;
  expiryDate: string;
  status: ClientInviteStatus;
  createdBy: string;
  usedDate: string | null;
}

export interface ClientProjectReference {
  projectId: string;
}

export interface ClientAccount {
  id: string;
  companyName: string;
  email: string;
  contactName: string;
  phone: string;
  loginHash: string;
  passwordSalt: string;
  status: 'active' | 'inactive';
  inviteDate: string;
  projects: ClientProjectReference[];
  emailVerified: boolean;
}

export interface ClientProject {
  id: string;
  clientId: string;
  companyName: string;
  projectTitle: string;
  vehicleType: string;
  industry: string;
  brandingLogo: string | null;
  colorPaletteImage: string | null;
  tagline: string;
  additionalNotes: string;
  status: ClientProjectStatus;
  createdDate: string;
  updatedDate: string;
  designProjectId: string;
  timeline: TimelineEvent[];
  messageThread: NoteEntry[];
}

export interface DriverApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  emergencyContact: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  licenseFile: string;
  insuranceFile: string;
  status: DriverApplicationStatus;
  appliedDate: string;
  approvedDate: string | null;
  approvedBy: string | null;
  accessCode: string | null;
  notes: string;
  backgroundConsent: boolean;
  timeline: TimelineEvent[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'client'>;
  passwordHash: string;
  passwordSalt: string;
  status: 'active' | 'inactive';
}

export interface SystemSettings {
  platformFeePercent: number;
  clientProjectAutoApprove: boolean;
  driverApplicationAutoApprove: boolean;
  requiredDocumentTypes: string[];
}

const DATA_DIR = path.join(process.cwd(), 'data');

const FILES = {
  employees: path.join(DATA_DIR, 'employees.json'),
  payroll: path.join(DATA_DIR, 'payroll.json'),
  documents: path.join(DATA_DIR, 'documents.json'),
  designProjects: path.join(DATA_DIR, 'design-projects.json'),
  designFiles: path.join(DATA_DIR, 'design-files.json'),
  clients: path.join(DATA_DIR, 'clients.json'),
  clientInvites: path.join(DATA_DIR, 'client-invites.json'),
  clientProjects: path.join(DATA_DIR, 'client-projects.json'),
  driverApplications: path.join(DATA_DIR, 'driver-applications.json'),
  authUsers: path.join(DATA_DIR, 'auth-users.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  activityLog: path.join(DATA_DIR, 'activity-log.json'),
} as const;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export function hashPassword(password: string, salt = randomUUID()) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString('hex'),
  };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const computed = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === computed.length && timingSafeEqual(stored, computed);
}

function writeJsonFile<T>(filePath: string, value: T) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filePath, fallback);
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    writeJsonFile(filePath, fallback);
    return fallback;
  }
}

function buildDefaultAuthUsers(): AuthUser[] {
  const manager = hashPassword('Manager123!');
  const recruiter = hashPassword('Recruit123!');
  const designer = hashPassword('Design123!');

  return [
    {
      id: createId('user'),
      name: 'HR Manager',
      email: 'hr-manager@thinkeasy.local',
      role: 'hr-manager',
      passwordHash: manager.hash,
      passwordSalt: manager.salt,
      status: 'active',
    },
    {
      id: createId('user'),
      name: 'HR Recruiter',
      email: 'hr-recruiter@thinkeasy.local',
      role: 'hr-recruiter',
      passwordHash: recruiter.hash,
      passwordSalt: recruiter.salt,
      status: 'active',
    },
    {
      id: createId('user'),
      name: 'Design Lead',
      email: 'design@thinkeasy.local',
      role: 'design-team',
      passwordHash: designer.hash,
      passwordSalt: designer.salt,
      status: 'active',
    },
  ];
}

function seedLegacyFiles() {
  readJsonFile(path.join(DATA_DIR, 'applications.json'), []);
  readJsonFile(path.join(DATA_DIR, 'driver-roster.json'), []);
  readJsonFile(path.join(DATA_DIR, 'driver-codes.json'), []);
}

export function ensureOpsData() {
  seedLegacyFiles();
  readJsonFile<EmployeeRecord[]>(FILES.employees, []);
  readJsonFile<PayrollRecord[]>(FILES.payroll, []);
  readJsonFile<DocumentRecord[]>(FILES.documents, []);
  readJsonFile<DesignProject[]>(FILES.designProjects, []);
  readJsonFile<DesignFileRecord[]>(FILES.designFiles, []);
  readJsonFile<ClientAccount[]>(FILES.clients, []);
  readJsonFile<ClientInvite[]>(FILES.clientInvites, []);
  readJsonFile<ClientProject[]>(FILES.clientProjects, []);
  readJsonFile<DriverApplication[]>(FILES.driverApplications, []);
  readJsonFile<AuthUser[]>(FILES.authUsers, buildDefaultAuthUsers());
  readJsonFile<SystemSettings>(FILES.settings, {
    platformFeePercent: 15,
    clientProjectAutoApprove: false,
    driverApplicationAutoApprove: false,
    requiredDocumentTypes: ['W4', 'License', 'Insurance', 'Background Check', 'Offer Letter'],
  });
  readJsonFile<ActivityLogEntry[]>(FILES.activityLog, []);
}

type Collections = {
  employees: EmployeeRecord[];
  payroll: PayrollRecord[];
  documents: DocumentRecord[];
  designProjects: DesignProject[];
  designFiles: DesignFileRecord[];
  clients: ClientAccount[];
  clientInvites: ClientInvite[];
  clientProjects: ClientProject[];
  driverApplications: DriverApplication[];
  authUsers: AuthUser[];
  settings: SystemSettings;
  activityLog: ActivityLogEntry[];
};

export function readCollection<K extends keyof Collections>(name: K): Collections[K] {
  ensureOpsData();

  switch (name) {
    case 'employees':
      return readJsonFile(FILES.employees, [] as EmployeeRecord[]) as Collections[K];
    case 'payroll':
      return readJsonFile(FILES.payroll, [] as PayrollRecord[]) as Collections[K];
    case 'documents':
      return readJsonFile(FILES.documents, [] as DocumentRecord[]) as Collections[K];
    case 'designProjects':
      return readJsonFile(FILES.designProjects, [] as DesignProject[]) as Collections[K];
    case 'designFiles':
      return readJsonFile(FILES.designFiles, [] as DesignFileRecord[]) as Collections[K];
    case 'clients':
      return readJsonFile(FILES.clients, [] as ClientAccount[]) as Collections[K];
    case 'clientInvites':
      return readJsonFile(FILES.clientInvites, [] as ClientInvite[]) as Collections[K];
    case 'clientProjects':
      return readJsonFile(FILES.clientProjects, [] as ClientProject[]) as Collections[K];
    case 'driverApplications':
      return readJsonFile(FILES.driverApplications, [] as DriverApplication[]) as Collections[K];
    case 'authUsers':
      return readJsonFile(FILES.authUsers, buildDefaultAuthUsers()) as Collections[K];
    case 'settings':
      return readJsonFile(FILES.settings, {
        platformFeePercent: 15,
        clientProjectAutoApprove: false,
        driverApplicationAutoApprove: false,
        requiredDocumentTypes: ['W4', 'License', 'Insurance', 'Background Check', 'Offer Letter'],
      }) as Collections[K];
    case 'activityLog':
      return readJsonFile(FILES.activityLog, [] as ActivityLogEntry[]) as Collections[K];
    default:
      throw new Error(`Unknown collection: ${String(name)}`);
  }
}

export function writeCollection<K extends keyof Collections>(name: K, value: Collections[K]) {
  ensureOpsData();

  switch (name) {
    case 'employees':
      return writeJsonFile(FILES.employees, value);
    case 'payroll':
      return writeJsonFile(FILES.payroll, value);
    case 'documents':
      return writeJsonFile(FILES.documents, value);
    case 'designProjects':
      return writeJsonFile(FILES.designProjects, value);
    case 'designFiles':
      return writeJsonFile(FILES.designFiles, value);
    case 'clients':
      return writeJsonFile(FILES.clients, value);
    case 'clientInvites':
      return writeJsonFile(FILES.clientInvites, value);
    case 'clientProjects':
      return writeJsonFile(FILES.clientProjects, value);
    case 'driverApplications':
      return writeJsonFile(FILES.driverApplications, value);
    case 'authUsers':
      return writeJsonFile(FILES.authUsers, value);
    case 'settings':
      return writeJsonFile(FILES.settings, value);
    case 'activityLog':
      return writeJsonFile(FILES.activityLog, value);
    default:
      throw new Error(`Unknown collection: ${String(name)}`);
  }
}

export function appendActivity(action: string, actor: string, target: string) {
  const current = readCollection('activityLog');
  current.unshift({
    id: createId('activity'),
    action,
    actor,
    target,
    createdAt: nowIso(),
  });
  writeCollection('activityLog', current.slice(0, 50));
}

export function findStaffUser(email: string) {
  const users = readCollection('authUsers');
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.status === 'active') ?? null;
}

export function findClientByEmail(email: string) {
  const clients = readCollection('clients');
  return clients.find((client) => client.email.toLowerCase() === email.toLowerCase() && client.status === 'active') ?? null;
}

export function findClientInvite(inviteCode: string) {
  const invites = readCollection('clientInvites');
  const invite = invites.find((item) => item.inviteCode === inviteCode) ?? null;
  if (!invite) {
    return null;
  }

  if (invite.status === 'used' || new Date(invite.expiryDate) < new Date()) {
    return null;
  }

  return invite;
}

export function upsertEmployeeDocument(document: DocumentRecord) {
  const documents = readCollection('documents');
  const employees = readCollection('employees');
  documents.unshift(document);

  const employee = employees.find((entry) => entry.id === document.employeeId);
  if (employee) {
    employee.documents.unshift({
      id: document.id,
      type: document.type,
      filename: document.filename,
      uploadDate: document.uploadDate,
      expiryDate: document.expiryDate,
      path: document.path,
      archived: document.archived,
      uploadedBy: document.uploadedBy,
    });
    writeCollection('employees', employees);
  }

  writeCollection('documents', documents);
}

export function syncDesignProjectStatus(projectId: string, status: DesignProjectStatus, actor: string, note?: string) {
  const designProjects = readCollection('designProjects');
  const clientProjects = readCollection('clientProjects');
  const designProject = designProjects.find((entry) => entry.id === projectId);

  if (!designProject) {
    return null;
  }

  designProject.status = status;
  designProject.updatedDate = nowIso();
  if (note) {
    designProject.designNotes.unshift({
      id: createId('note'),
      author: actor,
      message: note,
      createdAt: nowIso(),
    });
  }
  writeCollection('designProjects', designProjects);

  const clientProject = clientProjects.find((entry) => entry.designProjectId === projectId);
  if (clientProject) {
    const mappedStatus: Record<DesignProjectStatus, ClientProjectStatus> = {
      pending: 'under-review',
      'in-progress': 'design-generated',
      'ready-for-print': 'ready-for-pickup',
      delivered: 'completed',
    };
    clientProject.status = mappedStatus[status];
    clientProject.updatedDate = nowIso();
    clientProject.timeline.unshift({
      status: clientProject.status,
      changedAt: nowIso(),
      changedBy: actor,
      note,
    });
    writeCollection('clientProjects', clientProjects);
  }

  return designProject;
}

export function createClientProjectFromSubmission(input: {
  clientId: string;
  companyName: string;
  projectTitle: string;
  vehicleType: string;
  industry: string;
  brandingLogo: string | null;
  colorPaletteImage: string | null;
  tagline: string;
  additionalNotes: string;
  autoApprove: boolean;
}) {
  const clientProjects = readCollection('clientProjects');
  const designProjects = readCollection('designProjects');
  const clients = readCollection('clients');

  const clientProjectId = createId('client-project');
  const designProjectId = createId('design-project');
  const now = nowIso();

  const clientProject: ClientProject = {
    id: clientProjectId,
    clientId: input.clientId,
    companyName: input.companyName,
    projectTitle: input.projectTitle,
    vehicleType: input.vehicleType,
    industry: input.industry,
    brandingLogo: input.brandingLogo,
    colorPaletteImage: input.colorPaletteImage,
    tagline: input.tagline,
    additionalNotes: input.additionalNotes,
    status: input.autoApprove ? 'under-review' : 'created',
    createdDate: now,
    updatedDate: now,
    designProjectId,
    timeline: [
      {
        status: input.autoApprove ? 'under-review' : 'created',
        changedAt: now,
        changedBy: input.companyName,
      },
    ],
    messageThread: [],
  };

  const designProject: DesignProject = {
    id: designProjectId,
    clientId: input.clientId,
    projectTitle: input.projectTitle,
    vehicleType: input.vehicleType,
    mockupImage: input.brandingLogo,
    vehicleSpecs: {
      year: '2024',
      make: 'Fleet',
      model: input.vehicleType,
      dimensions: 'Spec sheet pending',
      material: 'Premium vinyl',
      placement: 'Full wrap',
    },
    clientBranding: {
      companyName: input.companyName,
      logoPath: input.brandingLogo,
      colorPalettePath: input.colorPaletteImage,
      tagline: input.tagline,
      companyInfo: input.industry,
    },
    status: 'pending',
    createdDate: now,
    updatedDate: now,
    designNotes: input.additionalNotes
      ? [{ id: createId('note'), author: input.companyName, message: input.additionalNotes, createdAt: now }]
      : [],
    designFiles: [],
    externalCompany: null,
    communicationHistory: [],
    productionPackages: [],
  };

  clientProjects.unshift(clientProject);
  designProjects.unshift(designProject);

  const client = clients.find((entry) => entry.id === input.clientId);
  if (client) {
    client.projects.unshift({ projectId: clientProjectId });
  }

  writeCollection('clientProjects', clientProjects);
  writeCollection('designProjects', designProjects);
  writeCollection('clients', clients);

  return { clientProject, designProject };
}

export function updateDriverApplicationStatus(
  id: string,
  status: DriverApplicationStatus,
  actor: string,
  note: string,
  accessCode: string | null
) {
  const applications = readCollection('driverApplications');
  const application = applications.find((entry) => entry.id === id);
  if (!application) {
    return null;
  }

  application.status = status;
  application.notes = note || application.notes;
  application.approvedBy = actor;
  application.approvedDate = status === 'approved' ? nowIso() : application.approvedDate;
  application.accessCode = accessCode ?? application.accessCode;
  application.timeline.unshift({
    status,
    changedAt: nowIso(),
    changedBy: actor,
    note,
  });
  writeCollection('driverApplications', applications);
  return application;
}
