import { SignUp } from '@clerk/nextjs';
import { GraduationCap, Users, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import SignUpClientComponent from './page.client';

export default async function Page({ searchParams }) {
  // Await searchParams to properly access its properties
  const params = await searchParams;
  const isNewUser = params?.newUser === 'true';
  const message = params?.message;
  const email = params?.email;
  const error = params?.error;
  
  return (
    <SignUpClientComponent>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 sm:p-6 sm:py-12">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-pink-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row max-w-7xl w-full mx-auto gap-10 lg:gap-16 xl:gap-20 items-center justify-center">
          {/* Left Side - Branding */}
          <div className="flex-1 text-center lg:text-left space-y-6 lg:space-y-8 fade-in order-2 lg:order-1">
            {/* Logo */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary font-display">
                  LearnForge
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  AI Learning Platform
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 lg:mb-4 font-display leading-tight">
                  Start Your Learning Adventure
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md lg:max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Join our community of learners and unlock your potential with AI-powered courses.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 lg:space-y-4 pt-6 lg:pt-8">
                <div className="flex items-center gap-3 lg:gap-4 text-left">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Join 50,000+ Learners</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Thriving community of professionals</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 lg:gap-4 text-left">
                  <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Expert Instructors</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Learn from industry professionals</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 lg:gap-4 text-left">
                  <Zap className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">AI-Powered Learning</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Personalized content just for you</p>
                  </div>
                </div>
              </div>

              {/* Social Proof Stats */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 lg:p-6 mt-6 lg:mt-8">
                <div className="grid grid-cols-3 gap-3 lg:gap-4 text-center">
                  <div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">50K+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Students</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">1000+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Courses</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">95%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Sign Up Form */}
          <div className="w-full max-w-[350px] sm:max-w-[380px] md:max-w-[420px] lg:flex-shrink-0 order-1 lg:order-2 mx-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6 sm:p-7 w-full mx-auto flex flex-col items-center">
              <div className="text-center w-full mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {isNewUser || error ? "Complete Your Registration" : "Create Account"}
                </h2>
                <p className="text-sm text-white/80">
                  {(isNewUser || error) 
                    ? message || "Please complete your registration to access your account" 
                    : "Start your learning journey today"}
                </p>
                {error && (
                  <p className="text-sm text-red-400 mt-2">
                    Authentication error. Please complete registration.
                  </p>
                )}
              </div>
              
              <SignUp 
                appearance={{
                  variables: {
                    colorPrimary: "hsl(262 83% 58%)",
                    colorBackground: "transparent",
                    fontFamily: "Inter, system-ui, sans-serif",
                    borderRadius: "0.75rem",
                  },
                  elements: {
                    card: "shadow-none border-0 bg-transparent p-0",
                    header: "hidden",
                    socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-white font-medium h-10 px-4 rounded-lg w-full flex items-center justify-center text-sm",
                    socialButtons: "w-full grid gap-3 mb-4",
                    socialButtonsIconButton: "mr-2",
                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-11 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5",
                    formFieldInput: "bg-white/5 border border-white/20 focus:border-purple-500 focus:ring-purple-500 rounded-xl text-white placeholder:text-white/50 h-11",
                    formFieldLabel: "text-white font-medium",
                    footerActionLink: "text-purple-400 hover:text-purple-300 transition-colors font-medium",
                    dividerLine: "bg-white/20",
                    dividerText: "text-white/70",
                    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                    formFieldAction: "text-purple-400 hover:text-purple-300",
                    identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
                    formFieldSuccessText: "text-green-400",
                    formFieldErrorText: "text-red-400",
                    alertClerkError: "bg-red-500/10 border border-red-500/20 text-red-400",
                    footer: "text-white mt-4",
                    footerAction: "hidden",
                    footerActionText: "text-white",
                    poweredByClerk: "text-white",
                    poweredByClerkText: "text-white/70",
                    developmentModeWarning: "text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-4",
                    developmentModeWarningText: "text-amber-700 text-xs",
                  },
                }}
                fallbackRedirectUrl="/dashboard"
                signInUrl="/sign-in"
                signUpForceRedirectUrl="/dashboard"
                initialValues={email ? { emailAddress: email } : undefined}
              />

              {/* Terms Notice */}
              <div className="mt-6 text-center">
                <p className="text-xs text-white/70">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
              
              {/* Sign In Link */}
              <div className="mt-4 text-center border-t border-white/10 pt-4">
                <p className="text-sm text-white/70">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SignUpClientComponent>
  );
}