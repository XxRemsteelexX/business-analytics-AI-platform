import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creating Thompson admin user...')

  // Create Thompson admin account
  const hashedPassword = await bcrypt.hash('TPMC01234', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'thompson@tpmc.com' },
    update: {},
    create: {
      email: 'thompson@tpmc.com',
      password: hashedPassword,
      firstName: 'Thompson',
      lastName: 'Admin',
      companyName: 'Thompson PMC',
      jobTitle: 'Administrator',
    },
  })

  console.log('✅ Created admin user:', adminUser.email)
  console.log('🔐 Use email: thompson@tpmc.com with password: TPMC01234')
}

main()
  .catch((e) => {
    console.error('❌ Admin user creation failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
