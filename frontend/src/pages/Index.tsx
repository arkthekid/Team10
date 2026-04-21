import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MarketplaceHeader from "@/components/MarketplaceHeader";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card rounded-lg shadow-sm border p-8 max-w-3xl w-full text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to UMass Marketplace</h1>
          <p className="text-2xl text-muted-foreground mb-12">
            A one stop solution to buy and sell items.
          </p>

          <div className="max-w-xl mx-auto space-y-6">
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-16 text-2xl font-semibold"
            >
              Login
            </Button>

            <Button
              onClick={() => navigate("/register")}
              variant="outline"
              className="w-full h-16 text-2xl font-semibold"
            >
              Register
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;