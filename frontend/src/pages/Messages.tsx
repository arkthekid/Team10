import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Trash2, Clock, PackageCheck } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/authApi";
import {
  getConversations,
  startConversation,
  markConversationSold,
  markConversationCompleted,
} from "@/lib/conversationApi";
import { getMessages, sendMessage, deleteMessage } from "@/lib/messageApi";

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

const getListingTitle = (conversation: any) => {
  return (
    conversation?.listing?.name ||
    conversation?.listing?.title ||
    conversation?.listingName ||
    conversation?.listingTitle ||
    conversation?.name ||
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

const getConversationBuyerId = (conversation: any) => {
  return String(
    conversation?.buyerId ||
      conversation?.buyer?.id ||
      conversation?.buyer?.userId ||
      conversation?.conversation?.buyerId ||
      conversation?.conversation?.buyer?.id ||
      conversation?.conversation?.buyer?.userId ||
      ""
  );
};

const getConversationSellerId = (conversation: any) => {
  return String(
    conversation?.sellerId ||
      conversation?.seller?.id ||
      conversation?.seller?.userId ||
      conversation?.conversation?.sellerId ||
      conversation?.conversation?.seller?.id ||
      conversation?.conversation?.seller?.userId ||
      ""
  );
};

const getOtherUserName = (conversation: any, currentUserId: string) => {
  const buyerId = getConversationBuyerId(conversation);
  const sellerId = getConversationSellerId(conversation);

  if (currentUserId && currentUserId === buyerId) {
    return (
      conversation?.seller?.name ||
      conversation?.listing?.seller?.name ||
      conversation?.sellerName ||
      "Seller"
    );
  }

  if (currentUserId && currentUserId === sellerId) {
    return conversation?.buyer?.name || conversation?.buyerName || "Buyer";
  }

  return (
    conversation?.otherUser?.name ||
    conversation?.seller?.name ||
    conversation?.buyer?.name ||
    "User"
  );
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

const normalizeConversations = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.conversations)) return data.conversations;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const normalizeMessages = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.messages)) return data.messages;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const normalizeStartedConversation = (data: any) => {
  return data?.conversation || data?.data?.conversation || data?.data || data;
};

const updateConversationStatus = (
  conversation: any,
  status: ListingStatus,
  updatedListing?: any
) => {
  return {
    ...conversation,
    listingStatus: status,
    listing: {
      ...(conversation?.listing || {}),
      ...(updatedListing || {}),
      status,
    },
  };
};

