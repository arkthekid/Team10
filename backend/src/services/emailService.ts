import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "arkarmoemyint100@gmail.com",
    subject: "Verify your UMass Marketplace account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B0000;">Welcome to UMass Marketplace!</h2>
        <p>Thanks for signing up. Please verify your email address to get started.</p>
        <a href="${verificationUrl}" 
           style="background-color: #8B0000; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
        <p style="color: #666; margin-top: 16px;">
          This link will expire in 24 hours.
        </p>
        <p style="color: #666;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

type SendReportEmailInput = {
  reportId: string;
  targetType: "user" | "listing";
  reason: string;
  comments?: string | null;
  reporterEmail?: string | null;
  reportedUserEmail?: string | null;
  reportedListingId?: string | null;
  conversationId?: string | null;
};

export const sendReportNotificationEmail = async (
  data: SendReportEmailInput
) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "gmarathe@umass.edu",
    subject: `New marketplace report: ${data.targetType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #8B0000;">New Report Submitted</h2>
        <p><strong>Report ID:</strong> ${data.reportId}</p>
        <p><strong>Target Type:</strong> ${data.targetType}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Reporter Email:</strong> ${data.reporterEmail ?? "N/A"}</p>
        <p><strong>Reported User Email:</strong> ${data.reportedUserEmail ?? "N/A"}</p>
        <p><strong>Reported Listing ID:</strong> ${data.reportedListingId ?? "N/A"}</p>
        <p><strong>Conversation ID:</strong> ${data.conversationId ?? "N/A"}</p>
        <p><strong>Comments:</strong><br/>${data.comments || "No additional comments provided."}</p>
      </div>
    `,
  });
};