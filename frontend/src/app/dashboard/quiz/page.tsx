"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  AlertCircle,
  Loader2,
  Sparkles,
  Award,
  CheckCircle,
  XCircle,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface StudyDoc {
  id: number;
  filename: string;
  upload_status: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface QuizData {
  id: number;
  title: string;
  quiz_data: QuizQuestion[];
  score: number | null;
}

export default function QuizPage() {
  const [documents, setDocuments] = useState<StudyDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | "">("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Quiz config state
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  // Active quiz state
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [score, setScore] = useState(0);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<number, boolean>>({});

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !title.trim() || generating) return;

    setGenerating(true);
    setError("");
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);

    try {
      const data = await apiRequest("/api/quizzes/generate", {
        method: "POST",
        body: JSON.stringify({
          document_id: selectedDocId,
          title: title.trim(),
          num_questions: numQuestions,
        }),
      });
      setQuiz(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (quizCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.quiz_data.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate score and complete
      handleSubmitQuiz();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setSubmittingScore(true);
    
    // Calculate score
    let correctCount = 0;
    quiz.quiz_data.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / quiz.quiz_data.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);

    try {
      await apiRequest(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ score: finalScore }),
      });
    } catch (err: any) {
      console.error("Failed to save quiz score:", err);
    } finally {
      setSubmittingScore(false);
    }
  };

  const toggleExplanation = (idx: number) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const startNewQuiz = () => {
    setQuiz(null);
    setTitle("");
    setQuizCompleted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Interactive Quizzes</h2>
        <p className="text-sm text-slate-400 mt-1">Test your recall of core syllabus notes using dynamic multiple choice quizzes generated on-demand by AI.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {generating ? (
        <div className="p-12 text-center border border-slate-900 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-300">Analyzing notes and generating questions...</p>
            <p className="text-xs text-slate-500 mt-1">AI is reading the document, writing questions, and formatting multiple-choice options.</p>
          </div>
        </div>
      ) : !quiz ? (
        /* Quiz Config Form */
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md max-w-xl mx-auto space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-indigo-400" /> Create a Practice Quiz
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quiz Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 4: Genetics & Cell Biology"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm font-medium hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Document Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Study Document</label>
              {loadingDocs ? (
                <div className="h-11 bg-slate-950 rounded-xl border border-slate-900 animate-pulse" />
              ) : (
                <select
                  required
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">Choose a PDF...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Number of questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={7}>7 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedDocId || !title.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-850 disabled:to-purple-850 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
            >
              Generate Quiz <Sparkles className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : !quizCompleted ? (
        /* Quiz Active Test Taking Card */
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header Progress info */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Quiz: <span className="text-indigo-400">{quiz.title}</span></span>
            <span className="font-bold text-slate-300">
              Question {currentQuestionIndex + 1} of {quiz.quiz_data.length}
            </span>
          </div>
          
          <div className="w-full bg-slate-900 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.quiz_data.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {quiz.quiz_data[currentQuestionIndex].question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {quiz.quiz_data[currentQuestionIndex].options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-semibold transition-all border outline-none ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-inner"
                        : "bg-slate-950/45 border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 mt-0.5 ${
                        isSelected 
                          ? "bg-indigo-500 border-indigo-500 text-white" 
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:text-white disabled:opacity-0 text-slate-400 font-semibold text-sm transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIndex]}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              {currentQuestionIndex === quiz.quiz_data.length - 1 ? "Submit Exam" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Completed Results panel */
        <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />
            <Award className="w-14 h-14 text-indigo-400 mx-auto animate-bounce" />
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">Quiz Completed!</h3>
              <p className="text-sm text-slate-400 mt-1">Practice quiz: <span className="text-indigo-400 font-semibold">{quiz.title}</span></p>
            </div>
            
            <div className="inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-900 w-44">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Your Score</span>
              <span className={`text-4xl font-extrabold mt-1.5 ${score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                {score}%
              </span>
            </div>

            <div>
              <button
                onClick={startNewQuiz}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
              >
                Create Another Quiz
              </button>
            </div>
          </div>

          {/* Detailed Review Section */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-900 pb-3">Answer Key & Review</h3>
            <div className="space-y-6 divide-y divide-slate-900">
              {quiz.quiz_data.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.answer;
                const isExpanded = !!expandedExplanation[idx];

                return (
                  <div key={idx} className="pt-5 first:pt-0 space-y-3">
                    <div className="flex items-start gap-3 justify-between">
                      <h4 className="text-sm font-bold text-slate-200 leading-relaxed max-w-xl">
                        {idx + 1}. {q.question}
                      </h4>
                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/10 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/10 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
                        <span className="text-slate-500 font-semibold uppercase block mb-1">Your Answer</span>
                        <span className={isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{userAns}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
                        <span className="text-slate-500 font-semibold uppercase block mb-1">Correct Answer</span>
                        <span className="text-green-400 font-bold">{q.answer}</span>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="space-y-1">
                        <button
                          onClick={() => toggleExplanation(idx)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Hide Explanation <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              View Explanation <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 text-xs text-slate-400 leading-relaxed animate-in slide-in-from-top-1 duration-200">
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
