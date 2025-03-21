import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getGeminiResponse } from "@/utils/geminiApi";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [hasShownPreferencesReminder, setHasShownPreferencesReminder] = useState(false);
  
  const { currentUser } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  // This will handle manual scrolling when needed
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check user preferences on initial load
  useEffect(() => {
    if (currentUser && !hasShownPreferencesReminder) {
      const hasCompletePreferences = 
        currentUser.preferences.intendedMajor && 
        currentUser.preferences.preferredCountry && 
        currentUser.preferences.studyLevel;
      
      if (!hasCompletePreferences) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            content: "I noticed you haven't completed your profile preferences yet. This would help me provide more personalized university recommendations. Please visit your profile page to set your preferences.",
            sender: "ai",
            timestamp: new Date()
          }]);
          setHasShownPreferencesReminder(true);
        }, 1000);
      }
    }
  }, [currentUser, hasShownPreferencesReminder]);

  // Load user conversation history or create new conversation
  useEffect(() => {
    if (currentUser) {
      createOrLoadConversation();
    }
  }, [currentUser]);

  // Prevent auto-scrolling to chat section on initial page load
  useEffect(() => {
    // Disable scrolling on first render
    if (initialLoadRef.current) {
      // This is critical to prevent auto-scrolling to the consultant section on page load
      window.history.scrollRestoration = 'manual';
      
      // Restore normal scrolling behavior after component is mounted
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 1000);
    }
    
    // Clean up
    return () => {
      window.history.scrollRestoration = 'auto';
    };
  }, []);

  // Only scroll if the user sent the message or if it's the user's first message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === "user") {
        scrollToBottom();
      }
    }
  }, [messages]);

  // Auto resize textarea based on content
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  const createOrLoadConversation = async () => {
    if (!currentUser) return;
    
    try {
      // Get the most recent conversation
      const { data: conversations, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (conversations && conversations.length > 0) {
        // Load the most recent conversation
        const conversationId = conversations[0].id;
        setCurrentConversationId(conversationId);
        
        // Load messages for this conversation
        const { data: messageData, error: messageError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (messageError) throw messageError;
        
        if (messageData && messageData.length > 0) {
          // Transform database messages to our format
          const loadedMessages = messageData.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender as "user" | "ai",
            timestamp: new Date(msg.created_at)
          }));
          
          setMessages(loadedMessages);
        }
      } else {
        // Create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('chat_conversations')
          .insert([{ 
            user_id: currentUser.id,
            title: 'New Chat'
          }])
          .select();
        
        if (createError) throw createError;
        
        if (newConversation && newConversation.length > 0) {
          setCurrentConversationId(newConversation[0].id);
          
          // Save the welcome message
          const welcomeMessage = messages[0];
          await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: newConversation[0].id,
              content: welcomeMessage.content,
              sender: welcomeMessage.sender
            }]);
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!currentUser || !currentConversationId) return;
    
    try {
      await supabase
        .from('chat_messages')
        .insert([{
          id: message.id,
          conversation_id: currentConversationId,
          content: message.content,
          sender: message.sender
        }]);
      
      // Update conversation's updated_at timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversationId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Save user message if logged in
    if (currentUser) {
      saveMessage(userMessage);
    }
    
    try {
      // Get user preferences to add context to the AI
      let additionalContext = "";
      if (currentUser && currentUser.preferences) {
        const { intendedMajor, budget, preferredCountry, studyLevel } = currentUser.preferences;
        if (intendedMajor || budget || preferredCountry || studyLevel) {
          additionalContext = `\n\nUser profile information: ` +
            `${intendedMajor ? `Intended major: ${intendedMajor}. ` : ''}` +
            `${budget ? `Budget: $${budget}. ` : ''}` +
            `${preferredCountry ? `Preferred country: ${preferredCountry}. ` : ''}` +
            `${studyLevel ? `Study level: ${studyLevel}. ` : ''}` +
            `\nPlease use this information to personalize your responses when appropriate.`;
        }
      }
      
      // Call Gemini API with user context if available
      const promptWithContext = inputValue + additionalContext;
      const response = await getGeminiResponse(promptWithContext);
      
      if (response.error) {
        console.error("Gemini API Error:", response.error);
        toast.error(`Error: ${response.error}`);
        setIsLoading(false);
        return;
      }
      
      const newAiMessage: Message = {
        id: uuidv4(),
        content: response.text || "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newAiMessage]);
      
      // Save AI message if logged in
      if (currentUser) {
        saveMessage(newAiMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const clearChat = async () => {
    if (currentUser && currentConversationId) {
      try {
        // Delete all messages for the current conversation
        await supabase
          .from('chat_messages')
          .delete()
          .eq('conversation_id', currentConversationId);
        
        // Create a new conversation
        const { data: newConversation, error } = await supabase
          .from('chat_conversations')
          .insert([{ 
            user_id: currentUser.id,
            title: 'New Chat'
          }])
          .select();
        
        if (error) throw error;
        
        if (newConversation && newConversation.length > 0) {
          setCurrentConversationId(newConversation[0].id);
          
          const welcomeMessage = {
            id: uuidv4(),
            content: "Hello! I'm your AI university consultant. How can I help with your educational journey today?",
            sender: "ai" as const,
            timestamp: new Date(),
          };
          
          setMessages([welcomeMessage]);
          
          // Save the welcome message
          await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: newConversation[0].id,
              content: welcomeMessage.content,
              sender: welcomeMessage.sender
            }]);
        }
      } catch (error) {
        console.error("Error resetting chat:", error);
        toast.error("Failed to reset chat. Please try again.");
      }
    } else {
      // For non-logged-in users, just reset the chat state
      setMessages([
        {
          id: uuidv4(),
          content: "Hello! I'm your AI university consultant. How can I help with your educational journey today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
    
    toast.success("Chat has been reset");
  };

  return (
    <section id="consultation" className="py-20 px-6 lg:px-10 bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-5xl mx-auto">
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
            Pathway AI Education Consultant
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
          className="bg-card rounded-xl overflow-hidden shadow-xl border border-border flex flex-col h-[600px]"
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
                <h3 className="font-semibold">Pathway AI</h3>
                <p className="text-xs text-primary-foreground/80">University & Education Consultant</p>
              </div>
            </div>
            <button 
              onClick={clearChat}
              className="text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 px-3 py-2 rounded-md transition-colors flex items-center gap-2"
            >
              <RotateCcw size={14} />
              New Chat
            </button>
          </div>
          
          {/* Chat messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-secondary/30"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div 
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground ml-12" 
                      : "bg-card border border-border mr-12"
                  }`}
                >
                  {message.sender === "ai" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-card border border-border rounded-lg p-4 mr-12">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse animation-delay-200"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-card">
            <div className="flex items-end space-x-2 relative">
              <Textarea
                ref={textareaRef}
                className="flex-1 resize-none rounded-lg border border-input bg-background p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
                placeholder="Ask about universities, programs, admissions..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-3 bottom-3 text-primary hover:text-primary/80 disabled:text-muted-foreground"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-2">
              Press Enter to send, Shift+Enter for a new line
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatConsultant;
