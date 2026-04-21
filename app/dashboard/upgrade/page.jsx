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
        <div className="bg-gradient-to-r from-purple-900 to-fuchsia-800 text-white py-12 px-4 mb-8">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="font-bold text-4xl md:text-5xl mb-4 font-poppins">
              Plans
            </h1>
            <p className="text-lg md:text-xl font-inter text-purple-100">
              Update your plan to generate unlimited courses for your learning
              journey
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="rounded-3xl border border-purple-200 bg-white p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                CURRENT PLAN
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
                  Perfect for casual learners
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">
                    10 Course Generate Per Day
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">
                    Limited Support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">
                    Email support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">
                    Help center access
                  </span>
                </li>
              </ul>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4 font-inter">
                  Current Plan
                </p>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border border-purple-300 bg-gradient-to-b from-white to-purple-50 p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 theme-gradient text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
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
                    /Monthly
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-purple-800">
                  Unlimited access to all features
                </p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Unlimited Course Generate
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Unlimited Flashcard, Quiz
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Email support
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">
                    Help center access
                  </span>
                </li>
              </ul>

              <div className="text-center">
                <Button
                  onClick={OnCheckoutClick}
                  className="w-full py-3 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
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
