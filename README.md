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

- **Framework:** [Next.js](https://nextjs.org/) v15.1.6
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v3.4.1
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/)
- **Authentication:** [Clerk](https://clerk.com/) v6.10.1
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) v0.38.4
- **Database:** [Neon](https://neon.tech/) (PostgreSQL)
- **AI:** [Google Gemini](https://ai.google.dev/) v0.8.0
- **Background Jobs:** [Inngest](https://www.inngest.com/) v3.30.0
- **Payments:** [Stripe](https://stripe.com/) v17.7.0

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Neon](https://neon.tech/) account for the PostgreSQL database
- A [Clerk](https://clerk.com/) account for authentication
- A [Google AI](https://ai.google.dev/) API key
- An [Inngest](https://www.inngest.com/) account for background jobs
- A [Stripe](https://stripe.com/) account for payments

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Shikhar1504/AI_Learning_Management_System.git
    cd AI_Learning_Management_System
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
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
    CLERK_WEBHOOK_SECRET="..."

    # Google Gemini AI
    NEXT_PUBLIC_GEMINI_API_KEY="..."

    # Stripe
    STRIPE_SECRET_KEY="..."
    NEXT_PUBLIC_STRIPE_PRICE_ID="..."
    STRIPE_WEBHOOK_SECRET="..."

    # Application
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Run database migrations:**
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
│   ├── api/                  # API routes for backend functionality
│   │   ├── course-analytics/ # Course progress tracking
│   │   ├── courses/          # Course management
│   │   ├── create-user/      # User creation (for Clerk webhooks)
│   │   ├── ensure-user-exists/ # User verification
│   │   ├── generate-chapters/ # Chapter generation
│   │   ├── generate-course-outline/ # Course outline generation
│   │   ├── inngest/          # Inngest background processing
│   │   ├── payment/          # Stripe payment integration
│   │   ├── study-type/       # Study material type management
│   │   ├── study-type-content/ # Study material content
│   │   ├── users/            # User stats and management
│   │   └── validate-user/    # User validation
│   ├── course/               # Course viewing pages
│   │   └── [courseId]/       # Dynamic course routes
│   │       ├── _components/  # Course components
│   │       ├── flashcards/   # Flashcard study interface
│   │       ├── notes/        # Course notes interface
│   │       └── quiz/         # Quiz interface
│   ├── create/               # Course creation page
│   └── dashboard/            # User dashboard
│       ├── _components/      # Dashboard components
│       ├── profile/          # User profile management
│       └── upgrade/          # Premium subscription upgrade
├── components/               # Shared UI components
├── configs/                  # Configuration files
│   ├── AiModel.js            # Gemini AI configuration
│   ├── db.js                 # Database connection
│   └── schema.js             # Database schema
├── inngest/                  # Background processing
│   ├── client.js             # Inngest client setup
│   └── functions.js          # Background job functions
├── lib/                      # Utility functions
├── .env.local                # Environment variables (create this)
├── drizzle.config.js         # Drizzle ORM configuration
├── next.config.mjs           # Next.js configuration
└── package.json              # Project dependencies and scripts
```

## Key Workflows

### Course Generation Process

1. **User Initiates Course Generation**
   - User enters a topic and selects options on the create page
   - Application generates a unique course ID
   - API request sent to `/api/generate-course-outline`

2. **AI Generates Course Structure**
   - Google Gemini AI creates a structured course outline
   - Course details saved to the database
   - Inngest event triggered for background processing

3. **Background Processing (via Inngest)**
   - Notes generation for each chapter occurs asynchronously
   - Flashcards and quizzes are generated on-demand
   - Course status updated to "Ready" when complete

4. **User Interaction**
   - User can access the course from their dashboard
   - Interactive study materials (notes, flashcards, quizzes) available
   - Progress tracked as user completes different sections

### User Authentication Flow

1. **New User Registration**
   - User signs up through Clerk authentication
   - Clerk webhook triggers user creation in the database
   - User redirected to dashboard after successful registration

2. **Returning User Login**
   - User signs in through Clerk authentication
   - Application verifies user existence in the database
   - If not found, user is created via the Inngest background job

## API Endpoints

The following are the main API endpoints:

- **Course Management**
  - `POST /api/generate-course-outline`: Creates a new course outline
  - `GET /api/courses`: Retrieves user's courses
  - `POST /api/course-analytics`: Gets course progress data

- **Study Materials**
  - `POST /api/study-type`: Retrieves or initiates generation of study materials
  - `POST /api/study-type-content`: Stores and retrieves study content
  - `POST /api/generate-chapters`: Generates chapter content

- **User Management**
  - `POST /api/create-user`: Processes Clerk webhooks for user creation
  - `POST /api/ensure-user-exists`: Verifies and creates users if needed
  - `POST /api/validate-user`: Validates user existence
  - `GET|PUT /api/users/[userId]/stats`: Manages user statistics

- **Payment Processing**
  - `POST /api/payment/checkout`: Creates Stripe checkout sessions
  - `POST /api/payment/manage-payment`: Manages payment settings
  - `POST /api/payment/webhook`: Processes Stripe webhooks

- **Background Processing**
  - `GET|POST|PUT /api/inngest`: Handles Inngest events and functions

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
