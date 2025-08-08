import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'jamie@bspoq.ai' },
    update: {},
    create: {
      email: 'jamie@bspoq.ai',
      name: 'Jamie',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('Afrocomb_2017!', 10)
    }
  })

  // Create sample chart config
  await prisma.chartConfig.upsert({
    where: { userId_key: { userId: admin.id, key: 'thd-daily' } },
    update: {},
    create: {
      userId: admin.id,
      key: 'thd-daily',
      config: { threshold: 5, unit: '%' }
    }
  })

  console.log('Database seeded successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
