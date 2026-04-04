import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card rounded-lg shadow-sm border p-8 md:p-12 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-card-foreground mb-3">
            Welcome to UMass Marketplace
          </h2>
          <p className="text-muted-foreground mb-8">
            A one stop solution to buy and sell items.
          </p>

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => navigate("/login")} className="px-10">
              Login
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/register")} className="px-10">
              Register
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;