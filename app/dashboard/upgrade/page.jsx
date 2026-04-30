"use client";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CheckIcon from "./_components/CheckIcon";

function Upgrade() {
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    GetUserDetail();
  }, []);

  const GetUserDetail = async () => {
    try {
      const response = await axios.get("/api/users/me");
      setUserDetail(response?.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setUserDetail(null);
    }
  };

  const OnCheckoutClick = async () => {
    try {
      const result = await axios.post("/api/payment/checkout", {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      });

      const checkoutUrl = result?.data?.url;
      if (!checkoutUrl) {
        throw new Error("Checkout URL not returned by server");
      }

      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Unable to open checkout. Please try again.");
    }
  };

  const onPaymentManage = async () => {
    try {
      const result = await axios.post("/api/payment/manage-payment", {
        customerId: userDetail?.customerId,
      });

      const manageUrl = result?.data?.url;
      if (!manageUrl) {
        throw new Error("Manage payment URL not returned by server");
      }

      window.open(manageUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening payment management:", error);
      toast.error("Unable to open subscription settings.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <div className="relative bg-[#111623]/50 border-b border-white/5 py-12 px-4 mb-8 overflow-hidden">
          <div className="absolute top-0 right-1/4 p-32 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 p-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="container relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="font-bold text-4xl md:text-5xl mb-4 font-display text-white">
              Plans
            </h1>
            <p className="text-lg md:text-xl text-slate-400">
              Update your plan to generate unlimited courses for your learning
              journey
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="rounded-3xl border border-white/5 bg-[#111623]/80 backdrop-blur-xl p-8 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-bl-lg">
                CURRENT PLAN
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white font-display">
                  Free Plan
                </h2>

                <p className="mt-4 flex items-center justify-center">
                  <strong className="text-4xl font-bold text-white font-display">
                    $0
                  </strong>
                  <span className="text-sm font-medium text-slate-400 ml-2">
                    /month
                  </span>
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-slate-300">
                  Perfect for casual learners
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-white/10 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-300">
                    10 Course Generate Per Day
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-white/10 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-300">
                    Limited Support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-white/10 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-300">
                    Email support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-white/10 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-300">
                    Help center access
                  </span>
                </li>
              </ul>

              <div className="text-center">
                <p className="text-sm text-slate-500 mb-4">
                  Current Plan
                </p>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border border-teal-500/30 bg-[#111623]/90 backdrop-blur-xl p-8 shadow-[0_0_30px_rgba(20,184,166,0.1)] hover:shadow-[0_0_40px_rgba(20,184,166,0.2)] hover:border-teal-500/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>

              <div className="text-center mb-6 relative z-10">
                <h2 className="text-xl font-bold text-white font-display">
                  Premium Plan
                </h2>

                <p className="mt-4 flex items-center justify-center">
                  <strong className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400 font-display">
                    $5
                  </strong>
                  <span className="text-sm font-medium text-slate-400 ml-2">
                    /Monthly
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-white/5 p-4 rounded-2xl mb-6 relative z-10">
                <p className="text-center text-sm text-teal-300">
                  Unlimited access to all features
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8 relative z-10">
                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-teal-500 to-purple-500 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-200 font-medium">
                    Unlimited Course Generate
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-teal-500 to-purple-500 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-200 font-medium">
                    Unlimited Flashcard, Quiz
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-teal-500 to-purple-500 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-200 font-medium">
                    Email support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-teal-500 to-purple-500 p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-slate-200 font-medium">
                    Help center access
                  </span>
                </li>
              </ul>

              <div className="text-center relative z-10">
                <Button
                  onClick={OnCheckoutClick}
                  className="w-full py-3 h-12 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 font-semibold"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>

          {userDetail?.customerId && (
            <div className="mt-8 text-center">
              <Button
                onClick={onPaymentManage}
                variant="outline"
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Manage Your Subscription
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Simple Footer Alternative */}
      <div className="mt-auto border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center py-6">
          <p className="text-sm text-muted-foreground">
            © 2025 LearnForge. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
