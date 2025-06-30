"use client";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useEffect } from "react";

function Provider({ children }) {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      console.log("User found:", user);
      CheckIsNewUser();
    }
  }, [user]);
  //If the user becomes available (i.e., the user logs in), the effect will run, triggering the CheckIsNewUser() function.

  {
    /*High-Level Flow Overview
    Frontend (provider.js): Checks if the user is logged in and triggers a POST request to an API endpoint.
    API Endpoint (/api/create-user/route.js): Receives the user data from the frontend, fires an event (user.create) using Inngest.
    Inngest Function (CreateNewUser): Listens for the user.create event, checks the database for the user, and adds them to the database if they don’t exist.
    */
  }
  const CheckIsNewUser = async () => {
    const resp = await axios.post("/api/create-user", { user: user }); //is a method used to send data to a server via an HTTP POST request.
    console.log(resp.data);
  };

  return <>{children}</>; //This will render whatever child components (like pages) are passed to the Provider component.
}

export default Provider;
