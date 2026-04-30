"use client";
import { UserProfile } from "@clerk/nextjs";
import ProgressDashboard from "@/components/ui/progress-dashboard";
import { UserCircle, Shield, Settings, Activity } from "lucide-react";
import { useEffect } from "react";

function Profile() {
  // Use client-side code to hide the Clerk footer
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .cl-footer, .cl-branded-footer, .cl-development-mode, .cl-powered-by-clerk, .cl-powered-by-container {
        display: none !important;
      }
      .cl-profilePage {
        background-color: transparent !important;
      }
      .cl-navbar {
        border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      .cl-navbarButton {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      .cl-navbarButton:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
      .cl-pageScrollBox {
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">
            Profile Settings
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your account details and preferences.
          </p>
        </div>
      </div>

      {/* Top Row: Stats & Info */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-teal-500/15 transition-all duration-700" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 font-display">
            <Activity className="h-6 w-6 text-teal-400" />
            Learning Overview
          </h2>
          <div className="relative z-10">
            <ProgressDashboard />
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-500">
           <div className="absolute bottom-0 left-0 p-24 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/15 transition-all duration-700" />
           <Shield className="h-16 w-16 text-purple-400 mb-6 opacity-80 group-hover:scale-110 transition-transform duration-500 relative z-10" />
           <h3 className="text-xl text-white font-bold mb-3 relative z-10 font-display">Secure Account</h3>
           <p className="text-sm text-slate-400 relative z-10">
              Your data is protected by industry-standard encryption and managed securely.
           </p>
        </div>
      </div>
        
      {/* Bottom Row: Clerk User Profile */}
      <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative group">
        {/* Ambient Background */}
        <div className="absolute top-0 right-1/4 p-40 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 p-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

        <div className="p-4 md:p-8 relative z-10">
          <div className="flex justify-center w-full [&>.cl-rootBox]:w-full [&_.cl-card]:w-full [&_.cl-card]:max-w-none">
            <UserProfile 
              routing="hash" 
              appearance={{
                variables: {
                  colorBackground: 'transparent',
                  colorInputBackground: '#0B0F1A',
                  colorText: 'white',
                  colorTextSecondary: '#94a3b8',
                  colorPrimary: '#14b8a6',
                  colorInputText: 'white',
                  colorShadedBox: 'rgba(255, 255, 255, 0.05)',
                },
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full shadow-none bg-transparent rounded-none",
                  card: "bg-transparent shadow-none w-full max-w-none",
                  navbar: "hidden md:flex border-r border-white/5 bg-transparent",
                  navbarButton: "text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-xl",
                  headerTitle: "text-white font-display text-2xl",
                  headerSubtitle: "text-slate-400",
                  profileSectionTitle: "text-teal-400 border-b border-white/5 pb-2 font-display",
                  profileSectionContent: "text-slate-200",
                  profileSectionPrimaryButton: "text-teal-400 hover:text-teal-300 hover:bg-teal-400/10 transition-colors",
                  badge: "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm",
                  avatarImageActionsUpload: "text-teal-400",
                  formButtonPrimary: "bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all duration-300 rounded-lg",
                  formFieldInput: "bg-[#0B0F1A] border-white/10 text-white rounded-xl focus:border-teal-500 focus:ring-teal-500 shadow-inner",
                  formFieldLabel: "text-slate-400",
                  dividerLine: "bg-white/5",
                  dividerText: "text-slate-400",
                  scrollBox: "bg-transparent",
                  profilePage: "bg-transparent",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
