"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Brain
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface StudyDoc {
  id: number;
  filename: string;
  upload_status: string;
}

interface Message {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<StudyDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | "">("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await apiRequest("/api/documents");
        // Only keep fully completed documents for chat
        const completedDocs = data.filter((d: StudyDoc) => d.upload_status === "completed");
        setDocuments(completedDocs);
        if (completedDocs.length > 0) {
          // Default to first document if available
          setSelectedDocId(completedDocs[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load study materials.");
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  // Load chat history when selected document changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedDocId === "") {
        setMessages([]);
        return;
      }
      setLoadingHistory(true);
      setError("");
      try {
        const history = await apiRequest(`/api/chat/history?document_id=${selectedDocId}`);
        setMessages(history);
      } catch (err: any) {
        setError(err.message || "Failed to load chat history.");
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedDocId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const queryText = input.trim();
    setInput("");
    setSending(true);
    setError("");

    try {
      const newMsg = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          document_id: selectedDocId || null,
          question: queryText,
        }),
      });
      setMessages(prev => [...prev, newMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to get response from assistant.");
    } finally {
      setSending(false);
    }
  };

  const activeDocName = documents.find(d => d.id === selectedDocId)?.filename || "General Assistant";

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Top Controller Bar */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">AI Study Assistant</h3>
            <p className="text-xs text-slate-500 mt-1">Chatting with: <span className="text-indigo-400 font-semibold">{activeDocName}</span></p>
          </div>
        </div>

        {/* Selector */}
        <div className="w-full sm:w-64">
          {loadingDocs ? (
            <div className="h-10 bg-slate-900/50 rounded-xl border border-slate-850 animate-pulse" />
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">General Chat (No PDF context)</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                {/* User query */}
                <div className="flex justify-end gap-3.5 pl-12">
                  <div className="p-4 rounded-2xl bg-indigo-600 border border-indigo-500 text-white text-sm font-semibold max-w-2xl rounded-tr-none shadow-md shadow-indigo-600/10">
                    <p className="whitespace-pre-line leading-relaxed">{msg.question}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 shrink-0 self-end">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {/* Assistant Answer */}
                <div className="flex gap-3.5 pr-12">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 self-end shadow-md shadow-indigo-600/10">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 text-slate-100 text-sm font-medium max-w-2xl rounded-tl-none leading-relaxed prose prose-invert">
                    <p className="whitespace-pre-line leading-relaxed">{msg.answer}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Sending Typist Bubble */}
            {sending && (
              <div className="flex gap-3.5 pr-12 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 self-end">
                  <Brain className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4.5 rounded-2xl bg-slate-950/40 border border-slate-900 text-slate-500 text-sm rounded-tl-none flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                  Thinking...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="p-4.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 mb-4 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-200">Start your study session!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
              {selectedDocId 
                ? `Ask any question about "${activeDocName}". The AI will use your PDF notes to construct detailed answers with citations.` 
                : "Select an uploaded PDF from the top right to enable semantic RAG search, or type a general query below."}
            </p>
          </div>
        )}
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-slate-950/40 flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedDocId ? `Ask about ${activeDocName}...` : "Type a study question..."}
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-slate-500 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/15 transition-all shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
