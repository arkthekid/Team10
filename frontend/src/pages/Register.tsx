import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { registerUser } from "@/lib/authApi";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [umassEmail, setUmassEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      await registerUser({
        name,
        umassEmail,
        password,
      });

      setSuccess("Registration successful. Please log in with Google.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card rounded-lg shadow-sm border p-8 max-w-sm w-full">
          <h1 className="text-2xl font-semibold mb-2 text-center">Register</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Create your marketplace account
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full h-12 rounded-md border bg-background px-3 text-sm"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">UMass Email</label>
              <input
                type="email"
                className="w-full h-12 rounded-md border bg-background px-3 text-sm"
                placeholder="Enter your UMass email"
                value={umassEmail}
                onChange={(e) => setUmassEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full h-12 rounded-md border bg-background px-3 text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>
              Already registered?{" "}
              <Link to="/login" className="underline">
                Go to login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;