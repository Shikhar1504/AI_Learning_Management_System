"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  Award,
  BookOpen,
  Brain,
  Clock,
  GraduationCap,
  Menu,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn, user } = useUser();

  const OnCheckoutClick = async () => {
    try {
      // Log the priceId being sent
      console.log(
        "Requesting checkout with priceId:",
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
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
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                <GraduationCap className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold text-gradient-primary font-display">
                  LearnForge
                </span>
                <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                  AI Learning Platform
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center justify-center gap-4">
              {isSignedIn && (
                <Link
                  href="/dashboard"
                  className="btn-secondary h-9 px-4 flex items-center justify-center"
                >
                  Dashboard
                </Link>
              )}
              {isSignedIn ? (
                <div className="ml-2">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox:
                          "h-9 w-9 rounded-xl border-2 border-purple-400/50 hover:border-purple-400 transition-all shadow-lg",
                        userButtonPopoverCard:
                          "glass-card border border-white/20",
                        userButtonPopoverActionButton: "hover:bg-white/10",
                      },
                    }}
                  />
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="btn-primary h-9 px-4 flex items-center justify-center"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              {isSignedIn && (
                <div className="ml-2">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox:
                          "h-8 w-8 rounded-xl border-2 border-purple-400/50 hover:border-purple-400 transition-all shadow-lg",
                        userButtonPopoverCard:
                          "glass-card border border-white/20",
                        userButtonPopoverActionButton: "hover:bg-white/10",
                      },
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden glass-card border-t border-white/10 py-4 space-y-2">
              <Link
                href="#features"
                className="block text-muted-foreground hover:text-foreground transition-colors py-3 px-4"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="block text-muted-foreground hover:text-foreground transition-colors py-3 px-4"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                className="block text-muted-foreground hover:text-foreground transition-colors py-3 px-4"
              >
                Pricing
              </Link>
              {isSignedIn && (
                <Link
                  href="/dashboard"
                  className="block text-muted-foreground hover:text-foreground transition-colors py-3 px-4"
                >
                  Dashboard
                </Link>
              )}
              {!isSignedIn && (
                <div className="px-4 pt-2">
                  <Link
                    href="/sign-in"
                    className="btn-primary px-6 text-center block"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-5 lg:py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 fade-in">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-purple-400/20">
                <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-sm font-medium text-purple-400">
                  AI-Powered Learning
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="text-white">Transform Learning with</span>
                  <span className="text-gradient-primary block mt-2">
                    AI-Powered Education
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Experience the future of education with personalized AI
                  courses, interactive study materials, and adaptive learning
                  paths designed specifically for your success.
                </p>

                {/* Key Benefits */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white">
                    <Sparkles className="h-4 w-4 mr-1.5 text-purple-400" />
                    Smart Learning
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white">
                    <Target className="h-4 w-4 mr-1.5 text-blue-400" />
                    Adaptive Content
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white">
                    <Award className="h-4 w-4 mr-1.5 text-green-400" />
                    Proven Methods
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-transform"
                  >
                    <span className="truncate">Start Learning Free</span>
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="btn-primary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-transform"
                  >
                    <span className="truncate">Sign In to Start</span>
                  </Link>
                )}
                <Link
                  href="#how-it-works"
                  className="btn-secondary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-transform"
                >
                  <span className="truncate">Working</span>
                </Link>
              </div>
            </div>

            {/* Right Content */}
            <div
              className="flex-1 relative scale-in"
              style={{ animationDelay: "300ms" }}
            >
              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-2xl animate-pulse" />
                <div className="absolute top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" />

                {/* Main Visual Container */}
                <div className="relative modern-card p-6 sm:p-6 lg:p-8">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-blue-500/10 relative min-h-[200px] sm:min-h-[320px]">
                    {/* Floating Elements */}
                    <div
                      className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 floating"
                      style={{ animationDelay: "0s" }}
                    >
                      <BookOpen className="h-5 w-5 sm:h-5 sm:w-5 text-purple-400" />
                    </div>
                    <div
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 floating"
                      style={{ animationDelay: "1s" }}
                    >
                      <Target className="h-5 w-5 sm:h-5 sm:w-5 text-blue-400" />
                    </div>
                    <div
                      className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 floating"
                      style={{ animationDelay: "2s" }}
                    >
                      <Award className="h-5 w-5 sm:h-5 sm:w-5 text-green-400" />
                    </div>

                    {/* Central Content */}
                    <div className="flex items-center justify-center h-full p-6">
                      <div className="text-center space-y-4 sm:space-y-4 w-full max-w-[420px] sm:max-w-sm">
                        <div className="w-20 h-20 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl glow-pulse">
                          <Brain className="h-10 w-10 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <div className="space-y-3 sm:space-y-3">
                          <h3 className="text-xl sm:text-xl font-semibold text-foreground">
                            AI Learning Engine
                          </h3>
                          <p className="text-sm sm:text-sm text-muted-foreground px-2">
                            Creating your personalized course...
                          </p>
                          <div className="w-40 sm:w-40 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[width_2s_ease-in-out_infinite]"
                              style={{ width: "85%" }}
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-xs">Processing with AI</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 slide-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to transform your learning experience with
              AI-powered education
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid gap-8 lg:gap-12 md:grid-cols-3 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-24 left-[calc(16.67%+4rem)] right-[calc(16.67%+4rem)] h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 z-0" />

            {/* Step 1 */}
            <div
              className="modern-card-interactive text-center relative z-10"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Define Your Goals
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tell us what you want to learn, your current knowledge level,
                  and your learning preferences. Our AI analyzes your needs to
                  create a personalized plan.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className="modern-card-interactive text-center relative z-10"
              style={{ animationDelay: "400ms" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  AI Content Creation
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our advanced AI generates comprehensive study materials
                  including interactive lessons, flashcards, practice questions,
                  and visual aids tailored to your learning style.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className="modern-card-interactive text-center relative z-10"
              style={{ animationDelay: "500ms" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Award className="h-8 w-8 text-green-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Track & Improve
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Study at your own pace with our intuitive interface. Our AI
                  continuously adapts to your progress, focusing on areas that
                  need improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl backdrop-blur-sm" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-7xl relative">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need for an effective and engaging learning
              experience
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Personalized Courses
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Custom learning paths designed specifically for your goals and
                learning style with AI-generated content.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "200ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Interactive Flashcards
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Memorize key concepts with smart flashcards that adapt to your
                knowledge level and learning pace.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Adaptive Quizzes
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Test your knowledge with quizzes that focus on your weak areas
                and reinforce learning effectively.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "400ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Progress Tracking
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Monitor your learning journey with detailed analytics and
                performance insights in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "500ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Tutoring
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Get instant help and explanations when you're stuck on difficult
                concepts with our AI assistant.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className="modern-card-interactive h-full min-h-[280px] flex flex-col"
              style={{ animationDelay: "600ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Community Learning
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                Connect with fellow learners, share knowledge, and collaborate
                on challenging topics together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display">
              Choose Your Plan
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and upgrade when you're ready. No hidden fees, cancel
              anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-3xl border border-purple-200 bg-white p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                FREE FOREVER
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-poppins">
                  Free Plan
                </h2>

                <p className="mt-4 flex items-center justify-center">
                  <strong className="text-4xl font-bold text-purple-800 font-poppins">
                    $0
                  </strong>
                  <span className="text-sm font-medium text-gray-500 ml-2">
                    /month
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-purple-700">
                  Perfect for getting started
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter">
                    10 Courses Per Day
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter">
                    Basic Support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter">
                    Email Support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter">
                    Help Center Access
                  </span>
                </li>
              </ul>

              <div className="text-center">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
                  >
                    Get Started Free
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
                  >
                    Sign In to Start
                  </Link>
                )}
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border border-purple-300 bg-gradient-to-b from-white to-purple-50 p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-poppins">
                  Premium Plan
                </h2>

                <p className="mt-4 flex items-center justify-center">
                  <strong className="text-4xl font-bold text-purple-800 font-poppins">
                    $5
                  </strong>
                  <span className="text-sm font-medium text-gray-500 ml-2">
                    /month
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-purple-800">
                  Unlimited access to everything
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Unlimited Course Generation
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Unlimited Flashcards & Quizzes
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Priority Email Support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Advanced Analytics
                  </span>
                </li>
              </ul>

              <div className="text-center">
                {isSignedIn ? (
                  <button
                    onClick={OnCheckoutClick}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Upgrade to Premium
                  </button>
                ) : (
                  <Link
                    href="/sign-in"
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 inline-block text-center"
                  >
                    Sign In to Upgrade
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="modern-card p-8 lg:p-12 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

            <div className="relative space-y-8 fade-in">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-display">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Join thousands of students who are already experiencing the
                  future of education with our AI-powered learning platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-all group"
                  >
                    <span>Start Learning Now</span>
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="btn-primary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-all group"
                  >
                    <span>Sign In to Start</span>
                  </Link>
                )}
                <Link
                  href="#pricing"
                  className="btn-secondary  px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap hover:scale-105 transition-all group"
                >
                  <span>View Pricing</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 pt-8 opacity-60">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">Trusted Platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium">Growing Community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium">Quality Content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - CareMeet Style */}
      <footer className="glass-card border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Made with love text */}
            <div className="flex items-center gap-3 text-muted-foreground text-lg font-large min-h-[2rem] h-8">
              <span className="flex items-center h-full">Made with</span>
              <svg
                className="w-6 h-6 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex items-center h-full">by Shikhar</span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-6 min-h-[2rem] h-8">
              {/* GitHub */}
              <a
                href="#"
                className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center h-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="#"
                className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center h-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center h-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Website/Globe */}
              <a
                href="#"
                className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center h-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
