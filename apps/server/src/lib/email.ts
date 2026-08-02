import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    from: "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
}
