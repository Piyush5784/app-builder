import { Resend } from "resend";
import { NODE_ENV } from "@/config";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  NODE_ENV === "production"
    ? "noreply@web-builder.space"
    : "onboarding@resend.dev";

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  if (process.env.SEEDING === "true") {
    console.log(`📧 Skipping email to ${to} during seeding`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
}
