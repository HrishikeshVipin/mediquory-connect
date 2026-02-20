import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encrypt } from '../src/utils/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@mediquory.com' },
    update: {
      role: 'SUPER_ADMIN', // Ensure existing admin is upgraded to SUPER_ADMIN
    },
    create: {
      email: 'admin@mediquory.com',
      password: adminPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);
  console.log('📧 Email: admin@mediquory.com');
  console.log('🔑 Password: admin123');

  // Create verified test doctor for development
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // Encrypt sensitive data
  const encryptedGovId = encrypt('ABCDE1234F');
  const encryptedUpiId = encrypt('doctor@upi');

  const testDoctor = await prisma.doctor.upsert({
    where: { email: 'doctor@test.com' },
    update: {
      governmentIdNumber: encryptedGovId,
      upiId: encryptedUpiId,
    },
    create: {
      email: 'doctor@test.com',
      password: doctorPassword,
      fullName: 'Dr. Test Doctor',
      phone: '+919876543210',
      specialization: 'General Physician',
      registrationType: 'NATIONAL_MEDICAL_COMMISSION',
      registrationNo: 'NMC12345',
      registrationState: null,
      governmentIdType: 'PAN_CARD',
      governmentIdNumber: encryptedGovId, // ENCRYPTED
      status: 'VERIFIED', // Pre-verified for testing
      upiId: encryptedUpiId, // ENCRYPTED
      trialEndsAt,
      subscriptionStatus: 'TRIAL',
      subscriptionTier: 'TRIAL',
      patientLimit: 2,
      monthlyVideoMinutes: 100,
    },
  });

  console.log('\n✅ Created test doctor:', testDoctor.email);
  console.log('📧 Email: doctor@test.com');
  console.log('🔑 Password: doctor123');
  console.log('⚕️ Status: VERIFIED');

  // Create subscription plans
  console.log('\n📋 Creating subscription plans...');

  const subscriptionPlans = [
    {
      tier: 'TRIAL',
      name: 'Trial Plan',
      price: 0,
      patientLimit: 2,
      monthlyVideoMinutes: 100,
      features: JSON.stringify([
        '2 patients maximum',
        '100 video minutes/month',
        '14 days trial period',
        'All features included'
      ]),
      suggestedFor: JSON.stringify([
        'Testing the platform',
        'Very small practices'
      ]),
      avgConsultationTime: 15,
      active: true
    },
    {
      tier: 'BASIC',
      name: 'Basic Plan',
      price: 99900, // ₹999
      patientLimit: 50,
      monthlyVideoMinutes: 500,
      features: JSON.stringify([
        '50 patients',
        '500 video minutes/month (~8 hours)',
        'Email support',
        'Buy extra minutes anytime'
      ]),
      suggestedFor: JSON.stringify([
        'General practitioners',
        'Short consultations (10-15 min)',
        'Solo practitioners'
      ]),
      avgConsultationTime: 15,
      active: true
    },
    {
      tier: 'PROFESSIONAL',
      name: 'Professional Plan',
      price: 249900, // ₹2,499
      patientLimit: 200,
      monthlyVideoMinutes: 2000,
      features: JSON.stringify([
        '200 patients',
        '2000 video minutes/month (~33 hours)',
        'Priority email support',
        'Patient reviews & ratings',
        'Analytics dashboard',
        'Buy extra minutes anytime'
      ]),
      suggestedFor: JSON.stringify([
        'Busy practitioners',
        'Medium-length consultations (20-30 min)',
        'Growing practices'
      ]),
      avgConsultationTime: 25,
      active: true
    },
    {
      tier: 'ENTERPRISE',
      name: 'Enterprise Plan',
      price: 499900, // ₹4,999
      patientLimit: -1, // Unlimited
      monthlyVideoMinutes: 5000,
      features: JSON.stringify([
        'Unlimited patients',
        '5000 video minutes/month (~83 hours)',
        '24/7 phone + email support',
        'Patient reviews & ratings',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'Buy extra minutes anytime'
      ]),
      suggestedFor: JSON.stringify([
        'Psychiatry & psychology',
        'Long consultations (45-60 min)',
        'Large practices',
        'Clinics with multiple doctors'
      ]),
      avgConsultationTime: 50,
      active: true
    }
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan
    });
    console.log(`✅ Created/Updated plan: ${plan.name} (${plan.tier})`);
  }

  // Create default system settings
  const systemSettings = [
    {
      key: 'ENABLE_PATIENT_SIGNUP',
      value: 'false', // Default: disabled
      type: 'BOOLEAN',
      label: 'Enable Patient Self-Registration',
      description: 'Allow patients to sign up directly via the app. When disabled, patients can only be added by doctors or through invite links.',
      category: 'FEATURES',
    },
  ];

  console.log('\n📝 Creating system settings...');
  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
    console.log(`✅ Created/Updated setting: ${setting.label} (${setting.key})`);
  }

  console.log('\n🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
