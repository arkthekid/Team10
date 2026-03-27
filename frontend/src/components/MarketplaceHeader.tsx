import { Link, useLocation } from "react-router-dom";

const MarketplaceHeader = () => {
  const location = useLocation();
  const showNav = !["/", "/login", "/browse"].includes(location.pathname);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center font-extrabold text-lg">
            U
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Marketplace</h1>
        </Link>

        {showNav && (
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/browse" className="hover:text-primary-foreground/80 transition-colors">Browse</Link>
            <Link to="/create" className="hover:text-primary-foreground/80 transition-colors">Sell</Link>
            <Link to="/messages" className="hover:text-primary-foreground/80 transition-colors">Messages</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default MarketplaceHeader;
