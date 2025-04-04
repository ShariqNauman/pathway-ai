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
  ChevronLeft,
  MoreVertical,
  Trash2,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<SavedChat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");

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

  const saveConversation = async (messagesToSave: Message[]) => {
    if (!currentUser || isChatSavingInProgress) return;
    setIsChatSavingInProgress(true);

    try {
      if (!currentConversationId) {
        // Create new conversation
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
          
          // Save all messages
          const dbMessages = messagesToSave.map(msg => ({
            conversation_id: newConvId,
            content: msg.content,
            sender: msg.sender,
            id: msg.id,
            created_at: msg.timestamp.toISOString()
          }));

          const { error: insertError } = await supabase
            .from('chat_messages')
            .insert(dbMessages);

          if (insertError) throw insertError;
          
          // Update title if enough messages
          if (messagesToSave.length >= MIN_USER_MESSAGES_FOR_TITLE) {
            await updateConversationTitle(newConvId, messagesToSave);
          }
          
          await fetchSavedChats();
        }
      } else {
        // For existing conversations, save only the new messages
        const existingMessageIds = new Set(messages.map(m => m.id));
        const newMessages = messagesToSave.filter(msg => !existingMessageIds.has(msg.id));
        
        await Promise.all(newMessages.map(msg => 
          supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              content: msg.content,
              sender: msg.sender,
              id: msg.id,
              created_at: msg.timestamp.toISOString()
            })
        ));
        
        // Update title if enough messages
        if (messagesToSave.length >= MIN_USER_MESSAGES_FOR_TITLE) {
          await updateConversationTitle(currentConversationId, messagesToSave);
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation');
    } finally {
      setIsChatSavingInProgress(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasUserSentMessage(true);

    try {
      // Prepare previous messages for context
      const previousMessages = messages.map(msg => ({
        content: msg.content,
        role: msg.sender === "user" ? "user" : "model" as "user" | "model"
      }));

      // Create a temporary message for streaming
      const tempMessageId = uuidv4();
      setMessages(prev => [...prev, {
        id: tempMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Get AI response with streaming updates
      const response = await getGeminiResponse(
        inputValue.trim(),
        undefined,
        previousMessages,
        {
          onTextUpdate: (text) => {
            setMessages(prev => prev.map(msg =>
              msg.id === tempMessageId ? { ...msg, content: text } : msg
            ));
          }
        },
        currentUser // Pass the current user profile to the API
      );

      if (response.error) {
        toast.error(response.error);
        // Remove the temporary message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        return;
      }

      // Update the temporary message with the final content
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId ? {
          ...msg,
          content: response.text,
          isStreaming: false
        } : msg
      ));

      // Save the conversation if the user is logged in
      if (currentUser) {
        await saveConversation([...messages, userMessage, {
          id: tempMessageId,
          content: response.text,
          sender: "ai",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return;
    
    try {
      // Delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', chatId);
        
      if (messagesError) throw messagesError;
      
      // Delete the conversation
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', chatId);
        
      if (conversationError) throw conversationError;
      
      // Update the UI
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was the current one, start a new chat
      if (currentConversationId === chatId) {
        startNewChat();
      }
      
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    if (!currentUser || !newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ title: newTitle.trim() })
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Update the UI
      setSavedChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
      
      toast.success("Chat renamed successfully");
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat");
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatToRename && newChatTitle.trim()) {
      renameChat(chatToRename.id, newChatTitle);
      setIsRenameDialogOpen(false);
      setChatToRename(null);
      setNewChatTitle("");
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
                <div
                  key={chat.id}
                  className={cn(
                    "group relative w-full text-left px-4 py-2 hover:bg-muted/80 transition-colors",
                    currentConversationId === chat.id && "bg-muted"
                  )}
                >
                  <button
                    onClick={() => loadConversation(chat.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">{chat.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(chat.lastMessageDate)}
                    </div>
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToRename(chat);
                          setNewChatTitle(chat.title);
                          setIsRenameDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit}>
            <div className="py-4">
              <Input
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter new chat title"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newChatTitle.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
