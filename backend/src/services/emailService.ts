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