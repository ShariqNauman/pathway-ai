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
  Pencil,
  Image as ImageIcon,
  Mic,
  MicOff,
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
  imageUrl?: string;
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

const ChatConsultant = ({ initialSidebarOpen = true }: ChatConsultantProps) => {
  const { currentUser } = useUser();
  
  const getWelcomeMessage = (user: UserProfile | null) => {
    if (user?.name) {
      return `Hello ${user.name}! I'm your AI university consultant. How can I help with your educational journey today? You can upload images or use voice chat to communicate with me.`;
    }
    return "Hello! I'm your AI university consultant. How can I help with your educational journey today? You can upload images or use voice chat to communicate with me.";
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
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (!textToSend && !imageUrl) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: textToSend,
      sender: "user",
      timestamp: new Date(),
      imageUrl: imageUrl || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasUserSentMessage(true);
    setImageUrl(null);

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
        imageUrl
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const audioChunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          
          try {
            setIsLoading(true);
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, 
              },
              body: JSON.stringify({
                audio: base64Audio,
                model: 'whisper-1'
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              const transcription = result.text;
              
              if (transcription && transcription.trim() !== '') {
                setInputValue(transcription);
                setTimeout(() => {
                  handleSendMessage(transcription);
                }, 100);
              } else {
                console.error("No transcription detected");
              }
            } else {
              console.error("Failed to process voice:", await response.text());
            }
          } catch (error) {
            console.error("Voice processing error:", error);
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.readAsDataURL(audioBlob);
      };
      
      recorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recordingStream) {
      mediaRecorder.stop();
      recordingStream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setRecordingStream(null);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setImageUrl(base64data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              setImageUrl(base64data);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    }
  };

  const clearImage = () => {
    setImageUrl(null);
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
                {message.imageUrl && (
                  <div className="mb-3">
                    <img 
                      src={message.imageUrl} 
                      alt="Uploaded content" 
                      className="max-w-full max-h-64 rounded-md"
                    />
                  </div>
                )}
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

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 bg-background">
          {imageUrl && (
            <div className="mb-2 relative">
              <img 
                src={imageUrl} 
                alt="To be sent" 
                className="h-16 rounded-md"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-0 right-0 rounded-full bg-background/80" 
                onClick={clearImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 bg-background rounded-full border border-muted-foreground/20 px-4 py-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handleImagePaste}
                placeholder="Message ChatGPT..."
                className="min-h-[20px] max-h-[150px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none"
                disabled={isLoading || isRecording}
              />
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading || isRecording}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button 
                  type="button" 
                  className={cn(
                    "transition-colors",
                    isRecording 
                      ? "text-destructive hover:text-destructive/80" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  disabled={isLoading}
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Start voice chat"}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || (!inputValue.trim() && !imageUrl) || isRecording}
                  className="bg-primary text-primary-foreground rounded-full p-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultant;
