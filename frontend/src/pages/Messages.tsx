import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Trash2 } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/authApi";
import {
  getConversations,
  startConversation,
  markConversationCompleted,
} from "@/lib/conversationApi";
import {
  getMessages,
  sendMessage,
  deleteMessage,
} from "@/lib/messageApi";

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

const getOtherUserName = (conversation: any, currentUserId: string) => {
  const buyerId = String(conversation?.buyerId || conversation?.buyer?.id || "");
  const sellerId = String(
    conversation?.sellerId ||
      conversation?.seller?.id ||
      conversation?.listing?.sellerId ||
      conversation?.listing?.seller?.id ||
      ""
  );

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
  const [completed, setCompleted] = useState(false);

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

  const handleSend = async () => {
    if (!input.trim() || !selectedConversationId || sending) return;

    const body = input.trim();

    try {
      setSending(true);

      const sent = await sendMessage(selectedConversationId, body);
      const newMessage = sent?.message || sent?.data?.message || sent?.data || sent;

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
        prev.filter((message) => String(message.id || message.messageId) !== messageId)
      );
      toast.success("Message deleted");
    } catch (err: any) {
      console.error("DELETE MESSAGE ERROR:", err);
      toast.error(err.message || "Failed to delete message");
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedConversationId) return;

    try {
      await markConversationCompleted(selectedConversationId);
      setCompleted(true);
      toast.success("Conversation marked complete");
    } catch (err: any) {
      console.error("MARK COMPLETE ERROR:", err);
      toast.error(err.message || "Failed to mark complete");
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
                    <p className="font-semibold truncate">{conversationTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {listingLabel}
                    </p>
                  </button>
                )}

                {conversations.map((conversation) => {
                  const conversationId = getConversationId(conversation);
                  const active = conversationId === selectedConversationId;

                  return (
                    <button
                      type="button"
                      key={conversationId}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-4 hover:bg-muted ${
                        active ? "bg-muted" : ""
                      }`}
                    >
                      <p className="font-semibold truncate">
                        {getOtherUserName(conversation, currentUserId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getListingTitle(conversation)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="border rounded-2xl bg-background flex flex-col overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-bold text-foreground">{conversationTitle}</h2>
              <p className="text-xs text-muted-foreground">{listingLabel}</p>
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
                  const messageId = String(message.id || message.messageId || "");

                  return (
                    <div
                      key={messageId || message.createdAt}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
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

                <Button
                  variant={completed ? "secondary" : "outline"}
                  size="sm"
                  className={`whitespace-nowrap text-xs ${
                    completed ? "bg-green-600 text-white hover:bg-green-700" : ""
                  }`}
                  onClick={handleMarkComplete}
                  disabled={!selectedConversationId || completed}
                >
                  <CheckCircle
                    className={`w-4 h-4 mr-1 ${
                      completed ? "text-white" : "text-muted-foreground"
                    }`}
                  />
                  {completed ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;