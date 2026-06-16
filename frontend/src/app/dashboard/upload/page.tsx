"use client";

import { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface StudyDoc {
  id: number;
  filename: string;
  upload_status: "processing" | "completed" | "failed";
  upload_date: string;
}

export default function UploadPage() {
  const [documents, setDocuments] = useState<StudyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async (showSilently = false) => {
    if (!showSilently) setLoading(true);
    try {
      const data = await apiRequest("/api/documents");
      setDocuments(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load uploaded documents.");
    } finally {
      if (!showSilently) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for document processing status if any document is currently "processing"
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => doc.upload_status === "processing");
    if (!hasProcessingDocs) return;

    const interval = setInterval(() => {
      fetchDocuments(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await uploadFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === "application/pdf" || file.name.endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      setError("Please select only PDF files.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append("file", file);

        await apiRequest("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
      }
      
      // Refresh list
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to upload file(s).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this study document? This will remove all associated quizzes, summaries, and chat logs.")) return;
    
    try {
      await apiRequest(`/api/documents/${id}`, {
        method: "DELETE",
      });
      // Filter list
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Description */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Study Materials</h2>
        <p className="text-sm text-slate-400 mt-1">Upload and manage PDFs (e.g. course books, slide decks, lecture notes) to index them for AI study aids.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all relative overflow-hidden group ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/5 shadow-inner"
            : "border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 py-6">
          <div className={`p-4 rounded-full border transition-all ${
            dragActive 
              ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 scale-110" 
              : "bg-slate-950/60 border-slate-800 text-slate-400 group-hover:scale-105 group-hover:text-indigo-400 group-hover:border-indigo-500/25"
          }`}>
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="text-base font-bold text-slate-200">
              {uploading ? "Uploading files..." : "Drag & drop your PDFs here, or browse"}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Supports PDF notes, books, and handouts up to 50MB</p>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Uploaded Materials
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-xs font-semibold">
              {documents.length}
            </span>
          </h3>
          <button
            onClick={() => fetchDocuments()}
            className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 py-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-950/60 rounded-xl border border-slate-900 animate-pulse" />
            ))}
          </div>
        ) : documents.length > 0 ? (
          <div className="divide-y divide-slate-900">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate max-w-md sm:max-w-xl pr-2">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(doc.upload_date).toLocaleDateString()}
                      </span>
                      
                      {/* Status badge */}
                      {doc.upload_status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/10 text-green-400 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      )}
                      
                      {doc.upload_status === "processing" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/10 text-yellow-400 text-[10px] font-bold">
                          <Loader2 className="w-3 h-3 animate-spin" /> Indexing
                        </span>
                      )}
                      
                      {doc.upload_status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/10 text-red-400 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-3 rounded-xl border border-slate-900 hover:border-slate-850 hover:bg-red-950/20 hover:text-red-400 text-slate-500 transition-all shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/25">
            <UploadCloud className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No study materials uploaded yet</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
              Drag a PDF notes or slide file in the zone above to index it for AI summaries, chatting, and practice quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
