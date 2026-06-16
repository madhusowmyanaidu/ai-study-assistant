"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Database,
  Moon,
  Save
} from "lucide-react";

export default function SettingsPage() {
  const [apiEndpoint, setApiEndpoint] = useState("http://localhost:8000");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("api_endpoint") || "http://localhost:8000";
      setApiEndpoint(stored);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    if (!apiEndpoint.trim().startsWith("http://") && !apiEndpoint.trim().startsWith("https://")) {
      setError("API Endpoint must start with http:// or https://");
      return;
    }

    try {
      localStorage.setItem("api_endpoint", apiEndpoint.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to save configuration settings.");
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your local study preferences and cache? This won't delete data on the server, but will reset your active frontend endpoint configuration.")) {
      localStorage.removeItem("api_endpoint");
      setApiEndpoint("http://localhost:8000");
      alert("Local study preferences reset to defaults.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Application Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure development settings, API connections, and clean local browser caching preferences.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm flex items-start gap-3 max-w-xl mx-auto">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6">
        {/* Connection Settings */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" /> API Connection Config
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">FastAPI Backend URL</label>
              <input
                type="text"
                required
                placeholder="http://localhost:8000"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                Enter the absolute address where your FastAPI python backend service is running. Defaults to http://localhost:8000.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Save Endpoint <Save className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Display Settings */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5">
            <Moon className="w-5 h-5 text-purple-400" /> Theme Configuration
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-950/40 bg-slate-950/20">
            <div>
              <span className="text-sm font-bold text-slate-200 block">Dark Mode</span>
              <span className="text-xs text-slate-500 mt-0.5 block">Deep space theme (default option enabled)</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-extrabold">
              Active
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 sm:p-8 rounded-2xl border border-red-500/10 bg-red-950/5 backdrop-blur-md space-y-5">
          <h3 className="text-base font-bold text-red-400 flex items-center gap-2.5">
            <Trash2 className="w-5 h-5" /> Danger Zone
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-red-500/10 bg-red-950/10">
            <div>
              <span className="text-sm font-bold text-red-300 block">Reset Study Preferences</span>
              <span className="text-xs text-red-500/70 mt-0.5 block">Clear local browser endpoints and preference caches.</span>
            </div>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 rounded-xl bg-red-950 border border-red-900 hover:bg-red-900 hover:text-white text-red-400 text-xs font-bold transition-all shrink-0"
            >
              Reset Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
