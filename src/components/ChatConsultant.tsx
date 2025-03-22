import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getGeminiResponse } from "@/utils/geminiApi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  RotateCcw, 
  Menu, 
  PanelLeft,
  MessageSquare,
  Plus 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface SavedChat {
  id: string;
  title: string;
  lastMessageDate: Date;
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
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [isChatSavingInProgress, setIsChatSavingInProgress] = useState(false);
  
  const { currentUser } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

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
        
        const welcomeMsg = messages.find(msg => msg.id === "1");
        if (welcomeMsg) {
          await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: newConversation[0].id,
              content: welcomeMsg.content,
              sender: welcomeMsg.sender,
              id: welcomeMsg.id
            }]);
        }
        
        await supabase
          .from('chat_messages')
          .insert([{
            conversation_id: newConversation[0].id,
            content: userMessage.content,
            sender: userMessage.sender,
            id: userMessage.id
          }]);
        
        if (aiMessage) {
          await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: newConversation[0].id,
              content: aiMessage.content,
              sender: aiMessage.sender,
              id: aiMessage.id
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
            sender: message.sender
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
    
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasUserSentMessage(true);
    
    try {
      let systemInstructions = "";
      if (currentUser && currentUser.preferences) {
        const { intendedMajor, budget, preferredCountry, studyLevel } = currentUser.preferences;
        if (intendedMajor || budget || preferredCountry || studyLevel) {
          systemInstructions = 
            "You are a helpful AI university consultant. " +
            "When responding to the user's query, consider their profile information: " +
            `${intendedMajor ? `Intended major: ${intendedMajor}. ` : ''}` +
            `${budget ? `Budget: $${budget}. ` : ''}` +
            `${preferredCountry ? `Preferred country: ${preferredCountry}. ` : ''}` +
            `${studyLevel ? `Study level: ${studyLevel}. ` : ''}` +
            "\nUse this information to personalize your responses when appropriate, but DO NOT explicitly mention these preferences in your response unless directly relevant to answering the question. Respond in a natural, conversational way.";
        }
      }
      
      const response = await getGeminiResponse(inputValue, systemInstructions);
      
      if (response.error) {
        console.error("Gemini API Error:", response.error);
        toast(`Error: ${response.error}`);
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
      
      if (currentUser) {
        if (!currentConversationId) {
          await createNewConversation(userMessage, newAiMessage);
        } else {
          await saveMessage(userMessage);
          await saveMessage(newAiMessage);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast("Failed to get response. Please try again.");
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

  const loadConversation = async (conversationId: string) => {
    if (!currentUser) return;
    
    try {
      setCurrentConversationId(conversationId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const loadedMessages = data.map(msg => ({
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
      toast("Failed to load conversation. Please try again.");
    }
  };

  const startNewChat = async () => {
    setMessages([
      {
        id: uuidv4(),
        content: "Hello! I'm your AI university consultant. How can I help with your educational journey today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setCurrentConversationId(null);
    setHasUserSentMessage(false);
    
    toast("New chat started");
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

  return (
    <>
      {currentUser && (
        <Sidebar collapsible="offcanvas" variant="floating">
          <SidebarHeader className="border-b">
            <div className="flex flex-col gap-2 px-3 py-2">
              <h3 className="font-semibold">Your Consultations</h3>
              <p className="text-xs text-muted-foreground">Past educational consultations</p>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>History</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={startNewChat}
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {savedChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => loadConversation(chat.id)}
                      isActive={currentConversationId === chat.id}
                      className="flex flex-col items-start min-h-[3rem] py-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate font-medium text-left">{chat.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-6">
                        {formatDate(chat.lastMessageDate)}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2 m-2"
              onClick={startNewChat}
            >
              <Plus size={16} />
              New Consultation
            </Button>
          </SidebarFooter>
        </Sidebar>
      )}

      <div className="flex-1 flex flex-col h-[calc(100vh-9rem)]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {currentUser && <SidebarTrigger className="md:flex" />}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M16.5 7.5h-9v9h9v-9z" />
                  <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Pathway AI</h3>
                <p className="text-xs text-muted-foreground">University & Education Consultant</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="text-xs px-3 py-2 rounded-md transition-colors flex items-center gap-2"
            onClick={startNewChat}
          >
            <RotateCcw size={14} />
            New Chat
          </Button>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
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
                    : "bg-secondary border border-border mr-12"
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
              <div className="bg-secondary border border-border rounded-lg p-4 mr-12">
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
        
        <form onSubmit={handleSendMessage} className="border-t border-border p-4">
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
      </div>
    </>
  );
};

export default ChatConsultant;
