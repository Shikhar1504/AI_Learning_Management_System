import { SignUp } from '@clerk/nextjs'
import Image from "next/image";
import RiseLogo from "/public/RiseLogo.svg"; // Import the logo
import SignUpBg from "/public/signUpBg.jpg"; // Import the background image

export default function Page() {
  return (
    <div className="relative flex items-center justify-center h-screen">
      {/* Background image with blur effect */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={SignUpBg}
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="blur-md"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
        {/* Logo */}
        <Image
          src={RiseLogo}
          alt="Rise Logo"
          width={200}
          height={200}
          className="mb-6"
        />

        {/* SignIn component */}
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#44b4f1", // Theme color for primary elements
            },
            elements: {
              card: "shadow-lg border border-gray-200 rounded-lg", // Add styling to the sign-in card
              formButtonPrimary: "bg-[#44b4f1] hover:bg-[#3aa1d8] text-white", // Style primary buttons
            },
          }}
        />
      </div>
    </div>
  );
}