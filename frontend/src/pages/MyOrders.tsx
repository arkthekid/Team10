import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { getCurrentUser } from "@/lib/authApi";
import { getConversations } from "@/lib/conversationApi";
import { toast } from "sonner";

type ListingStatus = "available" | "sold_pending" | "completed";

const getUserFromResponse = (data: any) => {
  return data?.user || data?.data?.user || data?.data || data || {};
};

const getUserId = (userData: any) => {
  const user = getUserFromResponse(userData);

  return String(
    user?.id ||
      user?.userId ||
      user?._id ||
      user?.sub ||
      user?.user?.id ||
      user?.user?.userId ||
      ""
  );
};

const normalizeConversations = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.conversations)) return data.conversations;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const getConversationId = (conversation: any) => {
  return String(
    conversation?.conversationId ||
      conversation?.id ||
      conversation?._id ||
      conversation?.conversation?.conversationId ||
      conversation?.conversation?.id ||
      ""
  );
};

const getListingId = (conversation: any) => {
  return String(
    conversation?.listingId ||
      conversation?.listing?.listingId ||
      conversation?.listing?.id ||
      conversation?.listing?._id ||
      ""
  );
};

const getBuyerId = (conversation: any) => {
  return String(
    conversation?.buyerId ||
      conversation?.buyer?.id ||
      conversation?.buyer?.userId ||
      conversation?.conversation?.buyerId ||
      conversation?.conversation?.buyer?.id ||
      ""
  );
};

const getSellerName = (conversation: any) => {
  return (
    conversation?.seller?.name ||
    conversation?.listing?.seller?.name ||
    conversation?.sellerName ||
    "Seller"
  );
};

const getListingTitle = (conversation: any) => {
  return (
    conversation?.listing?.name ||
    conversation?.listing?.title ||
    conversation?.listingName ||
    conversation?.listingTitle ||
    "Listing"
  );
};

const getListingPrice = (conversation: any) => {
  const price =
    conversation?.listing?.price ??
    conversation?.listingPrice ??
    conversation?.price;

  if (price === null || price === undefined) return "";

  const numberPrice = Number(price);

  if (Number.isNaN(numberPrice)) return "";

  return numberPrice === 0
    ? "FREE"
    : `$${numberPrice.toLocaleString(undefined, {
        minimumFractionDigits: numberPrice % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`;
};

const getListingStatus = (conversation: any): ListingStatus => {
  const status =
    conversation?.listingStatus ||
    conversation?.listing?.status ||
    conversation?.status ||
    "available";

  if (status === "sold_pending" || status === "pending") return "sold_pending";
  if (status === "completed" || status === "complete" || status === "sold") {
    return "completed";
  }

  return "available";
};

const getStatusLabel = (status: ListingStatus) => {
  if (status === "sold_pending") return "Sale Pending";
  if (status === "completed") return "Complete";
  return "Available";
};

const getStatusClass = (status: ListingStatus) => {
  if (status === "sold_pending") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (status === "completed") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  return "bg-blue-100 text-blue-800 border-blue-200";
};

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        const userData = await getCurrentUser();
        const currentUserId = getUserId(userData);

        const conversationsData = await getConversations();
        const conversations = normalizeConversations(conversationsData);

        const buyerOrders = conversations.filter((conversation: any) => {
          const buyerId = getBuyerId(conversation);
          const status = getListingStatus(conversation);

          return (
            buyerId === currentUserId &&
            (status === "sold_pending" || status === "completed")
          );
        });

        setOrders(buyerOrders);
      } catch (err: any) {
        console.error("LOAD MY ORDERS ERROR:", err);
        toast.error(err.message || "Failed to load your orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            View items you are buying that are sale pending or complete.
          </p>
        </div>

        {loading && (
          <p className="text-center text-muted-foreground mt-12">
            Loading your orders...
          </p>
        )}

        {!loading && orders.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">
            You do not have any pending or completed orders yet.
          </p>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const conversationId = getConversationId(order);
              const listingId = getListingId(order);
              const status = getListingStatus(order);
              const title = getListingTitle(order);
              const price = getListingPrice(order);
              const sellerName = getSellerName(order);

              return (
                <div
                  key={conversationId}
                  className="bg-card border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{title}</h2>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Seller: {sellerName}
                    </p>

                    {price && (
                      <p className="text-sm text-muted-foreground">
                        Price: {price}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {listingId && (
                      <Link
                        to={`/listing/${listingId}`}
                        className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
                      >
                        View Listing
                      </Link>
                    )}

                    <Link
                      to="/messages"
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                    >
                      Open Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;