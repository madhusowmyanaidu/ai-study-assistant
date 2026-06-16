"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Download,
  BookOpen,
  RefreshCw,
  Plus
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface StudyDoc {
  id: number;
  filename: string;
  upload_status: string;
}

interface SummaryData {
  id: number;
  document_id: number;
  summary: string;
}

export default function SummariesPage() {
  const [documents, setDocuments] = useState<StudyDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | "">("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await apiRequest("/api/documents");
        const completedDocs = data.filter((d: StudyDoc) => d.upload_status === "completed");
        setDocuments(completedDocs);
        if (completedDocs.length > 0) {
          setSelectedDocId(completedDocs[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load study documents.");
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const loadSummary = async (docId: number) => {
    setLoadingSummary(true);
    setSummary(null);
    setError("");
    try {
      // Endpoint checks cache, generates if missing but wait!
      // To prevent generating automatically (which can block/slow down first load), 
      // our GET `/api/documents/{doc_id}/summary` actually generates if missing. That's fine! 
      // But let's check. Yes, that is how we coded main.py. It automatically checks and generates if missing.
      // So this is extremely seamless!
      const data = await apiRequest(`/api/documents/${docId}/summary`);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (selectedDocId !== "") {
      loadSummary(selectedDocId);
    } else {
      setSummary(null);
    }
  }, [selectedDocId]);

  const activeDocName = documents.find(d => d.id === selectedDocId)?.filename || "";

  // A simple markdown helper parser for rendering bold words (**word**) and bullet points (-) cleanly
  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} className="text-base font-extrabold text-white mt-5 mb-2.5">{parseBoldText(trimmed.replace("###", "").trim())}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} className="text-lg font-extrabold text-indigo-400 mt-6 mb-3">{parseBoldText(trimmed.replace("##", "").trim())}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={idx} className="text-xl font-extrabold text-white mt-8 mb-4 border-b border-slate-900 pb-2">{parseBoldText(trimmed.replace("#", "").trim())}</h2>;
      }
      
      // Bullets
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-slate-300 leading-relaxed mb-2">
            {parseBoldText(trimmed.substring(2))}
          </li>
        );
      }
      
      // Numbered items
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, "");
        return (
          <li key={idx} className="ml-5 list-decimal text-sm text-slate-300 leading-relaxed mb-2">
            {parseBoldText(content)}
          </li>
        );
      }
      
      // Empty line
      if (trimmed === "") {
        return <div key={idx} className="h-3.5" />;
      }
      
      // Regular Paragraph
      return <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-3.5">{parseBoldText(trimmed)}</p>;
    });
  };

  // Helper to parse **bold** tokens in text
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary.summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDocName.replace(".pdf", "")}_summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Study Summaries</h2>
          <p className="text-sm text-slate-400 mt-1">Get high-quality, structured takeaways from your PDF notes generated automatically by AI.</p>
        </div>

        {/* Selection */}
        <div className="w-full sm:w-64">
          {loadingDocs ? (
            <div className="h-11 bg-slate-900/60 rounded-xl border border-slate-850 animate-pulse" />
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">Select a document...</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Panel */}
      {selectedDocId === "" ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-400">No document selected</h4>
          <p className="text-xs text-slate-600 mt-1">Select an indexed PDF notes file from the top right to load or generate its study summary.</p>
        </div>
      ) : loadingSummary ? (
        <div className="p-12 text-center border border-slate-900 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-300">AI is reading the document...</p>
            <p className="text-xs text-slate-500 mt-1">This takes about 10-15 seconds to parse and structure into key concepts.</p>
          </div>
        </div>
      ) : summary ? (
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-6">
          {/* Summary Header Actions */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/10">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Summary Study Guide</h3>
                <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">{activeDocName}</p>
              </div>
            </div>
            
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/80 hover:bg-slate-900 hover:text-white text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-slate-950/15"
            >
              <Download className="w-3.5 h-3.5" /> Export Markdown
            </button>
          </div>

          {/* Formatted Text Box */}
          <div className="prose prose-invert max-w-none bg-slate-950/20 p-5 rounded-xl border border-slate-950/40">
            {renderFormattedSummary(summary.summary)}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-slate-900 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-slate-300">Create Study Summary</p>
            <p className="text-xs text-slate-500 mt-1">No summary has been generated for this document yet. Click generate below to build one.</p>
          </div>
          <button
            onClick={() => loadSummary(selectedDocId)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-pink-600/15 flex items-center gap-2"
          >
            Generate Summary <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
