import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@aiapply.local";
const DEMO_PASSWORD = "password123";

async function main() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Demo User",
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      },
    });
    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  const existing = await prisma.resume.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log("Demo user already has a resume — skipping.");
    return;
  }

  await prisma.resume.create({
    data: {
      userId: user.id,
      title: "Sample Resume",
      isDefault: true,
      originalText: `Jane Developer
Full-Stack Software Engineer | jane@example.com | github.com/jane

SUMMARY
Full-stack engineer with 5 years building web apps in TypeScript, React, and Node.js.

EXPERIENCE
Senior Software Engineer, Acme Corp (2022–present)
- Led migration of monolith to Next.js, cutting page loads by 40%.
- Built CI/CD pipelines and mentored 3 junior engineers.

Software Engineer, Startup Inc (2020–2022)
- Shipped a customer dashboard used by 10k+ users.
- Designed REST APIs and Postgres schemas.

EDUCATION
B.S. Computer Science, State University (2020)

SKILLS
TypeScript, React, Next.js, Node.js, PostgreSQL, AWS, Docker`,
      parsedContent: JSON.stringify({
        summary:
          "Full-stack engineer with 5 years building web apps in TypeScript, React, and Node.js.",
        skills: [
          "TypeScript",
          "React",
          "Next.js",
          "Node.js",
          "PostgreSQL",
          "AWS",
          "Docker",
        ],
        work_experience: [
          {
            title: "Senior Software Engineer",
            company: "Acme Corp",
            duration: "2022–present",
            description:
              "Led Next.js migration; built CI/CD; mentored engineers.",
          },
          {
            title: "Software Engineer",
            company: "Startup Inc",
            duration: "2020–2022",
            description: "Shipped customer dashboard; designed REST APIs.",
          },
        ],
        education: ["B.S. Computer Science, State University (2020)"],
        certifications: [],
      }),
    },
  });

  console.log("Seeded sample resume for demo user.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
