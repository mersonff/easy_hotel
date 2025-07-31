import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpar dados existentes
  await prisma.user.deleteMany();

  // Criar usuários de exemplo
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@easyhotel.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+55 11 99999-9999',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      isActive: true
    }
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@easyhotel.com',
      password: hashedPassword,
      role: 'STAFF',
      phone: '+55 11 88888-8888',
      address: 'Av. Paulista, 456 - São Paulo, SP',
      isActive: true
    }
  });

  const guest = await prisma.user.create({
    data: {
      name: 'Guest User',
      email: 'guest@easyhotel.com',
      password: hashedPassword,
      role: 'GUEST',
      phone: '+55 11 77777-7777',
      address: 'Rua Augusta, 789 - São Paulo, SP',
      isActive: true
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👥 Created users:');
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Staff: ${staff.email}`);
  console.log(`   - Guest: ${guest.email}`);
  console.log('🔑 Password for all users: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 