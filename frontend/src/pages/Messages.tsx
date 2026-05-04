import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  CheckCircle,
  Trash2,
  Clock,
  PackageCheck,
  Star,
  MessageSquare,
} from "lucide-react";
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
import { createReview } from "@/lib/reviewApi";

type ListingStatus = "available" | "sold_pending" | "completed";
type ConversationView = "buying" | "selling";

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

const getSellerName = (conversation: any) => {
  return (
    conversation?.seller?.name ||
    conversation?.listing?.seller?.name ||
    conversation?.sellerName ||
    "Seller"
  );
};

const getOtherUserName = (conversation: any, currentUserId: string) => {
  const buyerId = getConversationBuyerId(conversation);
  const sellerId = getConversationSellerId(conversation);

  if (currentUserId && currentUserId === buyerId) {
    return getSellerName(conversation);
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

const getLastMessage = (conversation: any) => {
  return (
    conversation?.lastMessage ||
    conversation?.latestMessage ||
    conversation?.conversation?.lastMessage ||
    conversation?.conversation?.latestMessage ||
    null
  );
};

const getLastMessageSenderId = (conversation: any) => {
  const lastMessage = getLastMessage(conversation);

  return String(
    lastMessage?.senderId ||
      lastMessage?.sender?.id ||
      lastMessage?.sender?.userId ||
      lastMessage?.userId ||
      ""
  );
};

const getConversationLastActivityTime = (conversation: any) => {
  const rawTime =
    conversation?.lastMessage?.createdAt ||
    conversation?.lastMessage?.updatedAt ||
    conversation?.latestMessage?.createdAt ||
    conversation?.latestMessage?.updatedAt ||
    conversation?.lastMessageAt ||
    conversation?.latestMessageAt ||
    conversation?.messageCreatedAt ||
    conversation?.updatedAt ||
    conversation?.createdAt ||
    conversation?.conversation?.lastMessage?.createdAt ||
    conversation?.conversation?.latestMessage?.createdAt ||
    conversation?.conversation?.lastMessageAt ||
    conversation?.conversation?.latestMessageAt ||
    conversation?.conversation?.updatedAt ||
    conversation?.conversation?.createdAt ||
    "";

  const time = new Date(rawTime).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const sortConversationsByLastActivity = (list: any[]) => {
  return [...list].sort(
    (a, b) =>
      getConversationLastActivityTime(b) - getConversationLastActivityTime(a)
  );
};

const hasUnreadMessage = (
  conversation: any,
  currentUserId: string,
  selectedConversationId: string
) => {
  const conversationId = getConversationId(conversation);

  if (conversationId === selectedConversationId) return false;

  const senderId = getLastMessageSenderId(conversation);

  return !!senderId && !!currentUserId && senderId !== currentUserId;
};

const normalizeConversations = (data: any) => {
  const conversations = Array.isArray(data)
    ? data
    : Array.isArray(data.conversations)
    ? data.conversations
    : Array.isArray(data.data)
    ? data.data
    : [];

  return sortConversationsByLastActivity(conversations);
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

const getReviewedSellerKey = (buyerId: string, sellerId: string) => {
  return `reviewedSeller:${buyerId}:${sellerId}`;
};

const getSalePendingNoticeKey = (buyerId: string, conversationId: string) => {
  return `salePendingNotice:${buyerId}:${conversationId}`;
};

const Messages = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const listingId = params.get("listingId");

  const [conversationView, setConversationView] =
    useState<ConversationView>("buying");

  const [currentUserId, setCurrentUserId] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [showSalePendingNotice, setShowSalePendingNotice] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSellerId, setReviewSellerId] = useState("");
  const [reviewSellerName, setReviewSellerName] = useState("Seller");
  const [reviewConversationId, setReviewConversationId] = useState("");

  const [reviewedSellerKeys, setReviewedSellerKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("reviewedSellerKeys") || "[]");
    } catch {
      return [];
    }
  });

  const selectedConversationId = selectedConversation
    ? getConversationId(selectedConversation)
    : "";

  const buyingConversations = useMemo(() => {
    if (!currentUserId) return [];

    return conversations.filter((conversation) => {
      return getConversationBuyerId(conversation) === currentUserId;
    });
  }, [conversations, currentUserId]);

  const sellingConversations = useMemo(() => {
    if (!currentUserId) return [];

    return conversations.filter((conversation) => {
      return getConversationSellerId(conversation) === currentUserId;
    });
  }, [conversations, currentUserId]);

  const visibleConversations = useMemo(() => {
    const list =
      conversationView === "buying" ? buyingConversations : sellingConversations;

    return sortConversationsByLastActivity(list);
  }, [conversationView, buyingConversations, sellingConversations]);

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

          setConversationView("buying");
          setSelectedConversation(conversation);

          const allConversations = await getConversations().catch(() => []);
          setConversations(normalizeConversations(allConversations));
        } else {
          const allConversations = await getConversations();
          const normalized = normalizeConversations(allConversations);

          setConversations(normalized);

          const firstBuyingConversation = normalized.find(
            (conversation: any) => getConversationBuyerId(conversation) === userId
          );

          const firstSellingConversation = normalized.find(
            (conversation: any) =>
              getConversationSellerId(conversation) === userId
          );

          if (firstBuyingConversation) {
            setConversationView("buying");
            setSelectedConversation(firstBuyingConversation);
          } else if (firstSellingConversation) {
            setConversationView("selling");
            setSelectedConversation(firstSellingConversation);
          } else if (normalized.length > 0) {
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
    if (!currentUserId || loading) return;

    const selectedId = selectedConversation
      ? getConversationId(selectedConversation)
      : "";

    const stillVisible = visibleConversations.some(
      (conversation) => getConversationId(conversation) === selectedId
    );

    if (!stillVisible) {
      setSelectedConversation(visibleConversations[0] || null);
    }
  }, [
    conversationView,
    currentUserId,
    loading,
    visibleConversations,
    selectedConversation,
  ]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadMessages(showLoading = false) {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        if (showLoading) {
          setMessagesLoading(true);
        }

        const data = await getMessages(selectedConversationId);
        const normalizedMessages = normalizeMessages(data);

        setMessages(normalizedMessages);

        const lastMessage = normalizedMessages[normalizedMessages.length - 1];

        if (lastMessage) {
          const lastMessageTime =
            lastMessage?.createdAt ||
            lastMessage?.updatedAt ||
            lastMessage?.created_at ||
            "";

          setConversations((prev) =>
            sortConversationsByLastActivity(
              prev.map((conversation) => {
                if (getConversationId(conversation) !== selectedConversationId) {
                  return conversation;
                }

                return {
                  ...conversation,
                  lastMessage,
                  lastMessageAt:
                    lastMessageTime ||
                    conversation?.lastMessageAt ||
                    conversation?.updatedAt,
                  updatedAt:
                    lastMessageTime ||
                    conversation?.updatedAt ||
                    conversation?.createdAt,
                };
              })
            )
          );

          setSelectedConversation((prev: any) => {
            if (!prev) return prev;

            return {
              ...prev,
              lastMessage,
              lastMessageAt:
                lastMessageTime || prev?.lastMessageAt || prev?.updatedAt,
              updatedAt: lastMessageTime || prev?.updatedAt || prev?.createdAt,
            };
          });
        }
      } catch (err: any) {
        console.error("LOAD MESSAGES ERROR:", err);

        if (showLoading) {
          toast.error(err.message || "Failed to load conversation messages");
        }
      } finally {
        if (showLoading) {
          setMessagesLoading(false);
        }
      }
    }

    loadMessages(true);

    intervalId = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
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
    if (!selectedConversation || !currentUserId || !selectedConversationId) {
      return;
    }

    const status = getListingStatus(selectedConversation);
    const buyerId = getConversationBuyerId(selectedConversation);

    if (status !== "sold_pending") return;
    if (buyerId !== currentUserId) return;

    const noticeKey = getSalePendingNoticeKey(
      currentUserId,
      selectedConversationId
    );

    const alreadyShown = localStorage.getItem(noticeKey);

    if (!alreadyShown) {
      setShowSalePendingNotice(true);
      localStorage.setItem(noticeKey, "true");
    }
  }, [selectedConversation, currentUserId, selectedConversationId]);

  const reviewThreads = useMemo(() => {
    if (!currentUserId || conversationView !== "buying") return [];

    return conversations.filter((conversation) => {
      const status = getListingStatus(conversation);
      const buyerId = getConversationBuyerId(conversation);
      const sellerId = getConversationSellerId(conversation);
      const key = getReviewedSellerKey(currentUserId, sellerId);

      return (
        status === "completed" &&
        buyerId === currentUserId &&
        sellerId &&
        !reviewedSellerKeys.includes(key)
      );
    });
  }, [conversations, currentUserId, reviewedSellerKeys, conversationView]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConversationId || sending) return;

    const body = input.trim();

    try {
      setSending(true);

      const sent = await sendMessage(selectedConversationId, body);
      const newMessage =
        sent?.message || sent?.data?.message || sent?.data || sent;

      const now = new Date().toISOString();
      const newMessageTime =
        newMessage?.createdAt || newMessage?.updatedAt || now;

      setMessages((prev) => [...prev, newMessage]);

      setConversations((prev) =>
        sortConversationsByLastActivity(
          prev.map((conversation) => {
            if (getConversationId(conversation) !== selectedConversationId) {
              return conversation;
            }

            return {
              ...conversation,
              lastMessage: newMessage,
              lastMessageAt: newMessageTime,
              updatedAt: newMessageTime,
            };
          })
        )
      );

      setSelectedConversation((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          lastMessage: newMessage,
          lastMessageAt: newMessageTime,
          updatedAt: newMessageTime,
        };
      });

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
      sortConversationsByLastActivity(
        prev.map((conversation) => {
          if (getConversationId(conversation) !== selectedConversationId) {
            return conversation;
          }

          return updateConversationStatus(conversation, status, updatedListing);
        })
      )
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

  const openReviewModal = (conversation: any) => {
    if (!conversation) return;

    const buyerId = getConversationBuyerId(conversation);
    const sellerId = getConversationSellerId(conversation);

    if (buyerId !== currentUserId) {
      toast.error("Only the buyer can review the seller.");
      return;
    }

    setReviewSellerId(sellerId);
    setReviewSellerName(getSellerName(conversation));
    setReviewConversationId(getConversationId(conversation));
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
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
      toast.success(
        "Transaction marked complete. A review request has been added to your messages."
      );
    } catch (err: any) {
      console.error("MARK COMPLETE ERROR:", err);
      toast.error(err.message || "Failed to mark complete");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewSellerId) {
      toast.error("Seller information not found");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write a short review before submitting");
      return;
    }

    try {
      setReviewSubmitting(true);

      await createReview(reviewSellerId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      const key = getReviewedSellerKey(currentUserId, reviewSellerId);
      const updatedKeys = Array.from(new Set([...reviewedSellerKeys, key]));

      setReviewedSellerKeys(updatedKeys);
      localStorage.setItem("reviewedSellerKeys", JSON.stringify(updatedKeys));

      toast.success("Review submitted successfully");
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment("");
      setReviewSellerId("");
      setReviewSellerName("Seller");
      setReviewConversationId("");
    } catch (err: any) {
      console.error("SUBMIT REVIEW ERROR:", err);
      toast.error(err.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    if (reviewSellerId) {
      const key = getReviewedSellerKey(currentUserId, reviewSellerId);
      const updatedKeys = Array.from(new Set([...reviewedSellerKeys, key]));

      setReviewedSellerKeys(updatedKeys);
      localStorage.setItem("reviewedSellerKeys", JSON.stringify(updatedKeys));
    }

    setShowReviewModal(false);
    setReviewRating(5);
    setReviewComment("");
    setReviewSellerId("");
    setReviewSellerName("Seller");
    setReviewConversationId("");
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

    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-4 min-h-[calc(100vh-140px)]">
          <aside className="border rounded-2xl bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg mb-3">Messages</h2>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setConversationView("buying")}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    conversationView === "buying"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buying
                </button>

                <button
                  type="button"
                  onClick={() => setConversationView("selling")}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    conversationView === "selling"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Selling
                </button>
              </div>
            </div>

            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">
                Loading conversations...
              </p>
            ) : visibleConversations.length === 0 &&
              reviewThreads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No {conversationView === "buying" ? "buying" : "selling"}{" "}
                conversations yet.
              </p>
            ) : (
              <div className="divide-y">
                {reviewThreads.map((conversation) => {
                  const conversationId = getConversationId(conversation);
                  const sellerName = getSellerName(conversation);
                  const listingTitle = getListingTitle(conversation);
                  const active = reviewConversationId === conversationId;

                  return (
                    <button
                      type="button"
                      key={`review-${conversationId}`}
                      onClick={() => openReviewModal(conversation)}
                      className={`w-full text-left p-4 hover:bg-muted ${
                        active ? "bg-muted" : "bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            Review Seller
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Rate {sellerName} for {listingTitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {visibleConversations.map((conversation) => {
                  const conversationId = getConversationId(conversation);
                  const active = conversationId === selectedConversationId;
                  const status = getListingStatus(conversation);
                  const unread = hasUnreadMessage(
                    conversation,
                    currentUserId,
                    selectedConversationId
                  );

                  return (
                    <button
                      type="button"
                      key={conversationId}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                        active ? "bg-gray-200 border-l-4 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`truncate ${
                                unread ? "font-bold" : "font-semibold"
                              }`}
                            >
                              {getOtherUserName(conversation, currentUserId)}
                            </p>

                            {unread && (
                              <span
                                className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0"
                                title="Unread message"
                              />
                            )}
                          </div>

                          <p
                            className={`text-xs truncate ${
                              unread
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
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

      {showSalePendingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-xl p-6">
            <h3 className="text-xl font-bold mb-3">Congratulations!</h3>

            <p className="text-sm text-muted-foreground leading-6 mb-6">
              The seller has marked this item as sale pending for you. Once you
              receive the item, please return to this chat and mark the
              transaction as complete.
            </p>

            <Button
              type="button"
              className="w-full"
              onClick={() => setShowSalePendingNotice(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-xl p-6">
            <h3 className="text-xl font-bold mb-2">Review Seller</h3>

            <p className="text-sm text-muted-foreground leading-6 mb-5">
              Please rate your experience with{" "}
              <span className="font-semibold text-foreground">
                {reviewSellerName}
              </span>
              . Your review will appear on this seller&apos;s listings.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Rating</label>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className="p-1"
                    aria-label={`${value} star rating`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        value <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review</label>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Write a short review about the seller."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSkipReview}
                disabled={reviewSubmitting}
              >
                Skip
              </Button>

              <Button
                type="button"
                className="w-full"
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;