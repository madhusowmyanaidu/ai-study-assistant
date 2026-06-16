"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  MessageSquare,
  Brain,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText as SummaryIcon,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Activity {
  id: number;
  type: "upload" | "chat" | "quiz" | "summary";
  description: string;
  timestamp: string;
}

interface Stats {
  total_pdfs: number;
  total_questions: number;
  total_quizzes: number;
  recent_activities: Activity[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = await apiRequest("/api/auth/me");
        setUserName(user.name || user.email.split("@")[0]);
        
        const data = await apiRequest("/api/dashboard/stats");
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome Shimmer */}
        <div className="h-14 bg-slate-900/60 rounded-2xl w-2/3 animate-pulse" />
        
        {/* Stats Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-900 animate-pulse" />
          ))}
        </div>
        
        {/* Main Grid Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-slate-900/60 rounded-2xl border border-slate-900 animate-pulse" />
          <div className="h-[400px] bg-slate-900/60 rounded-2xl border border-slate-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-indigo-500/10 bg-gradient-to-r from-indigo-950/20 via-slate-900/50 to-slate-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{userName}</span>! <Sparkles className="w-5.5 h-5.5 text-indigo-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">Ready to tackle your study goals today? Choose an action below to get started.</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="sm:self-center px-4.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          Upload PDF <UploadCloud className="w-4.5 h-4.5" />
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Stats Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-850 hover:bg-slate-900/50 transition-all group relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total PDFs Uploaded</p>
              <h3 className="text-3xl font-extrabold text-white">{stats?.total_pdfs || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
          </div>
          <Link href="/dashboard/upload" className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            Manage files <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Chat Stats Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-850 hover:bg-slate-900/50 transition-all group relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Questions Asked</p>
              <h3 className="text-3xl font-extrabold text-white">{stats?.total_questions || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <Link href="/dashboard/chat" className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            Open Chat Room <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quiz Stats Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-850 hover:bg-slate-900/50 transition-all group relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quizzes Generated</p>
              <h3 className="text-3xl font-extrabold text-white">{stats?.total_quizzes || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
          </div>
          <Link href="/dashboard/quiz" className="mt-4 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
            Generate Quiz <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Shortcuts & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-4">Quick Study Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dashboard/chat"
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-indigo-500/20 transition-all flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                    Ask AI Questions <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ask specific questions and get immediate answers from your notes.</p>
                </div>
              </Link>

              <Link
                href="/dashboard/summaries"
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-pink-500/20 transition-all flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors flex items-center gap-1">
                    Summarize Chapter <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Get clean summaries with key themes and terms for faster recall.</p>
                </div>
              </Link>

              <Link
                href="/dashboard/quiz"
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-purple-500/20 transition-all flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-1">
                    Generate Practice Quiz <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Create multiple-choice quizzes to test your understanding before exams.</p>
                </div>
              </Link>

              <Link
                href="/dashboard/upload"
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-blue-500/20 transition-all flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                    Upload Study PDFs <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Add books, handouts, or notes to build your custom RAG knowledgebase.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right column - Recent Activity */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              Recent Activity
            </h3>
            
            {stats && stats.recent_activities.length > 0 ? (
              <div className="space-y-4 flex-1">
                {stats.recent_activities.map((activity, index) => {
                  let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/10";
                  let Icon = UploadCloud;
                  
                  if (activity.type === "chat") {
                    badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/10";
                    Icon = MessageSquare;
                  } else if (activity.type === "quiz") {
                    badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/10";
                    Icon = Brain;
                  } else if (activity.type === "summary") {
                    badgeColor = "bg-pink-500/10 text-pink-400 border-pink-500/10";
                    Icon = SummaryIcon;
                  }
                  
                  return (
                    <div key={index} className="flex gap-4 items-start p-3 rounded-xl border border-slate-900 bg-slate-950/20 hover:bg-slate-950/40 transition-colors">
                      <div className={`p-2.5 rounded-lg border ${badgeColor} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 leading-normal line-clamp-2">{activity.description}</p>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Clock className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No recent activity</p>
                <p className="text-xs text-slate-600 mt-1">Upload a PDF to start your session!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
