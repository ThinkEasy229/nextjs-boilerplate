import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { createDriverCode } from '@/lib/driver-codes';
import { saveUploadedFile } from '@/lib/ops-uploads';
import { appendActivity, createId, readCollection, type DriverApplication, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error) return error;

  return NextResponse.json({ success: true, data: readCollection('driverApplications') });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const dob = formData.get('dob');
    const address = formData.get('address');
    const emergencyContact = formData.get('emergencyContact');
    const vehicleYear = formData.get('vehicleYear');
    const vehicleMake = formData.get('vehicleMake');
    const vehicleModel = formData.get('vehicleModel');
    const vin = formData.get('vin');
    const insuranceProvider = formData.get('insuranceProvider');
    const insurancePolicyNumber = formData.get('insurancePolicyNumber');
    const backgroundConsent = formData.get('backgroundConsent');
    const licenseFile = formData.get('licenseFile');
    const insuranceFile = formData.get('insuranceFile');

    const requiredFields = [name, email, phone, dob, address, emergencyContact, vehicleYear, vehicleMake, vehicleModel, vin, insuranceProvider];
    if (requiredFields.some((field) => typeof field !== 'string' || !field.trim()) || !(licenseFile instanceof File) || !(insuranceFile instanceof File)) {
      return NextResponse.json({ success: false, error: 'Please complete all required fields.' }, { status: 400 });
    }

    const safeName = name as string;
    const safeEmail = email as string;
    const safePhone = phone as string;
    const safeDob = dob as string;
    const safeAddress = address as string;
    const safeEmergencyContact = emergencyContact as string;
    const safeVehicleYear = vehicleYear as string;
    const safeVehicleMake = vehicleMake as string;
    const safeVehicleModel = vehicleModel as string;
    const safeVin = vin as string;
    const safeInsuranceProvider = insuranceProvider as string;

    const licenseUpload = await saveUploadedFile(licenseFile, 'driver-licenses');
    const insuranceUpload = await saveUploadedFile(insuranceFile, 'driver-insurance');
    const settings = readCollection('settings');
    const autoApproved = settings.driverApplicationAutoApprove;
    const now = new Date().toISOString();
    const accessCode = autoApproved ? createDriverCode(safeName, safeEmail, null).code : null;
const safeInsurancePolicyNumber =
  typeof insurancePolicyNumber === 'string' ? insurancePolicyNumber.trim() : '';
const application: DriverApplication = {
  id: createId('application'),
  name: safeName,
  email: safeEmail,
  phone: safePhone,
  dob: safeDob,
  address: safeAddress,
  emergencyContact: safeEmergencyContact || undefined,

  vehicleYear: safeVehicleYear,
  vehicleMake: safeVehicleMake,
  vehicleModel: safeVehicleModel,
  vin: safeVin,

  insuranceProvider: safeInsuranceProvider,
insurancePolicyNumber: safeInsurancePolicyNumber,
  licenseFile: safeLicenseFile,
  insuranceFile: safeInsuranceFile,
  licenseBackFile: safeLicenseBackFile || '',

  documentVerificationStatus: 'pending',
  documents: [
    {
      key: 'license-front',
      label: 'Driver License (Front)',
      filePath: safeLicenseFile || null,
      status: 'pending',
      uploadedAt: now,
      reviewedAt: null,
      reviewedBy: null,
    },
    {
      key: 'license-back',
      label: 'Driver License (Back)',
      filePath: safeLicenseBackFile || null,
      status: 'pending',
      uploadedAt: now,
      reviewedAt: null,
      reviewedBy: null,
    },
    {
      key: 'insurance-card',
      label: 'Insurance Card',
      filePath: safeInsuranceFile || null,
      status: 'pending',
      uploadedAt: now,
      reviewedAt: null,
      reviewedBy: null,
    },
    {
      key: 'background-consent',
      label: 'Background Check Consent',
      filePath: null,
      status: 'pending',
      uploadedAt: now,
      reviewedAt: null,
      reviewedBy: null,
    },
  ],
  backgroundCheck: {
    provider: process.env.BACKGROUND_CHECK_PROVIDER || 'internal',
    status: 'not-requested',
    summary: 'Awaiting consent and HR review',
    requestedAt: null,
    completedAt: null,
    reviewerId: null,
    externalId: null,
    retryable: true,
    attempts: 0,
    lastError: null,
  },

  status: autoApproved ? 'approved' : 'pending',
  appliedDate: now,
  approvedDate: autoApproved ? now : null,
  reviewedBy: autoApproved ? 'system' : null,
  notes: safeNotes || '',
  accessCode,
};

    const applications = readCollection('driverApplications');
    applications.unshift(application);
    writeCollection('driverApplications', applications);
    appendActivity('driver.application.created', safeEmail, safeName);
    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to submit application.' },
      { status: 500 }
    );
  }
}
