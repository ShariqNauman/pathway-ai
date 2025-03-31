import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getGeminiResponse } from "@/utils/geminiApi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  RotateCcw, 
  Plus,
  MessageSquare,
  PanelLeft,
  ChevronLeft
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types/user";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

interface SavedChat {
  id: string;
  title: string;
  lastMessageDate: Date;
}

interface ChatConsultantProps {
  initialSidebarOpen?: boolean;
}

const DEFAULT_CHAT_TITLE = "New Chat";
const MIN_USER_MESSAGES_FOR_TITLE = 5;

// Add abbreviations map
const ABBREVIATIONS = {
  // Degrees and Levels
  "computer science": "CS",
  "information technology": "IT",
  "artificial intelligence": "AI",
  "data science": "DS",
  "business administration": "BBA",
  "software engineering": "SE",
  "electrical engineering": "EE",
  "mechanical engineering": "ME",
  "civil engineering": "CE",
  "undergraduate": "UG",
  "graduate": "Grad",
  "bachelor": "BS",
  "master": "MS",
  "masters": "MS",
  "doctorate": "PhD",
  "engineering": "Eng",
  "mathematics": "Math",
  "technology": "Tech",
  "management": "Mgmt",
  "science": "Sci",

  // Locations
  "united states": "USA",
  "united kingdom": "UK",
  "european union": "EU",
  "australia": "AUS",
  "canada": "CAN",
  "international": "Intl",

  // Common Terms
  "university": "Uni",
  "requirements": "Reqs",
  "application": "App",
  "recommendation": "Rec",
  "statement": "Stmt",
  "scholarship": "Scholar",
  "admission": "Adm",
  "research": "Research",
  "program": "Prog",
  "career": "Career",
  "finance": "Finance",
  "cost": "Cost"
};

const analyzeConversationTitle = (messages: Message[]): string => {
  // Count user messages only
  const userMessages = messages.filter(msg => msg.sender === "user");
  if (userMessages.length < MIN_USER_MESSAGES_FOR_TITLE) {
    return DEFAULT_CHAT_TITLE;
  }

  // Get all messages to analyze the context
  const combinedText = messages
    .map(msg => msg.content)
    .join(" ")
    .toLowerCase();

  // Common phrases and patterns for titles
  const titlePatterns = [
    // Study Programs
    {
      match: (text: string) => {
        const programs = ["computer science", "engineering", "business", "data science", "ai"];
        const levels = ["undergraduate", "masters", "phd", "graduate"];
        
        for (const program of programs) {
          for (const level of levels) {
            if (text.includes(program) && text.includes(level)) {
              // Use abbreviations for shorter titles
              const levelAbbr = ABBREVIATIONS[level] || level;
              const programAbbr = ABBREVIATIONS[program] || program;
              return `${levelAbbr} in ${programAbbr}`;
            }
          }
          if (text.includes(program)) {
            const programAbbr = ABBREVIATIONS[program] || program;
            return `About ${programAbbr}`;
          }
        }
        return null;
      }
    },
    // Application Process
    {
      match: (text: string) => {
        const topics = ["application", "apply", "admission", "requirements"];
        const schools = ["university", "college", "school", "program"];
        
        for (const topic of topics) {
          for (const school of schools) {
            if (text.includes(topic) && text.includes(school)) {
              return "Application Help";
            }
          }
        }
        return null;
      }
    },
    // Career and Future Planning
    {
      match: (text: string) => {
        if (text.includes("career") || text.includes("job") || text.includes("work")) {
          return "Career Planning";
        }
        if (text.includes("future") || text.includes("plan")) {
          return "Study Planning";
        }
        return null;
      }
    },
    // Financial Topics
    {
      match: (text: string) => {
        if (text.includes("scholarship") || text.includes("financial aid")) {
          return "Scholarships";
        }
        if (text.includes("cost") || text.includes("tuition") || text.includes("expense")) {
          return "Tuition & Costs";
        }
        return null;
      }
    },
    // Location Based
    {
      match: (text: string) => {
        const locations = ["usa", "uk", "canada", "australia", "europe"];
        for (const location of locations) {
          if (text.includes(location)) {
            return `Study in ${location.toUpperCase()}`;
          }
        }
        if (text.includes("abroad") || text.includes("international")) {
          return "Study Abroad";
        }
        return null;
      }
    },
    // Documents and Tests
    {
      match: (text: string) => {
        if (text.includes("personal statement") || text.includes("essay")) {
          return "Personal Statement";
        }
        if (text.includes("recommendation") || text.includes("letter")) {
          return "Recommendation";
        }
        if (text.includes("gre") || text.includes("gmat") || text.includes("test")) {
          return "Test Prep";
        }
        return null;
      }
    }
  ];

  // Try each pattern in order
  for (const pattern of titlePatterns) {
    const title = pattern.match(combinedText);
    if (title) {
      return title;
    }
  }

  // If no patterns match, create a shorter title from the first user message
  const firstMessage = userMessages[0].content.toLowerCase();
  const words = firstMessage.split(" ").slice(0, 3);
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
};

