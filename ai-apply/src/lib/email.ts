// Email provider abstraction. Supports Resend (RESEND_API_KEY) or SMTP
// (SMTP_HOST/...). If neither is configured, sending is unavailable and
// messages are saved as drafts instead.

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface SendEmailResult {
  id: string | null;
  provider: "resend" | "smtp";
}

export function emailProvider(): "resend" | "smtp" | null {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  return null;
}

export function defaultFrom(): string {
  return process.env.EMAIL_FROM || "Jobward <onboarding@resend.dev>";
}

/** Send an email via the configured provider. Throws if none is configured. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = emailProvider();
  const from = input.from || defaultFrom();

  if (provider === "resend") {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
    if (error) throw new Error(error.message || "Resend send failed.");
    return { id: data?.id ?? null, provider: "resend" };
  }

  if (provider === "smtp") {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
    return { id: info.messageId ?? null, provider: "smtp" };
  }

  throw new Error(
    "Email sending is not configured. Add RESEND_API_KEY or SMTP settings to .env."
  );
}
