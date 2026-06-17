// redeploy test

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Brain, MessageSquare, ShieldCheck, ArrowRight, Menu, X, FileText } from "lucide-react";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col justify-between">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Study<span className="text-indigo-400">Sphere</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center gap-1.5"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Btn */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-lg hover:bg-slate-900 transition-colors text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-900 bg-slate-950 px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-2 text-base font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-2 text-base font-medium transition-colors"
            >
              How it Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-2 text-base font-medium transition-colors"
            >
              FAQ
            </a>
            <hr className="border-slate-900 my-2" />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Empowering Students with AI
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-none mb-6">
            Supercharge Your Studies with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Study Assistant
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
            Upload your PDF notes and books, interact with an intelligent RAG chatbot, auto-generate structured summaries, and test your knowledge with customized AI quizzes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-base transition-all duration-300 flex items-center justify-center"
                >
                  Watch Demo
                </Link>
              </>
            )}
          </div>

          {/* Interactive Mockup */}
          <div className="mt-20 relative max-w-5xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-900/20 p-4 backdrop-blur-sm shadow-2xl shadow-indigo-500/5">
            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-2xl pointer-events-none" />
            <div className="aspect-video w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-850 flex flex-col p-4">
              {/* Mock Browser Header */}
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="w-40 h-4.5 rounded bg-slate-900 ml-4" />
              </div>
              {/* Mock Content */}
              <div className="flex-1 grid grid-cols-3 gap-4 text-left">
                <div className="col-span-1 border-r border-slate-900 pr-4 flex flex-col gap-3">
                  <div className="h-6 w-3/4 bg-slate-900 rounded" />
                  <div className="h-4.5 w-full bg-slate-900/50 rounded" />
                  <div className="h-4.5 w-5/6 bg-slate-900/50 rounded" />
                  <div className="h-10 w-full bg-indigo-600/20 border border-indigo-500/35 rounded-lg flex items-center px-3 gap-2 mt-auto">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div className="h-3.5 w-24 bg-indigo-400/30 rounded" />
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-4 pl-2">
                  <div className="h-8 w-2/3 bg-slate-900 rounded" />
                  <div className="flex-1 bg-slate-900/30 rounded-lg p-4 flex flex-col gap-3 border border-slate-900/60">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800" />
                      <div className="h-10 w-4/5 bg-slate-800 rounded-lg rounded-tl-none" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="h-14 w-3/4 bg-indigo-600/30 border border-indigo-500/25 rounded-lg rounded-tr-none" />
                      <div className="w-6 h-6 rounded-full bg-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-900">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Everything you need to master your courses
            </h2>
            <p className="text-lg text-slate-400">
              StudySphere converts raw textbooks and notes into active learning resources in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-200">PDF Uploads</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Drag-and-drop multiple PDF files. We instantly parse, extract, and index the text for secure study access.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-200">AI Chat & RAG</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ask the AI anything about your document. It fetches matching text to write accurate answers with page citations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-200">Auto Summary</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transform long, tedious chapters into structured summaries with core points, takeaways, and definitions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-200">Quiz Generator</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate custom multiple-choice tests with answer keys and complete explanations to evaluate your progress.
              </p>
            </div>
          </div>
        </section>

        {/* Security / Quality Section */}
        <section className="bg-slate-900/30 py-20 border-y border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
                <ShieldCheck className="w-5 h-5" /> Enterprise-grade Privacy
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                Your study materials are completely secure.
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Your files are indexed and queried in isolated sandboxes. We never share your data or use your private textbooks to train public models.
              </p>
            </div>
            <div className="flex gap-8 items-center bg-slate-950 p-8 rounded-2xl border border-slate-800/60 shadow-xl max-w-md w-full">
              <div className="text-center flex-1 border-r border-slate-900 py-2">
                <div className="text-3xl font-extrabold text-white">99.8%</div>
                <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">Uptime</div>
              </div>
              <div className="text-center flex-1 border-r border-slate-900 py-2">
                <div className="text-3xl font-extrabold text-white">&lt;2s</div>
                <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">RAG Answer</div>
              </div>
              <div className="text-center flex-1 py-2">
                <div className="text-3xl font-extrabold text-white">100%</div>
                <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">Secure</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-white text-base">StudySphere</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} StudySphere. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
