import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Code,
  LoaderCircle,
  X,
  Copy,
  Check,
  RefreshCw,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnimations } from "@/utils/animationUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface CodingAssistantProps {
  initialSidebarOpen?: boolean;
  refreshKey?: number;
}

function createNewSession(): ChatSession {
  return {
    id: uuidv4(),
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
  };
}

const CodingAssistant: React.FC<CodingAssistantProps> = ({
  initialSidebarOpen = false,
  refreshKey = 0,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(initialSidebarOpen);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetched, setIsFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { spring, fadeIn } = useAnimations();
  const { user } = useAuth();

  // Fetch chat sessions only when needed
  useEffect(() => {
    if (user && (!isFetched || refreshKey > 0) && !isFetchingRef.current) {
      fetchChatSessions();
    } else if (!user && isLoading) {
      // If no user, create a default chat
      const newSession = createNewSession();
      setChatSessions([newSession]);
      setActiveChatId(newSession.id);
      setIsLoading(false);
    }
  }, [user, refreshKey]);

  // Ensure active chat is set correctly after sessions are loaded
  useEffect(() => {
    if (chatSessions.length > 0 && !activeChatId) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [chatSessions, activeChatId]);

  const fetchChatSessions = useCallback(async () => {
    if (!user || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setFetchError(null);

    try {
      console.log("Fetching chat sessions for user:", user.id);

      // Get all sessions for the user - fetch in batches
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("apl_coding_assistant_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      if (sessionsData && sessionsData.length > 0) {
        // Create sessions without messages first
        const initialSessions: ChatSession[] = sessionsData.map((session) => ({
          id: session.id,
          title: session.title,
          messages: [],
          createdAt: new Date(session.created_at),
        }));

        // Set initial sessions to show UI faster
        setChatSessions(initialSessions);
        if (initialSessions.length > 0) {
          setActiveChatId(initialSessions[0].id);
        }

        // Fetch messages for active session only
        if (initialSessions.length > 0) {
          await fetchMessagesForSession(initialSessions[0].id);
        }
      } else {
        // No sessions found, create a new one
        const newSession = createNewSession();
        setChatSessions([newSession]);
        setActiveChatId(newSession.id);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setFetchError("Failed to load chat sessions");
      toast.error("Failed to load chat sessions");

      // Create a new session as fallback
      const newSession = createNewSession();
      setChatSessions([newSession]);
      setActiveChatId(newSession.id);
    } finally {
      setIsLoading(false);
      setIsFetched(true);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Only fetch messages for the active session when it changes
  const fetchMessagesForSession = useCallback(
    async (sessionId: string) => {
      if (!user || !sessionId) return;

      try {
        console.log("Fetching messages for session", sessionId);

        const { data: messagesData, error: messagesError } = await supabase
          .from("apl_coding_assistant_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("timestamp", { ascending: true });

        if (messagesError) {
          console.error(
            "Error fetching messages for session",
            sessionId,
            messagesError,
          );
          return;
        }

        if (messagesData) {
          const messages: Message[] = messagesData.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));

          setChatSessions((prevSessions) =>
            prevSessions.map((session) =>
              session.id === sessionId ? { ...session, messages } : session,
            ),
          );
        }
      } catch (error) {
        console.error("Error fetching messages for session", sessionId, error);
      }
    },
    [user],
  );

  // When active chat changes, fetch its messages
  useEffect(() => {
    const fetchTimeout = setTimeout(() => {
      if (activeChatId && user && !isFetchingRef.current) {
        fetchMessagesForSession(activeChatId);
      }
    }, 300); // Add debounce to prevent rapid fetching

    return () => clearTimeout(fetchTimeout);
  }, [activeChatId, user]);

  const activeChat =
    chatSessions.find((chat) => chat.id === activeChatId) ||
    (chatSessions.length > 0 ? chatSessions[0] : null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoading && activeChat?.messages) {
      scrollToBottom();
    }
  }, [activeChat?.messages, isLoading]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    });
  };

  const saveSessionToSupabase = async (
    session: ChatSession,
    newMessage: Message,
  ) => {
    if (!user) return;

    try {
      let sessionId = session.id;

      // Check if the session already exists in Supabase
      const { data: existingSession } = await supabase
        .from("apl_coding_assistant_sessions")
        .select("id")
        .eq("id", session.id)
        .single();

      if (!existingSession) {
        // Create a new session in Supabase
        const { data: newSession, error: sessionError } = await supabase
          .from("apl_coding_assistant_sessions")
          .insert({
            id: session.id,
            user_id: user.id,
            title: session.title,
            created_at: session.createdAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (sessionError) throw sessionError;
        if (newSession && newSession.length > 0) {
          sessionId = newSession[0].id;
        }
      } else {
        // Update the existing session
        const { error: updateError } = await supabase
          .from("apl_coding_assistant_sessions")
          .update({
            title: session.title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        if (updateError) throw updateError;
      }

      // Save the new message to Supabase
      const { error: messageError } = await supabase
        .from("apl_coding_assistant_messages")
        .insert({
          id: newMessage.id,
          session_id: sessionId,
          role: newMessage.role,
          content: newMessage.content,
          timestamp: newMessage.timestamp.toISOString(),
        });

      if (messageError) throw messageError;
    } catch (error) {
      console.error("Error saving session to Supabase:", error);
      toast.error("Failed to save chat message");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || !activeChat) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    // Update chat session with new message
    setChatSessions((prevSessions) => {
      return prevSessions.map((session) => {
        if (session.id === activeChatId) {
          // Update title if it's the first message
          const title =
            session.messages.length === 0
              ? prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")
              : session.title;

          return {
            ...session,
            title,
            messages: [...session.messages, userMessage],
          };
        }
        return session;
      });
    });

    setPrompt("");
    setIsGenerating(true);

    try {
      // Get the updated session with user message
      const currentSession = chatSessions.find((s) => s.id === activeChatId);
      if (currentSession) {
        // Update title if it's the first message
        const title =
          currentSession.messages.length === 0
            ? prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")
            : currentSession.title;

        const sessionWithTitle = { ...currentSession, title };

        // Save user message to Supabase
        await saveSessionToSupabase(sessionWithTitle, userMessage);
      }

      // Call Mistral API
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer oKUybTARfRKqxipNKNRgsDzJQYTrXDao`,
          },
          body: JSON.stringify({
            model: "mistral-small",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful coding assistant with expertise in MuleSoft, DataWeave, and API development. Provide code examples and explanations that are clear and easy to understand.",
              },
              ...(activeChat.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })) || []),
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setChatSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, assistantMessage],
            };
          }
          return session;
        });
      });

      // Save assistant message to Supabase
      const updatedSession = chatSessions.find((s) => s.id === activeChatId);
      if (updatedSession) {
        await saveSessionToSupabase(updatedSession, assistantMessage);
      }
    } catch (error) {
      console.error("Error calling Mistral API:", error);
      toast.error("Failed to generate response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const formatMessage = (content: string, messageId: string) => {
    // Split by code blocks
    return content.split("```").map((part, index) => {
      if (index % 2 === 1) {
        // This is a code block
        const codeLines = part.split("\n");
        const language = codeLines[0] || "text";
        const code = codeLines.slice(1).join("\n");
        const blockId = `${messageId}-block-${index}`;

        return (
          <div
            key={blockId}
            className="bg-gray-900 rounded-md p-3 my-3 overflow-x-auto text-sm group relative"
          >
            <div className="flex justify-between items-center mb-2 text-xs">
              <div className="text-gray-400 font-medium">{language}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-gray-400 hover:text-white absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(code, blockId)}
              >
                {copied === blockId ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <pre className="text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Regular text with improved paragraph spacing
      return part.split("\n\n").map((paragraph, pIndex) => (
        <p
          key={`${messageId}-p-${index}-${pIndex}`}
          className="mb-3 whitespace-pre-line"
        >
          {paragraph}
        </p>
      ));
    });
  };

  const handleNewChat = async () => {
    if (!user) return;

    const newSession = createNewSession();
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);

    try {
      // Create a new session in Supabase
      const { error } = await supabase
        .from("apl_coding_assistant_sessions")
        .insert({
          id: newSession.id,
          user_id: user.id,
          title: newSession.title,
          created_at: newSession.createdAt.toISOString(),
          updated_at: newSession.createdAt.toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error creating new chat in Supabase:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleChatSelect = (chatId: string) => {
    if (chatId === activeChatId) return; // Don't reselect if already active

    setActiveChatId(chatId);

    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) return;

    try {
      // Delete all messages for this chat first
      const { error: messagesError } = await supabase
        .from("apl_coding_assistant_messages")
        .delete()
        .eq("session_id", chatId);

      if (messagesError) throw messagesError;

      // Then delete the chat session
      const { error } = await supabase
        .from("apl_coding_assistant_sessions")
        .delete()
        .eq("id", chatId);

      if (error) throw error;

      setChatSessions((prev) => {
        const filtered = prev.filter((chat) => chat.id !== chatId);

        // If we're deleting the active chat, set a new active chat
        if (chatId === activeChatId && filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else if (filtered.length === 0) {
          // If no chats left, create a new one
          const newSession = createNewSession();
          setActiveChatId(newSession.id);
          return [newSession];
        }

        return filtered;
      });

      toast.success("Chat deleted");
    } catch (error) {
      console.error("Error deleting chat from Supabase:", error);
      toast.error("Failed to delete chat");
    }
  };

  const clearChat = async () => {
    if (!user || !activeChat) return;

    try {
      // First update local state for immediate feedback
      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId 
            ? { ...chat, title: "New Chat", messages: [] } 
            : chat
        ),
      );

      // Delete all messages for this chat session
      const { error: messagesError } = await supabase
        .from("apl_coding_assistant_messages")
        .delete()
        .eq("session_id", activeChatId);

      if (messagesError) throw messagesError;

      // Update the session to reset its title
      const { error: sessionError } = await supabase
        .from("apl_coding_assistant_sessions")
        .update({
          title: "New Chat",
          updated_at: new Date().toISOString()
        })
        .eq("id", activeChatId);

      if (sessionError) {
        // Revert local state if update fails
        await fetchMessagesForSession(activeChatId);
        throw sessionError;
      }

      toast.success("Chat cleared");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const regenerateResponse = async () => {
    if (!activeChat || activeChat.messages.length < 2) return;

    // Get the last user message
    const lastUserMessage = [...activeChat.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) return;

    // Remove the last assistant message
    setChatSessions((prev) =>
      prev.map((chat) => {
        if (chat.id === activeChatId) {
          const messages = [...chat.messages];
          const lastIndex = messages.length - 1;
          if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
            // Delete the message from Supabase
            if (user) {
              supabase
                .from("apl_coding_assistant_messages")
                .delete()
                .eq("role", "assistant")
                .eq("session_id", chat.id)
                .order("timestamp", { ascending: false })
                .limit(1)
                .then(({ error }) => {
                  if (error) console.error("Error deleting message:", error);
                });
            }

            messages.pop();
          }
          return { ...chat, messages };
        }
        return chat;
      }),
    );

    setIsGenerating(true);

    try {
      // Call Mistral API with the last user message
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer oKUybTARfRKqxipNKNRgsDzJQYTrXDao`,
          },
          body: JSON.stringify({
            model: "mistral-small",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful coding assistant with expertise in MuleSoft, DataWeave, and API development. Provide code examples and explanations that are clear and easy to understand.",
              },
              ...activeChat.messages
                .filter(
                  (msg) =>
                    msg.role !== "assistant" ||
                    activeChat.messages.indexOf(msg) <
                      activeChat.messages.length - 1,
                )
                .map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              { role: "user", content: lastUserMessage.content },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Add new assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setChatSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, assistantMessage],
            };
          }
          return session;
        });
      });

      // Save the new assistant message to Supabase
      const currentSession = chatSessions.find((s) => s.id === activeChatId);
      if (currentSession && user) {
        await saveSessionToSupabase(currentSession, assistantMessage);
      }
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast.error("Failed to regenerate response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Chat List Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <motion.div {...spring()}>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                  onClick={handleNewChat}
                  disabled={isLoading}
                >
                  <Plus size={16} /> New Chat
                </Button>
              </motion.div>
            </div>

            <ScrollArea className="h-[calc(100%-56px)] p-2">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <LoaderCircle className="animate-spin h-5 w-5 text-gray-400" />
                  </div>
                ) : fetchError ? (
                  <div className="p-4 text-center text-red-500">
                    <p>{fetchError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setIsFetched(false);
                        fetchChatSessions();
                      }}
                    >
                      <RefreshCw size={14} className="mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  chatSessions.map((chat) => (
                    <motion.div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`flex items-start gap-2 p-2 rounded-md cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        chat.id === activeChatId
                          ? "bg-gray-100 dark:bg-gray-800"
                          : ""
                      }`}
                      {...fadeIn({ duration: 0.3, delay: 0.05 })}
                    >
                      <MessageSquare
                        size={18}
                        className="mt-1 text-purple-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {chat.messages.length > 0
                            ? new Date(
                                chat.messages[
                                  chat.messages.length - 1
                                ].timestamp,
                              ).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No messages"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => deleteChat(chat.id, e)}
                      >
                        <Trash2
                          size={14}
                          className="text-gray-500 hover:text-red-500"
                        />
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col shadow-lg border-gray-200 overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg sticky top-0 z-10 p-4 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 text-white hover:bg-white/20"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <MessageSquare size={18} />
                </Button>
                <Code size={20} /> Coding Assistant
              </CardTitle>
              <CardDescription className="text-purple-100">
                Get help with MuleSoft, API design, DataWeave, and more
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {activeChat && activeChat.messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-white hover:bg-none  mr-[4rem]"
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Fix for the scrolling area */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="absolute inset-0 h-full" ref={scrollAreaRef}>
            <CardContent className="p-4 space-y-4 min-h-[calc(100vh-12rem)]">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <LoaderCircle className="h-8 w-8 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-500">Loading your conversations...</p>
                </div>
              ) : fetchError ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-red-500 mb-4">
                    <RefreshCw size={40} />
                  </div>
                  <p className="text-lg font-medium mb-2 text-red-500">
                    Failed to load your conversations
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setIsFetched(false);
                      fetchChatSessions();
                    }}
                  >
                    <RefreshCw size={14} className="mr-2" /> Try Again
                  </Button>
                </div>
              ) : activeChat && activeChat.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-24">
                  <Code size={48} className="mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    Welcome to the Coding Assistant
                  </p>
                  <p className="max-w-sm">
                    How can I help you with MuleSoft, DataWeave, or API
                    development today?
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {activeChat &&
                    activeChat.messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg p-4 ${
                            message.role === "user"
                              ? "bg-purple-600 text-white rounded-tr-none"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
                          }`}
                        >
                          {formatMessage(message.content, message.id)}
                          <div className="text-right mt-2">
                            <span
                              className={`text-xs ${message.role === "user" ? "text-purple-200" : "text-gray-500"}`}
                            >
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              )}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg rounded-tl-none flex items-center space-x-2">
                    <div className="w-7 h-3 flex">
                      <motion.span
                        className="w-2 h-2 bg-purple-600 rounded-full mr-1"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0,
                        }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-purple-600 rounded-full mr-1"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0.2,
                        }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-purple-600 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0.4,
                        }}
                      />
                    </div>
                    <span className="text-gray-500">
                      Generating response...
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </ScrollArea>
        </div>

        <CardFooter className="border-t bg-gray-50 dark:bg-gray-850 p-4 sticky bottom-0 mt-auto shrink-0 relative">
          {activeChat &&
            activeChat.messages.length > 0 &&
            activeChat.messages[activeChat.messages.length - 1].role ===
              "assistant" && (
              <div className="absolute -top-14 right-4 z-10">
                <motion.div {...spring()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateResponse}
                    disabled={isGenerating || isLoading}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-md gap-1 rounded-lg px-3 py-1 h-9"
                  >
                    <RefreshCw
                      size={14}
                      className="text-purple-600 dark:text-purple-400"
                    />
                    <span>Regenerate</span>
                  </Button>
                </motion.div>
              </div>
            )}

          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a coding question..."
              className="flex-1 min-h-12 resize-none border-gray-200 dark:border-gray-700 focus:ring-purple-500 dark:focus:ring-purple-400 rounded-lg shadow-sm"
              disabled={isGenerating || isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <motion.div {...spring()}>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-md rounded-lg h-full"
                disabled={isGenerating || isLoading || !prompt.trim()}
              >
                {isGenerating ? (
                  <LoaderCircle className="animate-spin h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CodingAssistant;
