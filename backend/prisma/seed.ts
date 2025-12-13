import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@bhishakmed.com' },
    update: {},
    create: {
      email: 'admin@bhishakmed.com',
      password: adminPassword,
      fullName: 'Super Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);
  console.log('📧 Email: admin@bhishakmed.com');
  console.log('🔑 Password: admin123');

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