const ChatConsultant = ({ initialSidebarOpen = true }: ChatConsultantProps) => {
  const { currentUser } = useUser();
  
  const getWelcomeMessage = (user: UserProfile | null) => {
    if (user?.name) {
      return `Hello ${user.name}! I'm your AI university consultant. How can I help with your educational journey today?`;
    }
    return "Hello! I'm your AI university consultant. How can I help with your educational journey today?";
  };

  // Generate a UUID for the welcome message that will remain constant
  const welcomeMessageId = useMemo(() => uuidv4(), []);

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: welcomeMessageId,
      content: getWelcomeMessage(currentUser),
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Only initialize these states if user is logged in
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [hasShownPreferencesReminder, setHasShownPreferencesReminder] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [isChatSavingInProgress, setIsChatSavingInProgress] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(currentUser ? initialSidebarOpen : false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSidebarOpen(initialSidebarOpen);
    } else {
      setSidebarOpen(false);
    }
  }, [initialSidebarOpen, currentUser]);

  const scrollChatToBottom = () => {
    if (messagesEndRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

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

  useEffect(() => {
    if (currentUser) {
      fetchSavedChats();
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialLoadRef.current) {
      window.history.scrollRestoration = 'manual';
      
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollChatToBottom();
    }
  }, [messages]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  const createNewConversation = async (userMessage: Message, aiMessage?: Message) => {
    if (!currentUser || !hasUserSentMessage || isChatSavingInProgress) return null;
    
    try {
      setIsChatSavingInProgress(true);
      
      // Always start with default title
      const { data: newConversation, error: createError } = await supabase
        .from('chat_conversations')
        .insert([{ 
          user_id: currentUser.id,
          title: DEFAULT_CHAT_TITLE
        }])
        .select();
      
      if (createError) throw createError;
      
      if (newConversation && newConversation.length > 0) {
        const newConvId = newConversation[0].id;
        setCurrentConversationId(newConvId);
        
        // Get the welcome message with the correct personalization
        const welcomeMessage = {
          id: welcomeMessageId,
          content: getWelcomeMessage(currentUser),
          sender: "ai" as const,
          timestamp: new Date(Date.now() - 2000), // 2 seconds before user message
          created_at: new Date(Date.now() - 2000).toISOString()
        };
        
        // Prepare all messages to save
        const messagesToSave = [
          {
            conversation_id: newConvId,
            content: welcomeMessage.content,
            sender: welcomeMessage.sender,
            id: welcomeMessage.id,
            created_at: welcomeMessage.created_at
          },
          {
            conversation_id: newConvId,
            content: userMessage.content,
            sender: userMessage.sender,
            id: userMessage.id,
            created_at: userMessage.timestamp.toISOString()
          }
        ];

        // Add AI response if provided
        if (aiMessage) {
          messagesToSave.push({
            conversation_id: newConvId,
            content: aiMessage.content,
            sender: aiMessage.sender,
            id: aiMessage.id,
            created_at: aiMessage.timestamp.toISOString()
          });
        }

        // Save all messages in one batch
        await supabase
          .from('chat_messages')
          .insert(messagesToSave);
          
        await fetchSavedChats();
        return newConvId;
      }
      return null;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    } finally {
      setIsChatSavingInProgress(false);
    }
  };

  // Add function to update conversation title
  const updateConversationTitle = async (conversationId: string, messages: Message[]) => {
    if (!currentUser) return;
    
    try {
      // Count user messages only
      const userMessageCount = messages.filter(msg => msg.sender === "user").length;
      
      // Only update title once when we reach the minimum user messages
      if (userMessageCount === MIN_USER_MESSAGES_FOR_TITLE) {
        const newTitle = analyzeConversationTitle(messages);
        
        // Update the title in the database
        const { error } = await supabase
          .from('chat_conversations')
          .update({ title: newTitle })
          .eq('id', conversationId);
          
        if (error) throw error;
        
        // Refresh the saved chats to show the new title
        await fetchSavedChats();
      }
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const fetchSavedChats = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const chats = data.map(chat => ({
          id: chat.id,
          title: chat.title,
          lastMessageDate: new Date(chat.updated_at)
        }));
        
        setSavedChats(chats);
      }
    } catch (error) {
      console.error("Error fetching saved chats:", error);
    }
  };

  const saveMessage = async (message: Message, isNewChat = false) => {
    if (!currentUser) return;
    
    try {
      if (!currentConversationId && message.sender === "user" && !isNewChat) {
        await createNewConversation(message);
        return;
      }
      
      if (currentConversationId) {
        await supabase
          .from('chat_messages')
          .insert([{
            id: message.id,
            conversation_id: currentConversationId,
            content: message.content,
            sender: message.sender,
            created_at: message.timestamp.toISOString()
          }]);
        
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const now = new Date();
    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: now,
    };

    const aiMessageId = uuidv4();
    const aiMessage: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(now.getTime() + 100),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasUserSentMessage(true);
    setStreamingMessageId(aiMessageId);

    try {
      let systemInstructions = "";
      if (currentUser) {
        // Make the AI behave more like a human university consultant with concise responses
        systemInstructions = `You are a friendly and experienced university consultant having a natural conversation.
          Keep your responses concise, clear, and to the point - typically 1-2 short paragraphs maximum.
          Ask one focused question at a time instead of multiple questions.
          When asking questions, keep them brief and specific.
          Avoid long explanations unless specifically requested by the user.
          Make it easy for users to respond by being direct and clear.
          Address ${currentUser.name || 'them'} in a natural way.`;

        // Silently pass user preferences to inform responses without explicitly mentioning them
        if (currentUser.preferences) {
          const { intendedMajor, budget, preferredCountry, studyLevel } = currentUser.preferences;
          if (intendedMajor || budget || preferredCountry || studyLevel) {
            systemInstructions += `\nContext (use naturally without explicitly mentioning): ` +
              `${intendedMajor ? `They're interested in ${intendedMajor}. ` : ''}` +
              `${budget ? `Their budget is around $${budget}. ` : ''}` +
              `${preferredCountry ? `They're considering ${preferredCountry}. ` : ''}` +
              `${studyLevel ? `Looking for ${studyLevel} programs. ` : ''}`;
          }
        }
      }

      const previousMessages = messages
        .filter(msg => msg.id !== welcomeMessageId)
        .map(msg => ({
          content: msg.content,
          role: msg.sender === "user" ? "user" : "model" as "user" | "model"
        }));

      const response = await getGeminiResponse(
        userMessage.content, 
        systemInstructions, 
        previousMessages,
        {
          onTextUpdate: (text) => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: text }
                  : msg
              )
            );
          }
        }
      );
      
      if (response.error) {
        console.error("Gemini API Error:", response.error);
        toast.error(response.error);
        setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
        return;
      }

      // Update the final message
      const finalAiMessage = {
        ...aiMessage,
        content: response.text,
        isStreaming: false
      };

      // Update messages with the final AI response
      const finalMessages = [...messages, userMessage, finalAiMessage];
      setMessages(finalMessages);

      // Save messages if user is logged in
      if (currentUser) {
        if (!currentConversationId) {
          // For new conversations, create it with all messages at once
          const { data: newConversation, error: createError } = await supabase
            .from('chat_conversations')
            .insert([{ 
              user_id: currentUser.id,
              title: DEFAULT_CHAT_TITLE // Always start with default title
            }])
            .select();
          
          if (createError) throw createError;
          
          if (newConversation && newConversation.length > 0) {
            const newConvId = newConversation[0].id;
            setCurrentConversationId(newConvId);
            
            // Save all messages in the correct order
            const messagesToSave = [
              {
                conversation_id: newConvId,
                content: messages[0].content,
                sender: messages[0].sender,
                id: messages[0].id,
                created_at: messages[0].timestamp.toISOString()
              },
              {
                conversation_id: newConvId,
                content: userMessage.content,
                sender: userMessage.sender,
                id: userMessage.id,
                created_at: userMessage.timestamp.toISOString()
              },
              {
                conversation_id: newConvId,
                content: finalAiMessage.content,
                sender: finalAiMessage.sender,
                id: finalAiMessage.id,
                created_at: finalAiMessage.timestamp.toISOString()
              }
            ];

            // Insert all messages in one batch
            const { error: insertError } = await supabase
              .from('chat_messages')
              .insert(messagesToSave);

            if (insertError) {
              console.error("Error saving messages:", insertError);
              throw insertError;
            }
            
            // Only update title if we have enough messages
            if (finalMessages.length >= MIN_USER_MESSAGES_FOR_TITLE) {
              await updateConversationTitle(newConvId, finalMessages);
            }
            
            // Only fetch the list of chats, don't reload messages
            await fetchSavedChats();
          }
        } else {
          // For existing conversations, save both messages
          await Promise.all([
            saveMessage(userMessage),
            saveMessage(finalAiMessage)
          ]);
          
          // Only update title if we have enough messages
          if (finalMessages.length >= MIN_USER_MESSAGES_FOR_TITLE) {
            await updateConversationTitle(currentConversationId, finalMessages);
          }
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!currentUser) return;
    
    try {
      setCurrentConversationId(conversationId);
      
      // Get all messages and order by created_at to ensure correct sequence
      const { data: messagesData, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (msgError) throw msgError;
      
      if (messagesData) {
        // Convert all messages from the database
        const loadedMessages = messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as "user" | "ai",
          timestamp: new Date(msg.created_at)
        }));

        // Only set the loaded messages without adding a welcome message
        setMessages(loadedMessages);
        setHasUserSentMessage(true);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation. Please try again.");
    }
  };

  const startNewChat = async () => {
    const welcomeMessage = {
      id: welcomeMessageId,
      content: getWelcomeMessage(currentUser),
      sender: "ai" as const,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
    setCurrentConversationId(null);
    setHasUserSentMessage(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messages) {
        setMessages(messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as "user" | "ai",
          timestamp: new Date(msg.created_at)
        })));
      }
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      toast.error("Failed to load conversation messages");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - only show for logged in users */}
      {currentUser && (
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? "260px" : "0px" }}
          className="h-full bg-muted/50 border-r border-border overflow-hidden"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button
                variant="ghost"
                className="flex-1 justify-start gap-2"
                onClick={startNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={toggleSidebar}
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !sidebarOpen && "rotate-180"
                )} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {savedChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadConversation(chat.id)}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-muted/80 transition-colors",
                    currentConversationId === chat.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(chat.lastMessageDate)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Sidebar toggle button - only show for logged in users */}
        {currentUser && !sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-6 z-10"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        )}

        {/* Chat container */}
        <div 
          ref={chatContainerRef}
          className={cn(
            "absolute inset-0 overflow-y-auto py-6 pb-32",
            currentUser ? (sidebarOpen ? "px-4" : "pl-16 pr-4") : "px-4"
          )}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "mb-6 flex gap-4",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-4",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <div className="text-xs mt-2 opacity-70 flex items-center gap-2">
                  {formatDate(message.timestamp)}
                  {message.isStreaming && (
                    <span className="inline-block w-3 h-3 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[150px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultant;
