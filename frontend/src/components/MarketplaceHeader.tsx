import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken } from "@/lib/api";
import { logoutUser } from "@/lib/authApi";

const MarketplaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    navigate("/login");
  };

  const showNav = !["/"].includes(location.pathname);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <Link
          to={isLoggedIn ? "/browse" : "/"}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center font-extrabold text-lg">
            U
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Marketplace
          </h1>
        </Link>

        {showNav && (
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/create"
              className="hover:text-primary-foreground/80 transition-colors"
            >
              Sell
            </Link>
            <Link
              to="/favorites"
              className="hover:text-primary-foreground/80 transition-colors"
            >
              Favorites
            </Link>
            <Link
              to="/blocked-users"
              className="hover:text-primary-foreground/80 transition-colors"
            >
              Blocked Sellers
            </Link>
            <Link
              to="/messages"
              className="hover:text-primary-foreground/80 transition-colors"
            >
              Messages
            </Link>

            {!isLoggedIn ? (
              <Link
                to="/login"
                className="hover:text-primary-foreground/80 transition-colors"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="hover:text-primary-foreground/80 transition-colors"
              >
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default MarketplaceHeader;