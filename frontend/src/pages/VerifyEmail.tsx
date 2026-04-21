import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { verifyEmail } from "../lib/authApi";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Verification token is missing.");
      return;
    }

    const runVerification = async () => {
      try {
        await verifyEmail(token);
        setMessage("Email verified successfully. Redirecting...");
        setTimeout(() => {
          navigate("/browse");
        }, 1500);
      } catch (err: any) {
        setError(err.message || "Email verification failed.");
      }
    };

    runVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card rounded-lg shadow-sm border p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>

          {!error ? (
            <p className="text-muted-foreground">{message}</p>
          ) : (
            <p className="text-red-500">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;