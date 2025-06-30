"use client";
import { UserProfile } from "@clerk/nextjs";

function Profile() {
  return (
    <div className="flex justify-center">
      <UserProfile routing="hash" />
    </div>
  );
}

export default Profile;
