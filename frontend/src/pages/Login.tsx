import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { googleLogin } from "@/lib/authApi";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current || !GOOGLE_CLIENT_ID) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            setError("");
            await googleLogin(response.credential);
            navigate("/browse");
          } catch (err: any) {
            console.error("Google login failed:", err);
            setError(err.message || "Google login failed");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
      });
    };

    const existingScript = document.getElementById("google-oauth-script");

    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "google-oauth-script";
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card rounded-lg shadow-sm border p-8 max-w-sm w-full">
          <h1 className="text-2xl font-semibold mb-2 text-center">Login</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in with your UMass Google account
          </p>

          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center mt-4">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;