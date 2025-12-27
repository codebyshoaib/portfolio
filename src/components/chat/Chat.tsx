"use client";

import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../ui/sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Profile {
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  shortBio?: string | null;
  fullBio?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  availability?: string | null;
  socialLinks?: unknown[];
  yearsOfExperience?: number | null;
  stats?: unknown[];
}

interface Technology {
  name?: string | null;
  category?: string | null;
}

interface Experience {
  _id?: string;
  jobTitle?: string | null;
  company?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean | null;
  description?: string | null;
  achievements?: string[] | null;
  technologies?: Technology[] | null;
}

interface Project {
  _id?: string;
  title?: string | null;
  tagline?: string | null;
  category?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  technologies?: Technology[] | null;
}

interface Skill {
  _id?: string;
  name?: string | null;
  category?: string | null;
  level?: string | null;
  yearsOfExperience?: number | null;
  percentage?: number | null;
}

interface Education {
  _id?: string;
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  gpa?: string | null;
}

interface ChatData {
  profile?: Profile | null;
  experience?: Experience[] | null;
  projects?: Project[] | null;
  skills?: Skill[] | null;
  education?: Education[] | null;
}

export function Chat({ profile: chatData }: { profile: ChatData | null }) {
  const profile = chatData?.profile;
  const { toggleSidebar } = useSidebar();
  const [selectedModel, setSelectedModel] = useState("crisp");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingSetRef = useRef(false);
  const profileRef = useRef({
    firstName: profile?.firstName,
    lastName: profile?.lastName,
  });

  // Update profile ref when profile changes (but don't trigger effect)
  useEffect(() => {
    profileRef.current = {
      firstName: profile?.firstName,
      lastName: profile?.lastName,
    };
  }, [profile?.firstName, profile?.lastName]);

  // Set initial greeting - only once on mount
  // Using ref to ensure it only runs once, regardless of profile changes
  useEffect(() => {
    // Only set greeting once, using a ref to track if it's been set
    // This prevents infinite loops even if profile props change
    if (!greetingSetRef.current) {
      greetingSetRef.current = true;
      const { firstName, lastName } = profileRef.current;
      const greeting = firstName
        ? `Hi! I'm ${[firstName, lastName]
            .filter(Boolean)
            .join(
              " ",
            )}. Ask me anything about my work, experience, or projects.`
        : "Hi there! Ask me anything about my work, experience, or projects.";

      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, []); // Empty deps - only run once on mount, ref prevents re-setting

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Gatekeeper: Check if question is related to portfolio/profile
  const isQuestionRelevant = (
    question: string,
  ): { relevant: boolean; message?: string } => {
    const lowerQuestion = question.toLowerCase().trim();

    // Keywords that indicate portfolio-related questions
    const relevantKeywords = [
      // Personal/Profile
      "you",
      "your",
      "yourself",
      "who are",
      "tell me about",
      // Experience
      "experience",
      "work",
      "job",
      "career",
      "role",
      "position",
      "company",
      "employer",
      "worked",
      "working",
      "previous",
      "past",
      "current",
      // Projects
      "project",
      "built",
      "created",
      "developed",
      "github",
      "portfolio",
      "showcase",
      // Skills
      "skill",
      "technology",
      "tech",
      "language",
      "framework",
      "tool",
      "proficient",
      "expertise",
      "specialize",
      "know",
      "learned",
      // Education
      "education",
      "degree",
      "university",
      "college",
      "school",
      "studied",
      "graduate",
      // General portfolio questions
      "background",
      "bio",
      "about",
      "qualification",
      "achievement",
      "accomplishment",
    ];

    // Keywords that indicate off-topic questions
    const offTopicKeywords = [
      "what is",
      "explain",
      "define",
      "how does",
      "why does",
      "tell me about",
      "help me",
      "write code",
      "create",
      "make",
      "build",
      "code for",
      "general",
      "world",
      "history",
      "science",
      "math",
      "physics",
      "chemistry",
      "recipe",
      "cooking",
      "weather",
      "news",
      "current events",
      "politics",
    ];

    // Check if question contains relevant keywords
    const hasRelevantKeywords = relevantKeywords.some((keyword) =>
      lowerQuestion.includes(keyword),
    );

    // Check if it's a generic "what is X" question (not about the person)
    const isGenericQuestion = offTopicKeywords.some(
      (keyword) =>
        lowerQuestion.startsWith(keyword) && !lowerQuestion.includes("your"),
    );

    // Check if it's too short or vague
    if (lowerQuestion.length < 5) {
      return {
        relevant: false,
        message:
          "Please ask a more specific question about my work, experience, or projects.",
      };
    }

    // Check if it's asking about general knowledge
    if (isGenericQuestion && !hasRelevantKeywords) {
      return {
        relevant: false,
        message:
          "I can only answer questions about my professional background, experience, projects, and skills. Please ask me something about my work or portfolio.",
      };
    }

    // If it has relevant keywords, allow it
    if (hasRelevantKeywords) {
      return { relevant: true };
    }

    // If it's a question but doesn't match, ask for clarification
    if (
      lowerQuestion.includes("?") ||
      lowerQuestion.startsWith("what") ||
      lowerQuestion.startsWith("how") ||
      lowerQuestion.startsWith("why")
    ) {
      return {
        relevant: false,
        message:
          "I can help answer questions about my professional experience, projects I've built, my skills, or my background. Could you rephrase your question to be more specific?",
      };
    }

    // Default: allow if it's a statement or unclear
    return { relevant: true };
  };

  // Handle Groq streaming response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const questionText = input;
    setInput("");
    setIsLoading(true);

    // Gatekeeper check - block irrelevant questions
    const gateCheck = isQuestionRelevant(questionText);
    if (!gateCheck.relevant) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            gateCheck.message ||
            "I can only answer questions about my professional background. Please ask about my experience, projects, or skills.",
        },
      ]);
      return;
    }

    // Create messages array for API (excluding greeting)
    const apiMessages = [
      ...messages
        .filter((msg) => msg.id !== "greeting")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      {
        role: "user",
        content: questionText,
      },
    ];

    // Include profile data for context
    const requestBody = {
      messages: apiMessages,
      profileData: chatData,
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Create assistant message for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + content }
                        : msg,
                    ),
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const prompts = [
    {
      icon: "💼",
      label: "What's your experience?",
      prompt: "Tell me about your professional experience and previous roles",
    },
    {
      icon: "💻",
      label: "What skills do you have?",
      prompt:
        "What technologies and programming languages do you specialize in?",
    },
    {
      icon: "🚀",
      label: "What have you built?",
      prompt: "Show me some of your most interesting projects",
    },
    {
      icon: "👤",
      label: "Who are you?",
      prompt: "Tell me more about yourself and your background",
    },
  ];

  const models = [
    {
      id: "crisp",
      label: "Crisp",
      description: "Concise and factual",
    },
    {
      id: "clear",
      label: "Clear",
      description: "Focused and helpful",
    },
    {
      id: "chatty",
      label: "Chatty",
      description: "Conversational companion",
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <h2 className="text-lg font-semibold">
          Chat with {profile?.firstName || "Me"}
        </h2>
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 ? (
          // Initial state: Greeting at top, prompts at bottom
          <div className="flex flex-col h-full">
            {/* Greeting at top - bold and prominent */}
            <div className="flex-1 flex items-end  pt-8">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 max-w-2xl">
                {messages.find((m) => m.id === "greeting")?.content ||
                  (profile?.firstName
                    ? `Hi! I'm ${[profile.firstName, profile.lastName]
                        .filter(Boolean)
                        .join(
                          " ",
                        )}. Ask me anything about my work, experience, or projects.`
                    : "Hi there! Ask me anything about my work, experience, or projects.")}
              </p>
            </div>

            {/* Prompt cards at bottom */}
            <div className="grid grid-cols-2 gap-3 pb-4 mt-8">
              {prompts.map((prompt, idx) => (
                <button
                  key={`prompt-${prompt.label}-${idx}`}
                  type="button"
                  onClick={() => setInput(prompt.prompt)}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 transition-colors bg-white dark:bg-gray-900"
                >
                  <div className="text-2xl mb-2">{prompt.icon}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {prompt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages view
          <>
            {messages
              .filter((msg) => msg.id !== "greeting" || messages.length > 1)
              .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Model Selector - only show when there are messages */}
      {messages.length > 1 && (
        <div className="px-4 py-2 border-t dark:border-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  selectedModel === model.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {model.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t dark:border-gray-800"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Disclaimer: This is my AI-powered twin. It may not be 100% accurate
          and should be verified for accuracy.
        </p>
      </form>
    </div>
  );
}

export default Chat;
