"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  Brain,
  Cpu,
  Database,
  Layers,
  Network,
  RefreshCw,
  Search,
  Target,
  Menu,
  X,
  Activity,
  CheckCircle,
  ArrowRight,
  BookOpen,
  BarChart,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const OnCheckoutClick = async () => {
    try {
      // Log the priceId being sent
      console.log(
        "Requesting checkout with priceId:",
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      );

      const result = await axios.post("/api/payment/checkout", {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      });

      // Log the response from the server
      console.log("Received session from API:", result.data);

      // Open the Stripe checkout page URL
      window.open(result.data?.url);
    } catch (error) {
      // Log any error that occurs during the axios request
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 selection:bg-purple-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent py-6"}`}
      >
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 z-50">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 border border-white/10 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <Brain className="h-5 w-5 text-teal-400" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              LearnForge
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-lg transition-all backdrop-blur-sm"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-lg border border-white/10",
                    },
                  }}
                />
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all"
                >
                  Start Learning
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden relative z-50 text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-[#0B0F1A]/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center gap-8">
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-medium text-slate-300"
            >
              How it Works
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-medium text-slate-300"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-medium text-slate-300"
            >
              Pricing
            </Link>
            {isSignedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 px-8 py-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 px-8 py-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-teal-400" />
                Adaptive AI Platform
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                AI Learning That <br className="hidden lg:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400">
                  Adapts to You
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Generate courses, practice actively, and improve faster with an
                AI system that identifies and adapts to your weaknesses in
                real-time.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  href={isSignedIn ? "/dashboard" : "/sign-up"}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-[0_0_30px_rgba(20,184,166,0.3)] transition-all flex items-center justify-center gap-2 group"
                >
                  Start Learning
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Abstract AI Network Visualization */}
            <div className="flex-1 relative w-full h-[400px] lg:h-[500px] mx-auto lg:ml-auto perspective-1000">
              {/* Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full" />
              <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full animate-pulse" />
              <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-500/20 blur-[90px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

              {/* Floating Container */}
              <div className="absolute inset-0 flex items-center justify-center transform-style-3d animate-float">
                
                {/* Core Sphere */}
                <div className="absolute z-30 w-24 h-24 rounded-full bg-[#111623]/80 backdrop-blur-xl border border-teal-500/40 shadow-[0_0_40px_rgba(20,184,166,0.3)] flex items-center justify-center">
                  <Brain className="w-10 h-10 text-teal-400" />
                  <div className="absolute inset-0 rounded-full border border-teal-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                {/* Orbit 1 */}
                <div className="absolute z-20 w-48 h-48 rounded-full border border-white/5 animate-spin-slow">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Database className="w-3 h-3 text-purple-300" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Layers className="w-3 h-3 text-blue-300" />
                  </div>
                </div>

                {/* Orbit 2 */}
                <div className="absolute z-10 w-72 h-72 rounded-full border border-white/5 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}>
                  <div className="absolute top-1/4 -right-4 w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <Zap className="w-4 h-4 text-teal-300" />
                  </div>
                  <div className="absolute bottom-1/4 -left-4 w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <Activity className="w-4 h-4 text-pink-300" />
                  </div>
                </div>

                {/* Connecting Lines / Paths */}
                <svg className="absolute inset-0 w-full h-full opacity-30 z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 50 50 Q 75 25 100 50" fill="transparent" stroke="url(#gradient1)" strokeWidth="0.5" className="animate-pulse" />
                  <path d="M 50 50 Q 25 75 0 50" fill="transparent" stroke="url(#gradient2)" strokeWidth="0.5" className="animate-pulse" style={{ animationDelay: '1s' }} />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Glass Cards Floating */}
                <div className="absolute z-40 -right-4 top-1/4 w-32 h-16 bg-[#111623]/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col justify-center px-3 animate-bounce" style={{ animationDuration: '4s' }}>
                  <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2" />
                  <div className="w-1/2 h-2 bg-teal-500/40 rounded-full" />
                </div>

                <div className="absolute z-40 -left-8 bottom-1/4 w-28 h-20 bg-[#111623]/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col justify-center px-3 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                   <div className="w-full h-2 bg-purple-500/40 rounded-full mb-2" />
                   <div className="w-5/6 h-2 bg-white/20 rounded-full mb-2" />
                   <div className="w-4/6 h-2 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Stop Passive Learning - Psychology Section */}
      <section className="relative z-10 py-24 px-6 bg-[#0E1320]">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-block p-[1px] bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6">
            <div className="bg-[#0E1320] px-4 py-1.5 rounded-full text-red-400 text-sm font-semibold tracking-wide uppercase">
              The Problem
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
            Stop{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              Passive
            </span>{" "}
            Learning.
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-16">
            Most platforms just hand you content and hope you remember it.
            LearnForge forces active recall, evaluating your knowledge to fix
            gaps instantly.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-[#111623] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                1. Attempt
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Test your knowledge first. Find out what you actually do not
                know instead of passively reading.
              </p>
            </div>

            <div className="bg-[#111623] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                2. Feedback
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get instant, AI-driven evaluation on your answers and concepts
                to pinpoint exact misunderstandings.
              </p>
            </div>

            <div className="bg-gradient-to-b from-[#111623] to-teal-900/20 border border-teal-500/30 p-8 rounded-2xl relative shadow-[0_0_30px_rgba(20,184,166,0.1)] hover:border-teal-500/50 transition-colors group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-teal-400 mb-3 relative z-10">
                3. Improve
              </h3>
              <p className="text-teal-100/70 text-sm leading-relaxed relative z-10">
                Dynamic course material and quizzes generated specifically to
                rebuild your weak areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative z-10 py-24 px-6 bg-[#0B0F1A] border-y border-white/5"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From idea to mastery in a continuous, AI-driven loop.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting Line Desktop */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-teal-500/30" />

            {/* Step 1 */}
            <div className="relative bg-[#111623] border border-white/5 p-8 rounded-2xl text-center group hover:border-blue-500/30 transition-all">
              <div className="w-16 h-16 mx-auto bg-[#0B0F1A] border-2 border-blue-500/50 rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:bg-blue-500/10 transition-colors">
                <span className="text-xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Generate Course
              </h3>
              <p className="text-slate-400 text-sm">
                Enter any topic and instantly get a structured syllabus.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-[#111623] border border-white/5 p-8 rounded-2xl text-center group hover:border-purple-500/30 transition-all">
              <div className="w-16 h-16 mx-auto bg-[#0B0F1A] border-2 border-purple-500/50 rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:bg-purple-500/10 transition-colors">
                <span className="text-xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Learn with AI
              </h3>
              <p className="text-slate-400 text-sm">
                Read contextual study material and interactive flashcards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-[#111623] border border-white/5 p-8 rounded-2xl text-center group hover:border-pink-500/30 transition-all">
              <div className="w-16 h-16 mx-auto bg-[#0B0F1A] border-2 border-pink-500/50 rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:bg-pink-500/10 transition-colors">
                <span className="text-xl font-bold text-pink-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Take Quizzes
              </h3>
              <p className="text-slate-400 text-sm">
                Test your knowledge to expose your blind spots and weak areas.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-[#111623] border border-teal-500/20 p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(20,184,166,0.05)] group hover:border-teal-500/40 transition-all">
              <div className="w-16 h-16 mx-auto bg-teal-500/20 border-2 border-teal-500 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                <span className="text-xl font-bold text-teal-400">4</span>
              </div>
              <h3 className="text-xl font-semibold text-teal-400 mb-3">
                Improve Faster
              </h3>
              <p className="text-slate-300 text-sm">
                The system generates targeted remediation to fix your gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Adaptive Learning Loop */}
      <section className="relative z-10 py-24 px-6 bg-[#0E1320] border-t border-white/5 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              The Adaptive Learning Loop
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              How our system processes your inputs and continuously refines your learning path.
            </p>
          </div>

          <div className="relative glass-card bg-[#0B0F1A]/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/5 to-blue-500/5" />

            {/* Horizontal Flow Container */}
            <div className="relative w-full flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-2 z-10">
              
              {/* Animated Connector Line Behind (Desktop only) */}
              <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-blue-500/20 rounded-full z-0">
                 <div className="h-full w-1/4 bg-white/30 blur-sm rounded-full animate-pulse mx-auto"></div>
              </div>

              {/* Loop-back visual (Desktop only) */}
              <svg className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] w-[80%] h-32 -translate-y-[calc(50%+4rem)] pointer-events-none z-0" viewBox="0 0 100 50" preserveAspectRatio="none">
                <path d="M 95 50 C 95 0, 5 0, 5 50" fill="none" stroke="url(#loopGradient)" strokeWidth="0.5" strokeDasharray="2,2" className="animate-pulse" />
                <defs>
                  <linearGradient id="loopGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Node 1 */}
              <div className="relative z-10 bg-[#111623] border border-white/10 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-teal-500/50 transition-colors flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-white/5 flex items-center justify-center">
                  <Database className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-sm font-semibold text-white">Input</div>
                <div className="text-[10px] text-slate-400 mt-1">Topic / Goals</div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-slate-600 relative z-10 shrink-0" />

              {/* Node 2 */}
              <div className="relative z-10 bg-[#111623] border border-white/10 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-teal-500/50 transition-colors flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-white/5 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-sm font-semibold text-white">Generation</div>
                <div className="text-[10px] text-slate-400 mt-1">AI Syllabus</div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-slate-600 relative z-10 shrink-0" />

              {/* Node 3 */}
              <div className="relative z-10 bg-[#111623] border border-purple-500/30 rounded-xl p-4 flex flex-col items-center text-center shadow-[0_0_15px_rgba(168,85,247,0.1)] flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-white">Learning</div>
                <div className="text-[10px] text-purple-200/70 mt-1">Active Recall</div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-slate-600 relative z-10 shrink-0" />

              {/* Node 4 */}
              <div className="relative z-10 bg-[#111623] border border-pink-500/30 rounded-xl p-4 flex flex-col items-center text-center shadow-[0_0_15px_rgba(236,72,153,0.1)] flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-sm font-semibold text-white">Detection</div>
                <div className="text-[10px] text-pink-200/70 mt-1">Concept Gaps</div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-slate-600 relative z-10 shrink-0" />

              {/* Node 5 */}
              <div className="relative z-10 bg-[#111623] border border-blue-500/30 rounded-xl p-4 flex flex-col items-center text-center shadow-[0_0_15px_rgba(59,130,246,0.1)] flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm font-semibold text-white">RAG Cache</div>
                <div className="text-[10px] text-blue-200/70 mt-1">Exact Context</div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-slate-600 relative z-10 shrink-0" />

              {/* Node 6 */}
              <div className="relative z-10 bg-[#111623] border border-teal-500/50 rounded-xl p-4 flex flex-col items-center text-center shadow-[0_0_20px_rgba(20,184,166,0.15)] overflow-hidden group flex-1 w-full lg:w-auto">
                <div className="w-10 h-10 mb-3 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="text-sm font-semibold text-white">Remediation</div>
                <div className="text-[10px] text-teal-200/70 mt-1">Study Plans</div>
              </div>

            </div>
            
            {/* Mobile Loop-back indication */}
            <div className="mt-8 flex items-center justify-center gap-2 text-teal-400 text-sm font-medium lg:hidden">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              Loops continuously until mastery
            </div>

          </div>
        </div>
      </section>

      {/* Product Experience Section */}
      <section id="features" className="relative z-10 py-24 px-6 bg-[#0B0F1A]">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Inside the Learning Engine
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Powered by adaptive algorithms and real-time feedback loops to personalize every step of your journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Exp 1 */}
            <div className="bg-[#111623]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-sm group hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Dynamic Courses
                  </h3>
                </div>
                <p className="text-slate-400 text-sm mb-8">
                  Interactive, chapter-based navigation through AI-generated
                  syllabus tailored precisely to your goals.
                </p>
              </div>
              <div className="bg-[#0B0F1A] border border-white/5 rounded-xl p-5 h-32 flex flex-col justify-center gap-3">
                <div className="h-2.5 w-3/4 bg-slate-800 rounded"></div>
                <div className="h-2.5 w-full bg-slate-800 rounded"></div>
                <div className="h-2.5 w-5/6 bg-slate-800 rounded"></div>
              </div>
            </div>

            {/* Exp 2 */}
            <div className="bg-[#111623]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-sm group hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Layers className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Active Flashcards
                  </h3>
                </div>
                <p className="text-slate-400 text-sm mb-8">
                  Flip-card UI integrated with confidence scoring to help you
                  remember concepts using spaced repetition.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-[#0B0F1A] border border-purple-500/20 rounded-xl p-5 h-32 flex items-center justify-center relative overflow-hidden group-hover:border-purple-500/40 transition-colors">
                <p className="text-purple-300 font-medium">
                  What is Spaced Repetition?
                </p>
              </div>
            </div>

            {/* Exp 3 */}
            <div className="bg-[#111623]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-sm group hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-pink-500/10 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Validation Quizzes
                  </h3>
                </div>
                <p className="text-slate-400 text-sm mb-8">
                  Multiple-choice and short-answer evaluations that feed
                  directly into your personalized learning path.
                </p>
              </div>
              <div className="space-y-3">
                <div className="p-4 border border-pink-500/30 bg-pink-500/5 rounded-xl flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-pink-400"></div>
                  <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                </div>
                <div className="p-4 border border-white/5 bg-white/5 rounded-xl flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                  <div className="h-2 w-2/3 bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>

            {/* Exp 4 */}
            <div className="bg-[#111623]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-sm group hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-teal-500/10 rounded-xl">
                    <BarChart className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Weak Areas Tracker
                  </h3>
                </div>
                <p className="text-slate-400 text-sm mb-8">
                  Visual breakdown of your knowledge gaps with instant 1-click
                  actions to study and fix them.
                </p>
              </div>
              <div className="flex items-end gap-2 h-20 px-4">
                <div className="w-full bg-slate-800 rounded-t-sm h-[30%] hover:bg-slate-700 transition-colors"></div>
                <div className="w-full bg-slate-800 rounded-t-sm h-[80%] hover:bg-slate-700 transition-colors"></div>
                <div className="w-full bg-slate-800 rounded-t-sm h-[50%] hover:bg-slate-700 transition-colors"></div>
                <div className="w-full bg-slate-800 rounded-t-sm h-[60%] hover:bg-slate-700 transition-colors"></div>
                <div className="w-full bg-red-500/50 border-t-2 border-red-500 rounded-t-sm h-[20%] relative group-hover:h-[30%] transition-all"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Real Learning, Powered by AI */}
      <section className="relative z-10 py-24 px-6 bg-[#0E1320] border-t border-white/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Built for Real Learning, Powered by AI
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Behind the simple interface is a robust architecture designed for
              speed, accuracy, and true personalization.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Category 1: AI System */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">AI System</h3>
              </div>
              
              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  Retrieval-Augmented Generation
                </h4>
                <p className="text-slate-400 text-sm">Context-aware, grounded responses that prevent hallucinations.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Semantic Caching
                </h4>
                <p className="text-slate-400 text-sm">Instant responses powered by intelligent embedding-based caching.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  Adaptive Learning Loop
                </h4>
                <p className="text-slate-400 text-sm">System constantly evolves content based on your quiz performance.</p>
              </div>
            </div>

            {/* Category 2: Backend Engineering */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Backend Engineering</h3>
              </div>
              
              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  Async Processing (Inngest)
                </h4>
                <p className="text-slate-400 text-sm">Non-blocking background workflows for seamless course generation.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Reliable State Management
                </h4>
                <p className="text-slate-400 text-sm">Explicit lifecycles ensure data is never lost during processing.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  Retry & Fallback Logic
                </h4>
                <p className="text-slate-400 text-sm">Handles external AI failures gracefully to keep you learning.</p>
              </div>
            </div>

            {/* Category 3: Learning Experience */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                  <Target className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Learning Experience</h3>
              </div>
              
              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  Active Recall UX
                </h4>
                <p className="text-slate-400 text-sm">Answer first, then see explanation. Designed for true retention.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Weak Area Detection
                </h4>
                <p className="text-slate-400 text-sm">Automatically identifies concept gaps you didn&apos;t know you had.</p>
              </div>

              <div className="bg-[#111623]/50 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <h4 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Personalized Remediation
                </h4>
                <p className="text-slate-400 text-sm">Generates targeted study plans instantly to fix your specific gaps.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why LearnForge Actually Works */}
      <section className="relative z-10 py-24 px-6 bg-[#0B0F1A]">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Why LearnForge Actually Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center mt-16">
            {/* Most platforms */}
            <div className="bg-[#111623]/50 border border-white/5 p-8 rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4">
                  <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">THE OLD WAY</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 text-left">Most Platforms</h3>
              <div className="flex flex-col gap-4">
                  <div className="p-4 bg-[#0B0F1A] border border-white/5 rounded-xl text-slate-400 text-sm flex items-center gap-4">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                    Give you a wall of text to read
                  </div>
                  <div className="w-px h-6 bg-white/10 mx-auto"></div>
                  <div className="p-4 bg-[#0B0F1A] border border-white/5 rounded-xl text-slate-400 text-sm flex items-center gap-4">
                    <Target className="w-5 h-5 text-slate-500" />
                    Hope you remember it somehow
                  </div>
              </div>
            </div>

            {/* LearnForge */}
            <div className="bg-gradient-to-b from-teal-900/20 to-[#111623] border border-teal-500/30 p-8 rounded-3xl relative shadow-[0_0_30px_rgba(20,184,166,0.1)]">
              <div className="absolute top-0 right-0 p-4">
                  <span className="bg-teal-500/10 text-teal-400 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">THE LEARNING LOOP</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 text-left">LearnForge</h3>
              <div className="flex flex-col gap-2 relative z-10">
                  <div className="p-4 bg-[#0B0F1A]/80 backdrop-blur-sm border border-teal-500/20 rounded-xl text-white text-sm flex items-center gap-4">
                    <Target className="w-5 h-5 text-teal-400" />
                    <strong>1. Attempt</strong> — Active recall testing
                  </div>
                  <div className="w-px h-4 bg-teal-500/30 mx-auto"></div>
                  <div className="p-4 bg-[#0B0F1A]/80 backdrop-blur-sm border border-blue-500/20 rounded-xl text-white text-sm flex items-center gap-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <strong>2. Feedback</strong> — AI evaluates your gaps
                  </div>
                  <div className="w-px h-4 bg-purple-500/30 mx-auto"></div>
                  <div className="p-4 bg-[#0B0F1A]/80 backdrop-blur-sm border border-purple-500/20 rounded-xl text-white text-sm flex items-center gap-4">
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    <strong>3. Remediation</strong> — Targeted study plans
                  </div>
                  <div className="w-px h-4 bg-pink-500/30 mx-auto"></div>
                  <div className="p-4 bg-gradient-to-r from-teal-600 to-purple-600 rounded-xl text-white text-sm flex items-center justify-center font-bold shadow-lg">
                    Loop until mastery
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="relative z-10 py-24 px-6 bg-[#0B0F1A] border-t border-white/5"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Start learning today. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#111623] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-2">
                Free Plan
              </h3>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-400 mb-1">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-8 pb-8 border-b border-white/5">
                Perfect for trying out the core features and learning basics.
              </p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                  <span>10 generations per day</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                  <span>Access to dynamic courses</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                  <span>Basic performance tracking</span>
                </li>
              </ul>

              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-[#111623] border border-teal-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(20,184,166,0.1)] hover:shadow-[0_0_40px_rgba(20,184,166,0.2)] transition-all flex flex-col overflow-hidden transform md:-translate-y-2">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-teal-400 text-[#0B0F1A] text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 shadow-lg">
                MOST POPULAR
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 blur-[60px] pointer-events-none" />

              <h3 className="text-xl font-semibold text-teal-400 mb-2 relative z-10">
                Pro Learner
              </h3>
              <div className="flex items-end gap-2 mb-1 relative z-10">
                <span className="text-4xl font-bold text-white">$5</span>
                <span className="text-slate-400 mb-1">/month</span>
              </div>
              <div className="text-xs text-teal-400/80 mb-6 font-medium relative z-10">
                Less than a coffee ☕
              </div>
              <p className="text-slate-400 text-sm mb-8 pb-8 border-b border-white/5 relative z-10">
                Unlimited access to all advanced AI remediation features.
              </p>

              <ul className="space-y-4 mb-8 flex-1 relative z-10">
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-teal-400" />
                  <span>Unlimited generation capacity</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-teal-400" />
                  <span>Advanced adaptive remediation</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-teal-400" />
                  <span>Deep dive weak areas analytics</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-teal-400" />
                  <span>Priority AI processing</span>
                </li>
              </ul>

              <button
                onClick={OnCheckoutClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg transition-all text-center relative z-10"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6 bg-[#0B0F1A] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent" />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to learn{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-400">
              smarter?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join the platform that adapts to your unique learning style.
          </p>
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-up"}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white text-lg font-medium rounded-xl shadow-[0_0_40px_rgba(20,184,166,0.4)] transition-all transform hover:scale-105"
          >
            Start Learning Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0B0F1A] py-8 text-center text-slate-500 text-sm">
        <div className="container mx-auto">
          <p>
            © {new Date().getFullYear()} LearnForge Platform. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
