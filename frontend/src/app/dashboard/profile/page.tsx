"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
      } catch (err: any) {
        setError(err.message || "Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess(false);

    try {
      const data = await apiRequest("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password || undefined,
        }),
      });

      setProfile(data);
      setPassword(""); // Clear password field
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString() : "";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">My Account</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your study profile credentials, account login details, and preferences.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm flex items-start gap-3 max-w-xl mx-auto animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6">
        {/* User Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white text-2xl shadow-lg shadow-indigo-600/10 shrink-0">
            {(name || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">{name || "Student"}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> {email}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Member since: {joinDate}
            </p>
          </div>
        </div>

        {/* Update Form */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-6">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            Update Profile Information
          </h4>

          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Display Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  placeholder="•••••••• (Leave blank to keep current)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={updating}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving changes...
                </>
              ) : (
                <>
                  Save Changes <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
