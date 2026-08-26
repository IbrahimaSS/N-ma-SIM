"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Send, X, MessageSquare, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface AdminAgentAction {
  type: "none" | "navigate" | "print" | "refresh";
  target: string;
}

export function AdminAgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Bonjour ! Je suis N'ma IA. Que puis-je faire pour vous ?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // ─── SYNTHÈSE VOCALE ───
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.onstart = () => { isSpeakingRef.current = true; };
      utterance.onend = () => { isSpeakingRef.current = false; };
      utterance.onerror = () => { isSpeakingRef.current = false; };
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  // ─── EXÉCUTION DES ACTIONS ───
  const executeAction = useCallback((action: AdminAgentAction) => {
    if (!action || action.type === "none") return;

    if (action.type === "navigate" && action.target) {
      setTimeout(() => router.push(action.target), 1000);
    } else if (action.type === "print") {
      if (action.target && action.target !== pathname && action.target.startsWith('/')) {
        // Si l'utilisateur demande d'imprimer une autre page, on y navigue d'abord
        setTimeout(() => router.push(action.target), 500);
        setTimeout(() => {
          const event = new CustomEvent("admin-ai-action", { detail: { action: "print" }, cancelable: true });
          const notPrevented = document.dispatchEvent(event);
          if (notPrevented) setTimeout(() => window.print(), 500);
        }, 2500); // Attendre que la nouvelle page charge
      } else {
        setTimeout(() => {
          const event = new CustomEvent("admin-ai-action", { detail: { action: "print" }, cancelable: true });
          const notPrevented = document.dispatchEvent(event);
          // Fallback natif si la page ne gère pas l'event
          if (notPrevented) setTimeout(() => window.print(), 500);
        }, 1000);
      }
    } else if (action.type === "refresh") {
      setTimeout(() => {
        const event = new CustomEvent("admin-ai-action", { detail: { action: "refresh" } });
        document.dispatchEvent(event);
      }, 1000);
    }
  }, [router]);

  // ─── APPEL BACKEND ───
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", text }]);
    setInputText("");
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/api/admin-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, currentPath: pathname }),
      });

      const data = await res.json();
      
      if (data.answer) {
        setMessages(prev => [...prev, { role: "ai", text: data.answer }]);
        speak(data.answer);
      }
      if (data.action) {
        executeAction(data.action);
      }
    } catch (err) {
      console.error("Erreur Agent Admin", err);
      const fallback = "Désolé, je n'arrive pas à joindre le serveur.";
      setMessages(prev => [...prev, { role: "ai", text: fallback }]);
      speak(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, speak, executeAction]);

  // ─── MICROPHONE ───
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return;
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isListening, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {isOpen ? (
        <div style={{
          width: 350,
          height: 500,
          backgroundColor: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 10px 40px rgba(31,2,112,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(31,2,112,0.1)"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1F0270, #3B12A6)",
            padding: "16px 20px",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, backgroundColor: "#10B981", borderRadius: "50%", boxShadow: "0 0 8px #10B981" }} />
              <span style={{ fontWeight: 600, fontSize: 16 }}>N'ma IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "#F4F6FB" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.role === "user" ? "#1F0270" : "white",
                color: msg.role === "user" ? "white" : "#1F2937",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "20px 20px 0 20px" : "20px 20px 20px 0",
                maxWidth: "85%",
                fontSize: 14,
                lineHeight: 1.5,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "white", padding: "12px 16px", borderRadius: "20px 20px 20px 0", display: "flex", gap: 8 }}>
                <Loader2 size={16} className="animate-spin text-[#1F0270]" />
                <span style={{ fontSize: 13, color: "#6B7280" }}>Réflexion...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 16, backgroundColor: "white", borderTop: "1px solid #E5E7EB" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: isListening ? "#FEF2F2" : "#F3F4F6",
                  color: isListening ? "#EF4444" : "#4B5563",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <Mic size={18} className={isListening ? "animate-pulse" : ""} />
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Demandez-moi quelque chose..."
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 20,
                  border: "1px solid #E5E7EB",
                  outline: "none",
                  fontSize: 14,
                  backgroundColor: "#F9FAFB"
                }}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: inputText.trim() ? "#1F0270" : "#E5E7EB",
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: inputText.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s"
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1F0270, #3B12A6)",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 25px rgba(31,2,112,0.4)",
            cursor: "pointer",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
}
