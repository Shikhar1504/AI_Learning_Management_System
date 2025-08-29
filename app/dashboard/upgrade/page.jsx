"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import CheckIcon from "./_components/CheckIcon";

function Upgrade() {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    user && GetUserDetail();
  }, [user]);

  const GetUserDetail = async () => {
    const result = await db
      .select()
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

    setUserDetail(result[0]);
  };

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
      console.error("what the fuck , why is this error:", error);
    }
  };

  const onPaymentMange = async () => {
    const result = await axios.post("/api/payment/manage-payment", {
      customerId: userDetail?.customerId,
    });
    console.log(result.data);
    window.open(result.data?.url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <div className="bg-gradient-to-r from-purple-900 to-fuchsia-800 text-white py-12 px-4 mb-8">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="font-bold text-4xl md:text-5xl mb-4 font-poppins">Plans</h1>
            <p className="text-lg md:text-xl font-inter text-purple-100">
              Update your plan to generate unlimited courses for your learning journey
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
                  <strong className="text-4xl font-bold text-purple-800 font-poppins">$0</strong>
                  <span className="text-sm font-medium text-gray-500 ml-2">/month</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-purple-700">Perfect for casual learners</p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">10 Course Generate Per Day</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">Limited Support</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">Email support</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <CheckIcon className="text-purple-700" />
                  </div>
                  <span className="text-gray-700 font-inter">Help center access</span>
                </li>
              </ul>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4 font-inter">Current Plan</p>
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
                  <strong className="text-4xl font-bold text-purple-800 font-poppins">$5</strong>
                  <span className="text-sm font-medium text-gray-500 ml-2">/Monthly</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl mb-6">
                <p className="text-center text-sm text-purple-800">Unlimited access to all features</p>
              </div>

              <ul className="mt-6 space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">Unlimited Course Generate</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">Unlimited Flashcard, Quiz</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">Email support</span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="theme-gradient p-1 rounded-full">
                    <CheckIcon className="text-white" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">Help center access</span>
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
                onClick={onPaymentMange}
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
