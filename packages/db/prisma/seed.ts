import { faker } from "@faker-js/faker";
import { prisma } from "../src/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
});

const USER_COUNT = 5;

async function createUsers() {
  const users = [];

  for (let i = 1; i <= USER_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `user${i}@example.com`;

    await auth.api.signUpEmail({
      body: {
        name: `${firstName} ${lastName}`,
        email,
        password: "12345678",
        image: `https://i.pravatar.cc/150?img=${i}`,
      },
    });

    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    users.push(user);
  }

  return users;
}

async function main() {
  console.log("🌱 Seeding...");

  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const users = await createUsers();
  console.log(`✅ Created ${users.length} users`);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
