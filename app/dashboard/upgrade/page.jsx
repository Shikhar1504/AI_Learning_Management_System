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
    <div>
      <header className="font-medium text-3xl">Plans</header>
      <p>Update your plan to generate unlimted courses for your exam</p>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid md:grid-cols-2 md:gap-7 sm:grid-cols-1 sm:items-center sm:gap-4">
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm sm:px-8 lg:p-12">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Free
                <span className="sr-only">Plan</span>
              </h2>

              <p className="mt-2 sm:mt-4">
                <strong className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {" "}
                  0${" "}
                </strong>

                <span className="text-sm font-medium text-gray-700">
                  /month
                </span>
              </p>
            </div>

            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700">
                  {" "}
                  10 Course Generate Per Day{" "}
                </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700"> Limited Support </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700"> Email support </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700"> Help center access </span>
              </li>
            </ul>

            <Button variant="ghost" className="w-full mt-5 text-primary">
              Current Plan
            </Button>
          </div>
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm sm:px-8 lg:p-12">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Montly
                <span className="sr-only">Plan</span>
              </h2>

              <p className="mt-2 sm:mt-4">
                <strong className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {" "}
                  5${" "}
                </strong>

                <span className="text-sm font-medium text-gray-700">
                  /Montly
                </span>
              </p>
            </div>

            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700">
                  {" "}
                  Unlimted Course Generate{" "}
                </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700">
                  {" "}
                  Unlimted Flashcard, Quiz{" "}
                </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700"> Email support </span>
              </li>

              <li className="flex items-center gap-1">
                <CheckIcon />
                <span className="text-gray-700"> Help center access </span>
              </li>
            </ul>

            {userDetail?.isMember == false ? (
              <Button onClick={OnCheckoutClick} className="w-full mt-5">
                Get Started
              </Button>
            ) : (
              <Button onClick={onPaymentMange} className="w-full mt-5">
                Manage Payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
