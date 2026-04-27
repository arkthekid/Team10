import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getBlockedUsers, unblockUser } from "@/lib/blockApi";

const getBlockedUser = (item: any) => {
  return item.user || item.blocked || item.blockedUser || {};
};

const getBlockedUserId = (item: any) => {
  return (
    item?.user?.id ||
    item?.user?.userId ||
    item?.blocked?.id ||
    item?.blocked?.userId ||
    item?.blockedUser?.id ||
    item?.blockedUser?.userId ||
    item?.blockedId ||
    ""
  );
};

const BlockedUsers = () => {
  const navigate = useNavigate();

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBlockedUsers() {
      try {
        setLoading(true);
        setError("");

        const data = await getBlockedUsers();

        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data.blocks)
          ? data.blocks
          : [];

        setBlockedUsers(normalized);
      } catch (err: any) {
        setError(err.message || "Failed to load blocked users");
      } finally {
        setLoading(false);
      }
    }

    loadBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to unblock this seller?"
    );
    if (!confirmed) return;

    try {
      setUnblockingId(userId);
      await unblockUser(userId);

      setBlockedUsers((prev) =>
        prev.filter((item) => {
          const blockedId = getBlockedUserId(item);
          return String(blockedId) !== String(userId);
        })
      );

      toast.success("Seller unblocked successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to unblock seller");
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Blocked Sellers</h1>

        {loading && (
          <p className="text-muted-foreground">Loading blocked sellers...</p>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && blockedUsers.length === 0 && (
          <p className="text-muted-foreground">
            You have not blocked any sellers.
          </p>
        )}

        {!loading && !error && blockedUsers.length > 0 && (
          <div className="space-y-4">
            {blockedUsers.map((item) => {
              const user = getBlockedUser(item);
              const userId = String(getBlockedUserId(item));

              return (
                <div
                  key={item.id || item.blockId || userId}
                  className="border rounded-2xl p-4 bg-card flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-lg font-semibold">
                      {user.name || "Unknown User"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {user.umassEmail || user.email || "No email available"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(userId)}
                    disabled={unblockingId === userId}
                  >
                    {unblockingId === userId ? "Unblocking..." : "Unblock"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockedUsers;