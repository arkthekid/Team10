import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken } from "@/lib/api";
import { logoutUser } from "@/lib/authApi";
import { ChevronDown } from "lucide-react";

const MarketplaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}

    setProfileOpen(false);
    navigate("/login");
  };

  const showNav = !["/"].includes(location.pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            {isLoggedIn ? (
              <>
                <Link
                  to="/favorites"
                  className="hover:text-primary-foreground/80 transition-colors"
                >
                  Favorites
                </Link>

                <Link
                  to="/messages"
                  className="hover:text-primary-foreground/80 transition-colors"
                >
                  Messages
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="flex items-center gap-1 hover:text-primary-foreground/80 transition-colors"
                  >
                    Profile
                    <ChevronDown size={16} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-48 rounded-md border bg-background text-foreground shadow-lg z-50 overflow-hidden">
                      <Link
                        to="/my-listings"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      >
                        My Listings
                      </Link>

                      <Link
                        to="/my-orders"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      >
                        My Orders
                      </Link>

                      <Link
                        to="/blocked-users"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      >
                        Blocked Sellers
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="hover:text-primary-foreground/80 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default MarketplaceHeader;