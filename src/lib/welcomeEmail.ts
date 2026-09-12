// Round 6/14 welcome email — sent once per user, fired from the check-in
// page the first time a confirmed user lands there (see
// src/app/(app)/checkin/page.tsx, which claims profiles.welcome_email_sent_at
// before calling this, so a failed send here is a rare miss rather than a
// duplicate). Server-only: RESEND_API_KEY must never reach the client.

const RESEND_API_URL = "https://api.resend.com/emails";
// Resend verified mail.intentionalministries.com (a subdomain), not the
// bare root domain — sending from the root domain bounces with a 550
// "domain is not verified" even though the root domain itself resolves.
const FROM_ADDRESS = "Intentional Ministries <app@mail.intentionalministries.com>";

interface WelcomeEmailParams {
  to: string;
  firstName: string;
  ministryLinkUrl: string | null;
  ministryLinkLabel: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml({ firstName, ministryLinkUrl, ministryLinkLabel }: WelcomeEmailParams): string {
  const safeName = escapeHtml(firstName || "there");
  const linkButton =
    ministryLinkUrl && ministryLinkLabel
      ? `<p style="margin:0 0 8px;">
           <a href="${escapeHtml(ministryLinkUrl)}" style="display:inline-block;background:#7993c2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;">
             ${escapeHtml(ministryLinkLabel)}
           </a>
         </p>`
      : "";

  return `
<div style="background:#f4f5f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#253551;padding:24px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">INTENTIONAL MINISTRIES</p>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;color:#253551;font-size:20px;font-weight:700;">Welcome, ${safeName}</h1>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
        You're all set and ready to get started.
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
        Each week, take a few moments to complete your Check-in by rating yourself in five areas
        of life. Your group's Dashboard gives everyone a quick picture of how the group is doing
        and helps you know where to encourage, pray for, and follow up with one another.
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
        You can also add a Prayer &amp; Life Update or set personal goals to help your group know
        how to support you.
      </p>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;">
        Your Check-in stays editable until 11:59 PM on your group's meeting day.
      </p>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;">
        Need help? You'll find simple instructions for the Check-in, Dashboard, Settings, and
        leader tools under Settings → Help &amp; Tips.
      </p>
      ${linkButton}
      <p style="margin:24px 0 0;color:#374151;font-size:13px;font-weight:700;line-height:1.5;">
        Intentional Ministries
      </p>
      <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
        Helping men live intentionally and grow stronger together.
      </p>
    </div>
  </div>
</div>`.trim();
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured — skipping welcome email");
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [params.to],
      subject: "Welcome to Intentional Ministries",
      html: buildHtml(params),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend welcome email failed (${response.status}): ${body}`);
  }
}
