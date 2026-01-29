import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM || 'noreply@yourdomain.com';

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) throw new Error('Resend API Key 未配置');
  return resend.emails.send({
    from: mailFrom,
    to,
    subject,
    html,
  });
}
