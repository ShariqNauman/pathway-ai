
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getGeminiResponse } from "@/utils/geminiApi";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const ChatConsultant = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI university consultant. How can I help with your educational journey today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiInput, setShowApiInput] = useState(!localStorage.getItem("gemini_api_key"));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    if (!apiKey) {
      toast.error("Please set your Gemini API key first");
      setShowApiInput(true);
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Call Gemini API
      const response = await getGeminiResponse(inputValue, apiKey);
      
      if (response.error) {
        console.error("Gemini API Error:", response.error);
        toast.error(`Error: ${response.error}`);
        setIsLoading(false);
        return;
      }
      
      const newAiMessage: Message = {
        id: Date.now().toString(),
        content: response.text || "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", apiKey);
      toast.success("API key saved successfully");
      setShowApiInput(false);
    } else {
      toast.error("Please enter a valid API key");
    }
  };

  return (
    <section id="consultation" className="py-20 px-6 lg:px-10 bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            AI Consultation
          </motion.span>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Chat with Your AI Education Consultant
          </motion.h2>
          
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Ask questions about universities, programs, application processes, scholarships, or career paths.
            Our AI consultant is here to provide personalized guidance.
          </motion.p>
        </div>
        
        <motion.div 
          className="max-w-3xl mx-auto glass-card rounded-xl overflow-hidden shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Chat header */}
          <div className="bg-primary/95 text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent/30 backdrop-blur-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M16.5 7.5h-9v9h9v-9z" />
                  <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Pathway AI Assistant</h3>
                <p className="text-xs text-primary-foreground/80">Online</p>
              </div>
            </div>
            <button 
              onClick={() => setShowApiInput(!showApiInput)}
              className="text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 px-3 py-1 rounded-md transition-colors"
            >
              {showApiInput ? "Cancel" : "Set API Key"}
            </button>
          </div>
          
          {/* API Key input */}
          <AnimatePresence>
            {showApiInput && (
              <motion.div 
                className="p-4 bg-background border-b border-border"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col space-y-2">
                  <label htmlFor="apiKey" className="text-sm font-medium">Enter Gemini API Key</label>
                  <input
                    id="apiKey"
                    type="password"
                    className="p-2 border border-border rounded-md"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                  />
                  <button 
                    onClick={handleApiKeySave}
                    className="self-end bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
                  >
                    Save Key
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Chat messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className={`max-w-xs sm:max-w-md rounded-lg p-3 ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-secondary text-secondary-foreground rounded-tl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 text-right mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-secondary text-secondary-foreground rounded-lg rounded-tl-none p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse animation-delay-200"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse animation-delay-400"></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="border-t border-border p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ask about universities, programs, admissions..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground rounded-lg p-2 text-sm disabled:opacity-50"
                disabled={isLoading || !inputValue.trim() || !apiKey}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatConsultant;
