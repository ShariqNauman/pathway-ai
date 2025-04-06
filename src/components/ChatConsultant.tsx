import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getGeminiResponse } from "@/utils/geminiApi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Plus,
  MessageSquare,
  ChevronLeft,
  MoreVertical,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Mic,
  MicOff,
  X
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
import { VoiceRecorder, transcribeAudio } from "@/utils/voiceUtils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
  imageUrls?: string[];
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
const MAX_IMAGES = 3;

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
  const userMessages = messages.filter(msg => msg.sender === "user");
  if (userMessages.length < MIN_USER_MESSAGES_FOR_TITLE) {
    return DEFAULT_CHAT_TITLE;
  }

  const combinedText = messages
    .map(msg => msg.content)
    .join(" ")
    .toLowerCase();

  const titlePatterns = [
    {
      match: (text: string) => {
        const programs = ["computer science", "engineering", "business", "data science", "ai"];
        const levels = ["undergraduate", "masters", "phd", "graduate"];
        
        for (const program of programs) {
          for (const level of levels) {
            if (text.includes(program) && text.includes(level)) {
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

  for (const pattern of titlePatterns) {
    const title = pattern.match(combinedText);
    if (title) {
      return title;
    }
  }

  const firstMessage = userMessages[0].content.toLowerCase();
  const words = firstMessage.split(" ").slice(0, 3);
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
};

const ChatConsultant = ({ initialSidebarOpen = false }: ChatConsultantProps) => {
  const { currentUser } = useUser();
  
  const getWelcomeMessage = (user: UserProfile | null) => {
    if (user?.name) {
      return `Hello ${user.name}! I'm your AI consultant. How can I help with your educational journey today?`;
    }
    return "Hello! I'm your AI consultant. How can I help with your educational journey today?";
  };

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
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [hasShownPreferencesReminder, setHasShownPreferencesReminder] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [isChatSavingInProgress, setIsChatSavingInProgress] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(currentUser ? initialSidebarOpen : false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const voiceRecorder = useRef<VoiceRecorder>(new VoiceRecorder());

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
        
        const welcomeMessage = {
          id: welcomeMessageId,
          content: getWelcomeMessage(currentUser),
          sender: "ai" as const,
          timestamp: new Date(Date.now() - 2000),
          created_at: new Date(Date.now() - 2000).toISOString()
        };
        
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
        
        if (aiMessage) {
          messagesToSave.push({
            conversation_id: newConvId,
              content: aiMessage.content,
              sender: aiMessage.sender,
            id: aiMessage.id,
            created_at: aiMessage.timestamp.toISOString()
          });
        }

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

  const updateConversationTitle = async (conversationId: string, messages: Message[]) => {
    if (!currentUser) return;
    
    try {
      const userMessageCount = messages.filter(msg => msg.sender === "user").length;
      
      if (userMessageCount === MIN_USER_MESSAGES_FOR_TITLE) {
        const newTitle = analyzeConversationTitle(messages);
        
        const { error } = await supabase
          .from('chat_conversations')
          .update({ title: newTitle })
          .eq('id', conversationId);
          
        if (error) throw error;
        
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
          
          if (messagesToSave.length >= MIN_USER_MESSAGES_FOR_TITLE) {
            await updateConversationTitle(newConvId, messagesToSave);
          }
          
          await fetchSavedChats();
        }
      } else {
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

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue.trim();
    if (!textToSend && imageUrls.length === 0) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      content: textToSend,
      sender: "user",
      timestamp: new Date(),
      imageUrls: imageUrls.length > 0 ? [...imageUrls] : undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasUserSentMessage(true);
    setImageUrls([]); // Clear images after sending

    try {
      const previousMessages = messages.map(msg => ({
          content: msg.content,
          role: msg.sender === "user" ? "user" : "model" as "user" | "model"
        }));
      
      const tempMessageId = uuidv4();
      setMessages(prev => [...prev, {
        id: tempMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
        isStreaming: true
      }]);

      const primaryImage = userMessage.imageUrls && userMessage.imageUrls.length > 0 ? 
        userMessage.imageUrls[0] : null;
      const additionalImages = userMessage.imageUrls && userMessage.imageUrls.length > 1 ? 
        userMessage.imageUrls.slice(1) : [];

      const response = await getGeminiResponse(
        textToSend,
        undefined,
        previousMessages,
        {
          onTextUpdate: (text) => {
            setMessages(prev => prev.map(msg =>
              msg.id === tempMessageId ? { ...msg, content: text } : msg
            ));
          }
        },
        currentUser,
        primaryImage,
        additionalImages
      );
      
      if (response.error) {
        toast.error(response.error);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        return;
      }
      
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId ? {
          ...msg,
        content: response.text,
        isStreaming: false
        } : msg
      ));

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

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await voiceRecorder.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!voiceRecorder.current.isCurrentlyRecording()) {
        console.log("No active recording to stop");
        setIsRecording(false);
        return;
      }
      
      setIsLoading(true);
      const audioBlob = await voiceRecorder.current.stop();
      
      const transcription = await transcribeAudio(audioBlob);
      
      if (transcription && transcription.trim()) {
        setInputValue(transcription);
        setTimeout(() => {
          handleSendMessage(transcription);
        }, 100);
      }
    } catch (error) {
      console.error("Error in voice recording process:", error);
    } finally {
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    const isActuallyRecording = voiceRecorder.current.isCurrentlyRecording();
    
    if (isActuallyRecording || isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const remainingSlots = MAX_IMAGES - imageUrls.length;
      const filesToProcess = Math.min(files.length, remainingSlots);
      
      if (filesToProcess <= 0) {
        return;
      }
      
      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImageUrls(prev => [...prev, base64data]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImagePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items && imageUrls.length < MAX_IMAGES) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              setImageUrls(prev => 
                prev.length < MAX_IMAGES ? [...prev, base64data] : prev
              );
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      
      const { data: messagesData, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (msgError) throw msgError;
      
      if (messagesData) {
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
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', chatId);
        
      if (messagesError) throw messagesError;
      
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', chatId);
        
      if (conversationError) throw conversationError;
      
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      
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

      <div className="flex-1 flex flex-col h-full relative">
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

        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex mb-4",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "max-w-3xl p-4 rounded-lg",
                  message.sender === "user" 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.imageUrls && message.imageUrls.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {message.imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Uploaded ${index + 1}`} 
                          className="max-w-xs max-h-48 rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                {message.sender === "ai" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                    <div>{message.content}</div>
                )}
              </div>
                {message.isStreaming && (
                  <div className="mt-2">
                    <div className="bg-primary/20 animate-pulse w-8 h-2 rounded"></div>
            </div>
                )}
                </div>
              </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-border">
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 border border-border"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handleImagePaste}
              placeholder="Message AI Consultant..."
              className="pr-14 py-3 min-h-[50px] max-h-[200px] resize-none rounded-full"
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-3 flex items-center gap-1">
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || imageUrls.length >= MAX_IMAGES}
                title="Attach image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 rounded-full",
                  isRecording && "bg-destructive text-destructive-foreground"
                )}
                onClick={toggleRecording}
                disabled={isLoading && !isRecording}
                title={isRecording ? "Stop recording" : "Start voice recording"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
              <Button
                size="icon"
                disabled={(!inputValue.trim() && imageUrls.length === 0) || isLoading}
                onClick={() => handleSendMessage()}
                className="h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultant;
