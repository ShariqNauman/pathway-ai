import { useState, useRef, useEffect } from "react";
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

const ChatConsultant = ({ initialSidebarOpen = true }: ChatConsultantProps) => {
  const { currentUser } = useUser();
  
  const getWelcomeMessage = (user: UserProfile | null) => {
    if (user?.name) {
      return `Hello ${user.name}! I'm your AI university consultant. How can I help with your educational journey today?`;
    }
    return "Hello! I'm your AI university consultant. How can I help with your educational journey today?";
  };

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
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
      
      let title = "New Conversation";
      const userContent = userMessage.content;
      
      if (userContent.length > 5) {
        const words = userContent.split(' ');
        title = words.slice(0, 6).join(' ');
        
        if (title.length > 40) {
          title = title.substring(0, 37) + '...';
        } else if (words.length > 6) {
          title += '...';
        }
      }
      
      const { data: newConversation, error: createError } = await supabase
        .from('chat_conversations')
        .insert([{ 
          user_id: currentUser.id,
          title: title
        }])
        .select();
      
      if (createError) throw createError;
      
      if (newConversation && newConversation.length > 0) {
        setCurrentConversationId(newConversation[0].id);
        
        // Always save the welcome message first
        await supabase
          .from('chat_messages')
          .insert([{
            conversation_id: newConversation[0].id,
            content: "Hello! I'm your AI university consultant. How can I help with your educational journey today?",
            sender: "ai",
            id: "1",
            created_at: new Date().toISOString()
          }]);
        
        // Save the user message
        await supabase
          .from('chat_messages')
          .insert([{
            conversation_id: newConversation[0].id,
            content: userMessage.content,
            sender: userMessage.sender,
            id: userMessage.id,
            created_at: userMessage.timestamp.toISOString()
          }]);
        
        // Save the AI response if provided
        if (aiMessage) {
          await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: newConversation[0].id,
              content: aiMessage.content,
              sender: aiMessage.sender,
              id: aiMessage.id,
              created_at: aiMessage.timestamp.toISOString()
            }]);
        }
          
        await fetchSavedChats();
        return newConversation[0].id;
      }
      return null;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    } finally {
      setIsChatSavingInProgress(false);
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

    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    const aiMessageId = uuidv4();
    const aiMessage: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
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
        // Include user's name and preferences in system instructions
        systemInstructions = "You are a helpful AI university consultant. ";
        
        if (currentUser.name) {
          systemInstructions += `You are talking to ${currentUser.name}. Address them by their name occasionally in a natural way. `;
        }

        if (currentUser.preferences) {
          const { intendedMajor, budget, preferredCountry, studyLevel } = currentUser.preferences;
          if (intendedMajor || budget || preferredCountry || studyLevel) {
            systemInstructions += "Consider their profile information: " +
              `${intendedMajor ? `Intended major: ${intendedMajor}. ` : ''}` +
              `${budget ? `Budget: $${budget}. ` : ''}` +
              `${preferredCountry ? `Preferred country: ${preferredCountry}. ` : ''}` +
              `${studyLevel ? `Study level: ${studyLevel}. ` : ''}`;
          }
        }
      }

      const previousMessages = messages
        .filter(msg => msg.id !== "1")
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
        // Remove the streaming message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
        return;
      }

      // Update the final message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: response.text, isStreaming: false }
            : msg
        )
      );

      // Save messages if user is logged in
      if (currentUser) {
        if (!currentConversationId) {
          // For new conversations, create it with all messages at once
          const welcomeMessage = messages[0]; // Get the welcome message
          const { data: newConversation, error: createError } = await supabase
            .from('chat_conversations')
            .insert([{ 
              user_id: currentUser.id,
              title: userMessage.content.slice(0, 40) + (userMessage.content.length > 40 ? '...' : '')
            }])
            .select();
          
          if (createError) throw createError;
          
          if (newConversation && newConversation.length > 0) {
            const newConvId = newConversation[0].id;
            setCurrentConversationId(newConvId);
            
            // Insert all messages in order
            await supabase.from('chat_messages').insert([
              {
                id: welcomeMessage.id,
                conversation_id: newConvId,
                content: welcomeMessage.content,
                sender: welcomeMessage.sender,
                created_at: welcomeMessage.timestamp.toISOString()
              },
              {
                id: userMessage.id,
                conversation_id: newConvId,
                content: userMessage.content,
                sender: userMessage.sender,
                created_at: userMessage.timestamp.toISOString()
              },
              {
                id: aiMessage.id,
                conversation_id: newConvId,
                content: aiMessage.content,
                sender: aiMessage.sender,
                created_at: aiMessage.timestamp.toISOString()
              }
            ]);
            
            await fetchSavedChats();
          }
        } else {
          // For existing conversations, just save the new messages
          await Promise.all([
            saveMessage(userMessage),
            saveMessage({ ...aiMessage, content: response.text, isStreaming: false })
          ]);
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response. Please try again.");
      // Remove the streaming message if there was an error
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
      
      // Get all messages
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
      id: "1",
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