const Messages = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const listingId = params.get("listingId");

  const [currentUserId, setCurrentUserId] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const selectedConversationId = selectedConversation
    ? getConversationId(selectedConversation)
    : "";

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);

        const userData = await getCurrentUser().catch(() => null);
        const userId = getUserId(userData);
        setCurrentUserId(userId);

        if (listingId) {
          const started = await startConversation(listingId);
          const conversation = normalizeStartedConversation(started);

          setSelectedConversation(conversation);

          const allConversations = await getConversations().catch(() => []);
          setConversations(normalizeConversations(allConversations));
        } else {
          const allConversations = await getConversations();
          const normalized = normalizeConversations(allConversations);

          setConversations(normalized);

          if (normalized.length > 0) {
            setSelectedConversation(normalized[0]);
          }
        }
      } catch (err: any) {
        console.error("LOAD MESSAGES PAGE ERROR:", err);
        toast.error(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [listingId]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);

        const data = await getMessages(selectedConversationId);
        setMessages(normalizeMessages(data));
      } catch (err: any) {
        console.error("LOAD MESSAGES ERROR:", err);
        toast.error(err.message || "Failed to load conversation messages");
      } finally {
        setMessagesLoading(false);
      }
    }

    loadMessages();
  }, [selectedConversationId]);

  const conversationTitle = useMemo(() => {
    if (!selectedConversation) return "Messages";
    return getOtherUserName(selectedConversation, currentUserId);
  }, [selectedConversation, currentUserId]);

  const listingLabel = useMemo(() => {
    if (!selectedConversation) return "";

    const title = getListingTitle(selectedConversation);
    const price = getListingPrice(selectedConversation);

    return price ? `${title} · ${price}` : title;
  }, [selectedConversation]);

  const listingStatus = selectedConversation
    ? getListingStatus(selectedConversation)
    : "available";

  const selectedBuyerId = selectedConversation
    ? getConversationBuyerId(selectedConversation)
    : "";

  const selectedSellerId = selectedConversation
    ? getConversationSellerId(selectedConversation)
    : "";

  const isBuyer =
    !!selectedConversation &&
    !!currentUserId &&
    !!selectedBuyerId &&
    currentUserId === selectedBuyerId;

  const isSeller =
    !!selectedConversation &&
    !!currentUserId &&
    !!selectedSellerId &&
    !!selectedBuyerId &&
    currentUserId === selectedSellerId &&
    currentUserId !== selectedBuyerId;

  useEffect(() => {
    if (!selectedConversation) return;

    console.log("MESSAGE ROLE CHECK:", {
      currentUserId,
      selectedBuyerId,
      selectedSellerId,
      isBuyer,
      isSeller,
      listingStatus,
      selectedConversation,
    });
  }, [
    currentUserId,
    selectedBuyerId,
    selectedSellerId,
    isBuyer,
    isSeller,
    listingStatus,
    selectedConversation,
  ]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConversationId || sending) return;

    const body = input.trim();

    try {
      setSending(true);

      const sent = await sendMessage(selectedConversationId, body);
      const newMessage =
        sent?.message || sent?.data?.message || sent?.data || sent;

      setMessages((prev) => [...prev, newMessage]);
      setInput("");
    } catch (err: any) {
      console.error("SEND MESSAGE ERROR:", err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;

    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    try {
      await deleteMessage(messageId);
      setMessages((prev) =>
        prev.filter(
          (message) => String(message.id || message.messageId) !== messageId
        )
      );
      toast.success("Message deleted");
    } catch (err: any) {
      console.error("DELETE MESSAGE ERROR:", err);
      toast.error(err.message || "Failed to delete message");
    }
  };

  const syncUpdatedConversation = (
    status: ListingStatus,
    updatedListing?: any
  ) => {
    setSelectedConversation((prev: any) => {
      if (!prev) return prev;
      return updateConversationStatus(prev, status, updatedListing);
    });

    setConversations((prev) =>
      prev.map((conversation) => {
        if (getConversationId(conversation) !== selectedConversationId) {
          return conversation;
        }

        return updateConversationStatus(conversation, status, updatedListing);
      })
    );
  };

  const handleMarkSold = async () => {
    if (!selectedConversationId || statusUpdating || !isSeller) {
      toast.error("Only the seller can mark this listing as sold.");
      return;
    }

    const confirmed = window.confirm(
      "Mark this listing as sale pending for this buyer?"
    );
    if (!confirmed) return;

    try {
      setStatusUpdating(true);

      const updatedListing = await markConversationSold(selectedConversationId);

      syncUpdatedConversation("sold_pending", updatedListing);
      toast.success("Listing marked as sale pending");
    } catch (err: any) {
      console.error("MARK SOLD ERROR:", err);
      toast.error(err.message || "Failed to mark as sold");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedConversationId || statusUpdating || !isBuyer) {
      toast.error("Only the buyer can mark this transaction as complete.");
      return;
    }

    const confirmed = window.confirm("Mark this transaction as complete?");
    if (!confirmed) return;

    try {
      setStatusUpdating(true);

      const updatedListing = await markConversationCompleted(
        selectedConversationId
      );

      syncUpdatedConversation("completed", updatedListing);
      toast.success("Transaction marked complete");
    } catch (err: any) {
      console.error("MARK COMPLETE ERROR:", err);
      toast.error(err.message || "Failed to mark complete");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMyMessage = (message: any) => {
    const senderId = String(
      message.senderId ||
        message.sender?.id ||
        message.sender?.userId ||
        message.userId ||
        ""
    );

    return currentUserId && senderId === currentUserId;
  };

  const renderStatusAction = () => {
    if (!selectedConversationId) return null;

    if (listingStatus === "available" && isSeller) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-xs"
          onClick={handleMarkSold}
          disabled={statusUpdating}
        >
          <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
          {statusUpdating ? "Updating..." : "Mark Sold"}
        </Button>
      );
    }

    if (listingStatus === "available" && isBuyer) {
      return (
        <Button
          variant="secondary"
          size="sm"
          className="whitespace-nowrap text-xs"
          disabled
        >
          <Clock className="w-4 h-4 mr-1" />
          Waiting for Seller
        </Button>
      );
    }

    if (listingStatus === "sold_pending" && isBuyer) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-xs"
          onClick={handleMarkComplete}
          disabled={statusUpdating}
        >
          <PackageCheck className="w-4 h-4 mr-1 text-muted-foreground" />
          {statusUpdating ? "Updating..." : "Mark Complete"}
        </Button>
      );
    }

    if (listingStatus === "sold_pending" && isSeller) {
      return (
        <Button
          variant="secondary"
          size="sm"
          className="whitespace-nowrap text-xs"
          disabled
        >
          <Clock className="w-4 h-4 mr-1" />
          Waiting for Buyer
        </Button>
      );
    }

    if (listingStatus === "completed") {
      return (
        <Button
          variant="secondary"
          size="sm"
          className="whitespace-nowrap text-xs bg-green-600 text-white hover:bg-green-700"
          disabled
        >
          <CheckCircle className="w-4 h-4 mr-1 text-white" />
          Complete
        </Button>
      );
    }

    return (
      <Button
        variant="secondary"
        size="sm"
        className="whitespace-nowrap text-xs"
        disabled
      >
        <Clock className="w-4 h-4 mr-1" />
        Waiting
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-4 min-h-[calc(100vh-140px)]">
          <aside className="border rounded-2xl bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Messages</h2>
            </div>

            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">
                Loading conversations...
              </p>
            ) : conversations.length === 0 && !selectedConversation ? (
              <p className="p-4 text-sm text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              <div className="divide-y">
                {selectedConversation && listingId && (
                  <button
                    type="button"
                    className="w-full text-left p-4 bg-muted"
                    onClick={() => setSelectedConversation(selectedConversation)}
                  >
                    <p className="font-semibold truncate">
                      {conversationTitle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {listingLabel}
                    </p>
                  </button>
                )}

                {conversations.map((conversation) => {
                  const conversationId = getConversationId(conversation);
                  const active = conversationId === selectedConversationId;
                  const status = getListingStatus(conversation);

                  return (
                    <button
                      type="button"
                      key={conversationId}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-4 hover:bg-muted ${
                        active ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {getOtherUserName(conversation, currentUserId)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getListingTitle(conversation)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusClass(
                            status
                          )}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="border rounded-2xl bg-background flex flex-col overflow-hidden">
            <div className="border-b p-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-foreground">
                  {conversationTitle}
                </h2>
                <p className="text-xs text-muted-foreground">{listingLabel}</p>
              </div>

              {selectedConversation && (
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                    listingStatus
                  )}`}
                >
                  {getStatusLabel(listingStatus)}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <p className="text-center text-muted-foreground">
                  Loading messages...
                </p>
              ) : !selectedConversation ? (
                <p className="text-center text-muted-foreground">
                  Select a conversation.
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No messages yet. Start the conversation.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = isMyMessage(message);
                  const messageId = String(
                    message.id || message.messageId || ""
                  );

                  return (
                    <div
                      key={messageId || message.createdAt}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="group flex items-center gap-2 max-w-[75%]">
                        {mine && messageId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(messageId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div
                          className={`px-4 py-2 rounded-2xl text-sm ${
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-secondary-foreground rounded-bl-md"
                          }`}
                        >
                          {message.body || message.text || ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t p-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message"
                  className="flex-1"
                  disabled={!selectedConversationId || sending}
                />

                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!selectedConversationId || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>

                {renderStatusAction()}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;