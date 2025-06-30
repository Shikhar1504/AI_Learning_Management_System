import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <div>
      <footer className="bg-gradient-to-r from-white to-primary text-primary py-16">
        <div className="container mx-auto px-6 sm:px-12 lg:px-16">
          <div className="lg:flex lg:justify-between items-center">
            {/* Left Side: Message */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h2 className="text-3xl font-semibold mb-4">
                Unlock Your Learning Potential
              </h2>
              <p className="text-lg leading-relaxed mb-6">
                Enter a topic and let our AI generate custom notes, flashcards,
                and quizzes just for you.
              </p>
            </div>

            {/* Right Side: Links */}
            <div className="lg:w-1/2 mt-8 lg:mt-0">
              <ul className="flex justify-center lg:justify-end gap-10">
                <li>
                  <a
                    className="text-white transition hover:text-gray-300"
                    href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    className="text-white transition hover:text-gray-300"
                    href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    className="text-white transition hover:text-gray-300"
                    href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  >
                    Projects
                  </a>
                </li>
                <li>
                  <a
                    className="text-white transition hover:text-gray-300"
                    href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  >
                    Blog
                  </a>
                </li>
              </ul>

              {/* Social Media Icons */}
              <div className="flex justify-end gap-7 mt-6">
                <a
                  href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  className="text-white hover:text-gray-300"
                >
                  <FaFacebookF size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  className="text-white hover:text-gray-300"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  className="text-white hover:text-gray-300"
                >
                  <FaInstagram size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/in/thanh-dat-vu-42b468286/"
                  className="text-white hover:text-gray-300"
                >
                  <FaLinkedinIn size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Copyright */}
        <p className="text-center text-sm mt-12 text-white">
          &copy; 2025 Thanh Dat Vu. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Footer;