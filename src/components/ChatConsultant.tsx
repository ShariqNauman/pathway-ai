
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getChatResponse } from "@/utils/chatConsultantApi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import useUsageLimits from "@/hooks/useUsageLimits";

interface ChatConsultantProps {
  initialSidebarOpen?: boolean;
}

const ChatConsultant = ({ initialSidebarOpen = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [messages, setMessages] = useState([
    {
      id: "initial",
      text: "Hello! I'm Pathway AI, your personal college consultant. Ask me anything about college admissions, choosing a major, or anything else related to higher education!",
      sender: "ai",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const { currentUser } = useAuth();
  const { plan } = useSubscription();
  const { checkAndIncrement, used, limit, dailyUsed, dailyLimit } = useUsageLimits('consultant');
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Auto-focus on the textarea when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.error("Please sign in to use the AI Consultant");
      return;
    }
    
    if (!inputValue.trim()) return;
    
    // Check usage limits before sending message
    const canProceed = await checkAndIncrement();
    if (!canProceed) {
      return;
    }
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");
    setIsThinking(true);

    try {
      const aiResponse = await getChatResponse(inputValue);
      if (aiResponse) {
        const aiMessage = {
          id: Date.now().toString() + "-ai",
          text: aiResponse.text || "Sorry, I couldn't generate a response at this time.",
          sender: "ai",
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
        toast.error("Failed to get response from AI. Please try again.");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from AI. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI College Consultant</h2>
        {windowWidth > 768 && (
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left"
              >
                <path d="M12 19V5" />
                <path d="M5 12l-5 5 5 5" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-right"
              >
                <path d="M12 5v14" />
                <path d="M19 12l5 5-5 5" />
              </svg>
            )}
          </Button>
        )}
      </div>
      
      {/* Add usage display after existing header or before the messages list */}
      {currentUser && (
        <div className="px-4 py-2 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Consultant Usage:</span>{" "}
            {used}/{limit} monthly, {dailyUsed}/{dailyLimit} today
            {plan === "basic" && (
              <span className="ml-2 text-xs">
                <a href="/pricing" className="text-primary hover:underline">
                  Upgrade for more
                </a>
              </span>
            )}
          </p>
        </div>
      )}
      
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 flex flex-col ${message.sender === "user" ? "items-end" : "items-start"
              }`}
          >
            <div
              className={`rounded-lg px-3 py-2 max-w-xs break-words ${message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
                }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="mb-2 flex flex-col items-start">
            <div className="rounded-lg px-3 py-2 max-w-xs break-words bg-muted">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask me anything..."
          className="resize-none"
        />
        <Button onClick={handleSendMessage} className="mt-2 w-full">
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatConsultant;
