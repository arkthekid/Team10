import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
}

const initialMessages: Message[] = [
  { id: 1, text: "Hi, is the backpack still available?", sender: "me" },
  { id: 2, text: "Yes it is! Are you on campus?", sender: "other" },
  { id: 3, text: "Great! I can meet at the Student Union.", sender: "me" },
];

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input.trim(), sender: "me" },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Chat header */}
        <div className="border-b p-4">
          <h2 className="font-bold text-foreground">Riley P.</h2>
          <p className="text-xs text-muted-foreground">North Face Backpack · $50</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message"
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant={completed ? "secondary" : "outline"}
              size="sm"
              className={`whitespace-nowrap text-xs ${completed ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
              onClick={() => setCompleted(!completed)}
            >
              <CheckCircle className={`w-4 h-4 mr-1 ${completed ? "text-white" : "text-muted-foreground"}`} />
              {completed ? "Completed" : "Mark Complete"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
