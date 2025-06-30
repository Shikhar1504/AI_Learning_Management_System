# CourseCraft AI - AI-Powered Learning Management System

CourseCraft AI is a modern, AI-powered Learning Management System (LMS) that allows users to generate complete courses on any topic. It leverages Google's Gemini AI to create course outlines, detailed notes, flashcards, and quizzes, providing an interactive and engaging learning experience.

## ✨ Features

- **🤖 AI Course Generation:** Automatically generate comprehensive course structures, including summaries, chapters, and topics from a single user prompt.
- **📚 Detailed Chapter Notes:** AI-generated notes for each chapter with explanations, key points, and code examples.
- **🃏 Interactive Flashcards:** Reinforce learning with auto-generated flashcards for each course.
- **✍️ Quizzes:** Test your knowledge with quizzes generated for each course.
- **🔐 User Authentication:** Secure user authentication and management powered by Clerk.
- **🚀 Background Processing:** Asynchronous note generation using Inngest for a non-blocking user experience.
- **💳 Stripe Integration:** Monetize your platform with Stripe for course upgrades and premium features.
- **Modern UI:** Built with Next.js, Tailwind CSS, and Shadcn/ui for a beautiful and responsive user interface.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/)
- **Authentication:** [Clerk](https://clerk.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [Neon](https://neon.tech/) (PostgreSQL)
- **AI:** [Google Gemini](https://ai.google.dev/)
- **Background Jobs:** [Inngest](https://www.inngest.com/)
- **Payments:** [Stripe](https://stripe.com/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Neon](https://neon.tech/) account for the database.
- A [Clerk](https://clerk.com/) account for authentication.
- A [Google AI](https://ai.google.dev/) API key.
- An [Inngest](https://www.inngest.com/) account for background jobs.
- A [Stripe](https://stripe.com/) account for payments.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/coursecraft-ai.git
    cd coursecraft-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```env
    # Neon Database
    NEXT_PUBLIC_DATABASE_CONNECTION_STRING="..."

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
    CLERK_SECRET_KEY="..."
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="..."
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="..."
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="..."

    # Google Gemini AI
    NEXT_PUBLIC_GEMINI_API_KEY="..."

    # Stripe
    STRIPE_SECRET_KEY="..."
    NEXT_PUBLIC_STRIPE_PRICE_ID="..."
    STRIPE_WEB_HOOK_KEY="..."

    # Other
    HOST_URL="..."
    ```

4. **Run database migrations:**
    ```bash
    npx drizzle-kit push:pg
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Run Inngest Dev Server:**
    In a separate terminal, run:
    ```bash
    npx inngest-cli dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
.
├── app/                      # Next.js App Router directory
│   ├── (auth)/               # Authentication pages (Clerk)
│   ├── api/                  # API routes
│   ├── course/               # Course pages (notes, flashcards, quiz)
│   ├── create/               # Page for creating new courses
│   ├── dashboard/            # User dashboard
│   └── ...
├── components/               # Shared React components
├── configs/                  # Configuration files
├── inngest/                  # Inngest functions for background jobs
├── lib/                      # Library files and utilities
├── public/                   # Public assets
├── .env.local                # Environment variables (create this file)
├── drizzle.config.ts         # Drizzle ORM configuration
├── next.config.mjs           # Next.js configuration
└── package.json              # Project dependencies and scripts
```

## API Endpoints

The following are the main API endpoints:

-   `POST /api/generate-course-outline`: Triggers the AI to generate a course outline based on the user's prompt.
-   `POST /api/stripe/checkout-sessions`: Creates a Stripe checkout session for course upgrades.
-   `POST /api/inngest`: The endpoint for Inngest to handle background job events.

##  Roadmap

-   [ ] User profiles with course history
-   [ ] Gamification (badges, points)
-   [ ] Community features (forums, discussions)
-   [ ] More content types (videos, interactive exercises)
-   [ ] Admin dashboard for managing users and content

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
