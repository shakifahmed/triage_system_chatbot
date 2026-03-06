import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { quickSymptoms, symptomCategories, type ChatMessage } from "@/data/symptoms";
import { api } from "@/services/api";
import { X, Send, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

const findSymptomName = (id: string): string => {
  const quick = quickSymptoms.find((s) => s.id === id);
  if (quick) return quick.name;
  for (const cat of symptomCategories) {
    const found = cat.symptoms.find((s) => s.id === id);
    if (found) return found.name;
  }
  return id.replace(/-/g, " ");
};

/** Convert symptom IDs to comma-separated lowercase names for the API */
const idsToApiString = (ids: string[]): string =>
  ids.map((id) => findSymptomName(id).toLowerCase()).join(", ");

const Chat = () => {
  const [searchParams] = useSearchParams();
  const symptomParam = searchParams.get("symptom") || "headache";
  const sexParam = searchParams.get("sex") || "";
  const ageParam = searchParams.get("age") || "25";
  const durationParam = searchParams.get("duration") || "1";

  const symptomIds = symptomParam.split(",").map((s) => s.trim());
  const symptomNames = symptomIds.map(findSymptomName);
  const symptomLabel =
    symptomNames.length === 1
      ? symptomNames[0]
      : symptomNames.slice(0, -1).join(", ") + " and " + symptomNames[symptomNames.length - 1];

  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have restored messages from Results page
  const restoredMessages = (location.state as Record<string, unknown>)?.chatMessages as ChatMessage[] | undefined;

  const [messages, setMessages] = useState<ChatMessage[]>(restoredMessages || []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conversation state
  const [severity, setSeverity] = useState<string | null>(restoredMessages ? "restored" : null);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [unsure, setUnsure] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [conversationDone, setConversationDone] = useState(!!restoredMessages);
  const [currentSymptomKey, setCurrentSymptomKey] = useState<string | null>(null);

  const progress = severity === null ? 10 : conversationDone ? 100 : Math.min(20 + questionCount * 15, 90);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  // Initial greeting (skip if restored from Results)
  useEffect(() => {
    if (restoredMessages) return;
    setIsTyping(true);
    const timer = setTimeout(() => {
      addMessages([
        {
          id: "1",
          sender: "bot",
          text: `I understand you're experiencing **${symptomLabel}**. Let me ask you a few questions to better understand your situation.`,
        },
        {
          id: "2",
          sender: "bot",
          text: "How would you rate the intensity?",
          quickReplies: ["Mild", "Moderate", "Severe"],
        },
      ]);
      setIsTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [symptomLabel, addMessages, restoredMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  /** Call /suggest-questions and show the next question or finish */
  const fetchNextQuestion = useCallback(
    async (newConfirmed: string[], newRejected: string[], newUnsure: string[]) => {
      setIsTyping(true);
      try {
        const genderApi = sexParam === "male" ? "Male" : sexParam === "female" ? "Female" : "";
        const result = await api.suggestQuestions({
          symptoms: idsToApiString(symptomIds),
          confirmed: newConfirmed,
          rejected: newRejected,
          unsure: newUnsure,
          gender: genderApi,
        });

        if (result.next_question && result.question_text) {
          setCurrentSymptomKey(result.next_question);
          setQuestionCount((c) => c + 1);
          addMessage({
            id: `q-${Date.now()}`,
            sender: "bot",
            text: result.question_text,
            quickReplies: ["Yes", "No", "Not Sure"],
          });
        } else {
          // No more questions — wrap up
          setConversationDone(true);
          setCurrentSymptomKey(null);

          if (result.has_severe_flag && result.matched_severe_symptoms.length > 0) {
            addMessage({
              id: `severe-${Date.now()}`,
              sender: "bot",
              text: `⚠️ I've detected some symptoms that may need urgent attention: **${result.matched_severe_symptoms.join(", ")}**. I strongly recommend seeking immediate medical care.`,
            });
          }

          addMessage({
            id: "done",
            sender: "bot",
            text: "Thank you for answering all my questions! I've analyzed your symptoms. Let me show you the results.",
          });

          // Navigate to results with all collected data
          const allSymptoms = [
            ...symptomIds.map((id) => findSymptomName(id).toLowerCase()),
            ...newConfirmed,
          ].join(", ");

          setTimeout(() => {
            navigate("/results", {
              state: {
                symptoms: allSymptoms,
                age: parseInt(ageParam),
                gender: sexParam === "male" ? "Male" : "Female",
                severity: severity || "Mild",
                duration: parseInt(durationParam),
                symptomLabel,
                confirmedSymptoms: newConfirmed,
                chatMessages: [...messages, { id: "done", sender: "bot", text: "Thank you for answering all my questions! I've analyzed your symptoms. Let me show you the results." }],
                chatParams: { symptom: symptomParam, sex: sexParam, age: ageParam, duration: durationParam },
              },
            });
          }, 2000);
        }
      } catch (error) {
        console.error("suggest-questions error:", error);
        // On API error, still let user proceed to results
        setConversationDone(true);
        addMessage({
          id: "error",
          sender: "bot",
          text: "I had trouble processing that. Let me show you what I have so far.",
        });
        const allSymptoms = symptomIds.map((id) => findSymptomName(id).toLowerCase()).join(", ");
        setTimeout(() => {
          navigate("/results", {
            state: {
              symptoms: allSymptoms,
              age: parseInt(ageParam),
              gender: sexParam === "male" ? "Male" : "Female",
              severity: severity || "Mild",
              duration: parseInt(durationParam),
              symptomLabel,
              confirmedSymptoms: [],
              chatMessages: [...messages],
              chatParams: { symptom: symptomParam, sex: sexParam, age: ageParam, duration: durationParam },
            },
          });
        }, 2000);
      } finally {
        setIsTyping(false);
      }
    },
    [symptomIds, sexParam, ageParam, durationParam, severity, symptomLabel, navigate, addMessage]
  );

  const handleUserReply = (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text };
    addMessage(userMsg);

    // Step 1: Severity selection
    if (!severity) {
      const sevChoice = text.trim();
      if (["Mild", "Moderate", "Severe"].includes(sevChoice)) {
        setSeverity(sevChoice);
        // Start suggesting questions
        fetchNextQuestion([], [], []);
      }
      return;
    }

    // Step 2: Handle Yes/No/Not Sure for suggested symptoms
    if (currentSymptomKey) {
      const answer = text.trim().toLowerCase();
      let newConfirmed = [...confirmed];
      let newRejected = [...rejected];
      let newUnsure = [...unsure];

      if (answer === "yes") {
        newConfirmed = [...confirmed, currentSymptomKey];
        setConfirmed(newConfirmed);
      } else if (answer === "no") {
        newRejected = [...rejected, currentSymptomKey];
        setRejected(newRejected);
      } else {
        newUnsure = [...unsure, currentSymptomKey];
        setUnsure(newUnsure);
      }

      setCurrentSymptomKey(null);
      fetchNextQuestion(newConfirmed, newRejected, newUnsure);
      return;
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleUserReply(input.trim());
    setInput("");
  };

  const lastBotMessage = [...messages].reverse().find((m) => m.sender === "bot");

  return (
    <div
      className="flex h-screen flex-col bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/Light%20Blue%20Illustrative%20Medical%20Project%20Presentation_chatting.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bot-bubble)" }}>
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Symptom Check</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <Progress value={progress} className="mx-auto mt-2 h-1.5 max-w-2xl" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bot-bubble)" }}>
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-user-bubble text-primary-foreground"
                    : "bg-bot-bubble text-primary-foreground"
                }`}
                style={
                  msg.sender === "bot"
                    ? { backgroundColor: "var(--bot-bubble)", color: "var(--primary-foreground)" }
                    : undefined
                }
                dangerouslySetInnerHTML={{
                  __html: msg.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start"
            >
              <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bot-bubble)" }}>
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-bot-bubble px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Replies */}
      {lastBotMessage?.quickReplies && !isTyping && !conversationDone && (
        <div className="border-t border-border bg-card/50 px-4 py-3">
          <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
            {lastBotMessage.quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleUserReply(reply)}
                className="rounded-full bg-chip px-4 py-2 text-sm font-medium text-chip-foreground transition-all hover:bg-primary/15"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card/70 px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="rounded-full"
            disabled={isTyping || conversationDone}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || conversationDone}
            size="icon"
            className="shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
