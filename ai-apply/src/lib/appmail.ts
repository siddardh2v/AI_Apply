import { prisma } from "@/lib/prisma";

// The domain used for in-app inbox addresses. With Cloudflare Email Routing,
// set a catch-all on this (sub)domain to forward to /api/email/inbound.
export const INBOUND_DOMAIN =
  process.env.INBOUND_EMAIL_DOMAIN || "apply.jobward.test";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/@.*/, "") // drop anything after @ if an email was passed
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 24) || "user"
  );
}

function randomToken(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** The reply address for an application, given its token. */
export function appReplyAddress(token: string): string {
  return `${token}@${INBOUND_DOMAIN}`;
}

/** Ensure the user has an assigned inbox address; create one if missing. */
export async function ensureAppEmail(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { appEmail: true, name: true, email: true },
  });
  if (!user) throw new Error("User not found");
  if (user.appEmail) return user.appEmail;

  const base = slugify(user.name || user.email);
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `${base}.${randomToken(4)}@${INBOUND_DOMAIN}`;
    const taken = await prisma.user.findUnique({
      where: { appEmail: candidate },
      select: { id: true },
    });
    if (!taken) {
      await prisma.user.update({
        where: { id: userId },
        data: { appEmail: candidate },
      });
      return candidate;
    }
  }
  throw new Error("Could not allocate an inbox address");
}

/** Ensure an application has a reply token; create one if missing. */
export async function ensureReplyToken(applicationId: string): Promise<string> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { replyToken: true },
  });
  if (!app) throw new Error("Application not found");
  if (app.replyToken) return app.replyToken;

  for (let attempt = 0; attempt < 10; attempt++) {
    const token = `app${randomToken(10)}`;
    const taken = await prisma.application.findUnique({
      where: { replyToken: token },
      select: { id: true },
    });
    if (!taken) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { replyToken: token },
      });
      return token;
    }
  }
  throw new Error("Could not allocate a reply token");
}

export interface InboundInput {
  to: string;
  from: string;
  subject: string;
  body: string;
  messageId?: string;
}

export interface InboundResult {
  matched: boolean;
  applicationId?: string;
  userId?: string;
}

/**
 * Record an incoming email. Routes by the recipient address:
 *  - <replyToken>@domain  → threads onto that application
 *  - <appEmail>           → lands in that user's inbox (no application)
 */
export async function recordInbound(input: InboundInput): Promise<InboundResult> {
  const to = input.to.trim().toLowerCase();
  const localPart = to.split("@")[0];

  // 1) Match an application by its reply token.
  const app = await prisma.application.findFirst({
    where: { replyToken: localPart },
    select: { id: true, userId: true },
  });

  let userId: string | undefined = app?.userId;
  let applicationId: string | undefined = app?.id;

  // 2) Otherwise match a user by their assigned inbox address.
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { appEmail: to },
      select: { id: true },
    });
    userId = user?.id;
  }

  if (!userId) return { matched: false };

  await prisma.emailMessage.create({
    data: {
      userId,
      applicationId: applicationId ?? null,
      direction: "inbound",
      toAddress: to,
      fromAddress: input.from,
      subject: input.subject || "(no subject)",
      body: input.body || "",
      status: "received",
      providerId: input.messageId || null,
      sentAt: new Date(),
    },
  });

  // Surface a reply on the application timeline.
  if (applicationId) {
    await prisma.application.update({
      where: { id: applicationId },
      data: { responseDate: new Date() },
    });
  }

  return { matched: true, applicationId, userId };
}
