# LearnForge - AI-Powered Learning Management System

LearnForge is a comprehensive, AI-powered Learning Management System (LMS) that revolutionizes education by allowing users to generate complete courses on any topic instantly. It leverages Google's Gemini AI to create personalized course outlines, detailed notes, interactive flashcards, and quizzes, providing an engaging and adaptive learning experience.

## ✨ Features

### 🤖 AI-Powered Course Generation

- **Instant Course Creation:** Generate comprehensive course structures from a single user prompt
- **Personalized Learning Paths:** AI analyzes user preferences and difficulty levels
- **Multi-Subject Support:** Create courses on any topic from programming to humanities
- **Adaptive Content:** Courses adjust based on user progress and learning style

### 📚 Interactive Study Materials

- **Detailed Chapter Notes:** AI-generated notes with explanations, key points, and code examples
- **Interactive Flashcards:** Smart flashcards that adapt to your knowledge level
- **Practice Quizzes:** Test your understanding with AI-generated questions
- **Progress Tracking:** Monitor your learning journey with detailed analytics

### 🎯 Advanced Learning Features

- **Gamification:** Experience points, streaks, and achievement system
- **Daily Course Limits:** Free plan with 10 courses per day, unlimited with premium
- **Study Analytics:** Track study time, completion rates, and learning patterns
- **Community Features:** Connect with other learners (coming soon)

### 💳 Monetization & Premium Features

- **Flexible Pricing:** Free plan with premium upgrade option
- **Stripe Integration:** Secure payment processing with subscription management
- **Premium Benefits:** Unlimited course generation, priority support, advanced analytics
- **Subscription Management:** Easy upgrade/downgrade through Stripe dashboard

### 🔐 Security & User Management

- **Clerk Authentication:** Secure user authentication with social login options
- **User Profiles:** Personalized dashboards with learning history
- **Data Privacy:** Secure handling of user data and learning progress
- **Webhook Integration:** Automated user creation and management

### 🚀 Performance & Scalability

- **Background Processing:** Asynchronous content generation using Inngest
- **Fallback AI Keys:** Automatic switching between primary and fallback API keys
- **Rate Limiting:** Smart handling of API limits with exponential backoff
- **Database Optimization:** Efficient data storage with Drizzle ORM

### 🎨 Modern User Interface

- **Responsive Design:** Beautiful interface that works on all devices
- **Dark Theme:** Modern dark theme with smooth animations
- **Interactive Elements:** Engaging UI with hover effects and transitions
- **Accessibility:** WCAG compliant design for inclusive learning

## 🛠️ Tech Stack

### Core Framework & Runtime

- **Framework:** [Next.js](https://nextjs.org/) v15.1.6 (App Router)
- **Runtime:** [Node.js](https://nodejs.org/) v18.x or later
- **React:** v19.0.0

### Frontend & Styling

- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v3.4.1
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) v12.4.10
- **Icons:** [Lucide React](https://lucide.dev/) v0.474.0
- **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes) v0.4.4

### Backend & Database

- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) v0.38.4
- **Database:** [Neon](https://neon.tech/) (PostgreSQL) with [@neondatabase/serverless](https://github.com/neondatabase/serverless) v0.10.4
- **Migration Tool:** [Drizzle Kit](https://orm.drizzle.team/kit) v0.30.2

### AI & Machine Learning

- **AI Provider:** [Google Gemini](https://ai.google.dev/) v0.8.0
- **Fallback System:** Custom API key rotation for reliability
- **Content Generation:** Specialized AI models for courses, notes, flashcards, and quizzes

### Authentication & Security

- **Authentication:** [Clerk](https://clerk.com/) v6.10.1
- **Webhook Processing:** [Svix](https://svix.com/) v1.75.0
- **Security:** Secure API key management and user data protection

### Payments & Monetization

- **Payment Processor:** [Stripe](https://stripe.com/) v17.7.0
- **Subscription Management:** Automated billing and plan management
- **Webhook Handling:** Real-time payment status updates

### Background Processing

- **Job Queue:** [Inngest](https://www.inngest.com/) v3.30.0
- **Event-Driven:** Asynchronous content generation and user management
- **Reliability:** Built-in retries and error handling

### Additional Libraries

- **HTTP Client:** [Axios](https://axios-http.com/) v1.7.9
- **Date Handling:** [date-fns](https://date-fns.org/) v4.1.0
- **HTML Sanitization:** [DOMPurify](https://github.com/cure53/DOMPurify) v3.2.6
- **Syntax Highlighting:** [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) v15.6.1
- **Toast Notifications:** [Sonner](https://sonner.emilkowal.ski/) v1.7.4
- **Carousel:** [Embla Carousel](https://www.embla-carousel.com/) v8.5.2
- **State Management:** React hooks with Context API

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
    cd LearnForge
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```env
    # Database Configuration
    NEXT_PUBLIC_DATABASE_CONNECTION_STRING="postgresql://username:password@hostname:port/database"

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
    CLERK_WEBHOOK_SECRET="whsec_..."

    # Google Gemini AI (Primary and Fallback for reliability)
    NEXT_PUBLIC_GEMINI_API_KEY="AIza..."
    GEMINI_FALLBACK_API_KEY="AIza..."

    # Stripe Payment Processing
    STRIPE_SECRET_KEY="sk_test_..."
    NEXT_PUBLIC_STRIPE_PRICE_ID="price_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."

    # Inngest Background Processing
    INNGEST_SIGNING_KEY="sign_..."
    INNGEST_EVENT_KEY="event_..."

    # Application Configuration
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-secret-key"
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

## 🌟 Recent Features

### Landing Page with Pricing Integration

- **Modern Hero Section**: Engaging landing page with animated elements
- **Feature Showcase**: Interactive feature cards with hover effects
- **Integrated Pricing**: Pricing section embedded directly on landing page
- **Smooth Scrolling**: Navigation links scroll to sections instead of page redirects
- **Responsive Design**: Optimized for all device sizes

### Enhanced User Experience

- **Theme Consistency**: Fixed text color issues across all pages
- **Improved Navigation**: Consistent headers and back buttons
- **Better Onboarding**: Clear upgrade paths and feature explanations
- **Performance Optimizations**: Lazy loading and efficient rendering

### Payment & Monetization

- **Stripe Integration**: Secure payment processing with webhook handling
- **Subscription Management**: Automated billing and plan management
- **Usage Tracking**: Daily course limits with premium unlimited access
- **Customer Portal**: Easy subscription management through Stripe

### AI Reliability Features

- **Fallback API Keys**: Automatic switching between primary and backup Gemini keys
- **Rate Limiting**: Smart handling of API limits with exponential backoff
- **Error Recovery**: Comprehensive fallback content generation
- **Background Processing**: Non-blocking content generation with progress tracking

## 📁 Project Structure

```
.
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Authentication pages (Clerk)
│   │   ├── sign-in/[[...sign-in]]/ # Sign-in page with catch-all route
│   │   └── sign-up/[[...sign-up]]/ # Sign-up page with catch-all route
│   ├── api/                      # API routes for backend functionality
│   │   ├── course-analytics/     # Course progress tracking
│   │   ├── courses/              # Course management
│   │   ├── create-user/          # User creation (Clerk webhooks)
│   │   ├── ensure-user-exists/   # User verification
│   │   ├── generate-chapters/    # Chapter generation
│   │   ├── generate-course-outline/ # Course outline generation
│   │   ├── inngest/              # Inngest background processing
│   │   ├── payment/              # Stripe payment integration
│   │   │   ├── checkout/         # Stripe checkout session creation
│   │   │   ├── manage-payment/   # Payment management
│   │   │   └── webhook/          # Stripe webhook handling
│   │   ├── study-type/           # Study material type management
│   │   ├── study-type-content/   # Study material content
│   │   ├── users/                # User stats and management
│   │   └── validate-user/        # User validation
│   ├── course/                   # Course viewing pages
│   │   ├── layout.jsx            # Course layout with header
│   │   └── [courseId]/           # Dynamic course routes
│   │       ├── _components/      # Course components
│   │       │   ├── ChapterList.jsx
│   │       │   ├── CourseIntroCard.jsx
│   │       │   ├── EndScreen.jsx
│   │       │   ├── MaterialCardItem.jsx
│   │       │   ├── StepProgress.jsx
│   │       │   └── StudyMaterialSection.jsx
│   │       ├── flashcards/        # Flashcard study interface
│   │       │   ├── page.jsx
│   │       │   └── _components/
│   │       │       └── FlashcardItem.jsx
│   │       ├── notes/            # Course notes interface
│   │       │   └── page.jsx
│   │       ├── quiz/             # Quiz interface
│   │       │   ├── page.jsx
│   │       │   └── _components/
│   │       │       └── QuizCardItem.jsx
│   │       └── page.jsx          # Course overview page
│   ├── create/                   # Course creation page
│   │   ├── page.jsx
│   │   ├── _components/
│   │   │   ├── SelectOption.jsx
│   │   │   └── TopicInput.jsx
│   │   └── workflow.txt          # Course creation workflow
│   ├── dashboard/                # User dashboard
│   │   ├── layout.jsx            # Dashboard layout
│   │   ├── page.client.js        # Dashboard client component
│   │   ├── page.jsx              # Dashboard main page
│   │   ├── _components/          # Dashboard components
│   │   │   ├── CourseCardItem.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── DashboardHeader.jsx
│   │   │   ├── SideBar.jsx
│   │   │   └── WelcomeBanner.jsx
│   │   ├── profile/              # User profile management
│   │   │   └── page.jsx
│   │   └── upgrade/              # Premium subscription upgrade
│   │       ├── page.jsx
│   │       └── _components/
│   │           └── CheckIcon.jsx
│   ├── globals.css               # Global styles and Tailwind imports
│   ├── layout.js                 # Root layout with providers
│   ├── page.js                   # Landing page with pricing section
│   ├── provider.js               # Context providers
│   └── _context/                 # React contexts
│       └── CourseCountContext.jsx
├── components/                   # Shared UI components
│   └── ui/                       # Shadcn/ui components
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── carousel.jsx
│       ├── progress-dashboard.jsx
│       ├── progress.jsx
│       ├── select.jsx
│       ├── textarea.jsx
│       ├── toast.jsx
│       ├── toaster.jsx
│       └── toast.jsx
├── configs/                      # Configuration files
│   ├── AiModel.js                # Gemini AI configuration with fallback
│   ├── db.js                     # Database connection
│   └── schema.js                 # Database schema with all tables
├── inngest/                      # Background processing
│   ├── client.js                 # Inngest client setup
│   └── functions.js              # Background job functions
├── lib/                          # Utility functions
│   └── userStatsService.js       # User statistics and gamification
├── public/                       # Static assets
│   ├── code.png
│   ├── content.png
│   ├── exam_1.png
│   ├── exam.png
│   ├── file.svg
│   ├── fitness.png
│   ├── flashcard.png
│   ├── globe.svg
│   ├── job.png
│   ├── knowledge.png
│   ├── laptop.png
│   ├── notes.png
│   ├── practice.png
│   ├── psyduck.png
│   ├── qa.png
│   ├── quiz.png
│   └── RiseLogo.svg
├── utils/                        # Utility functions
│   └── getUserEmail.js           # Email utility
├── .env.local                    # Environment variables (create this)
├── drizzle.config.js             # Drizzle ORM configuration
├── jsconfig.json                 # JavaScript configuration
├── middleware.js                 # Next.js middleware
├── next.config.mjs               # Next.js configuration
├── package.json                  # Project dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── README.md                     # Project documentation
├── tailwind.config.mjs           # Tailwind CSS configuration
└── .gitignore                    # Git ignore rules
```

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(256) PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  isMember BOOLEAN DEFAULT false,
  customerId VARCHAR,
  -- Statistics & Gamification
  streak INTEGER DEFAULT 0,
  studyTime INTEGER DEFAULT 0,
  completedCourses INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  lastStudyDate TIMESTAMP,
  currentGoal JSON,
  preferences JSON,
  -- Daily limits
  dailyCoursesCreated INTEGER DEFAULT 0,
  lastCourseDate TIMESTAMP,
  -- Experience system
  experiencePoints INTEGER DEFAULT 0,
  learnerLevel INTEGER DEFAULT 1,
  levelProgress INTEGER DEFAULT 0,
  lastLevelUpdate TIMESTAMP
);
```

### Study Materials Table

```sql
CREATE TABLE studyMaterial (
  id VARCHAR(256) PRIMARY KEY,
  courseId VARCHAR NOT NULL,
  courseType VARCHAR NOT NULL,
  topic VARCHAR NOT NULL,
  difficultyLevel VARCHAR DEFAULT 'Easy',
  courseLayout JSON,
  createdBy VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Generating'
);
```

### Chapter Notes Table

```sql
CREATE TABLE chapterNotes (
  id VARCHAR(256) PRIMARY KEY,
  courseId VARCHAR NOT NULL,
  chapterId INTEGER NOT NULL,
  notes TEXT
);
```

### Study Type Content Table

```sql
CREATE TABLE studyTypeContent (
  id VARCHAR(256) PRIMARY KEY,
  courseId VARCHAR NOT NULL,
  content JSON,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Generating'
);
```

### Payment Records Table

```sql
CREATE TABLE paymentRecord (
  id VARCHAR(256) PRIMARY KEY,
  customerId VARCHAR,
  sessionId VARCHAR
);
```

## 🔄 Key Workflows

### Course Generation Process

1. **User Initiates Course Generation**

   - User enters topic and selects difficulty on create page
   - Daily course limit validation (10 for free, unlimited for premium)
   - Unique course ID generated
   - API request to `/api/generate-course-outline`

2. **AI Course Structure Generation**

   - Google Gemini AI creates course outline with exactly 3 chapters
   - Fallback content generation if AI fails
   - Course saved to database with "Generating" status
   - Inngest event triggered for background processing

3. **Background Content Generation (Inngest)**

   - Chapter notes generated asynchronously with rate limiting
   - API key fallback system for reliability
   - Progress updates and error handling
   - Course status updated to "Ready" when complete

4. **Interactive Study Experience**
   - User accesses course from dashboard
   - Study materials: notes, flashcards, quizzes
   - Progress tracking and analytics
   - Gamification features (streaks, XP, levels)

### User Authentication & Onboarding

1. **New User Registration**

   - Clerk handles authentication and social login
   - Webhook triggers user creation in database
   - Welcome email and dashboard access
   - Initial statistics setup

2. **Returning User Experience**
   - Seamless login with Clerk
   - Statistics and progress restoration
   - Personalized dashboard with recent courses
   - Subscription status verification

### Payment & Subscription Management

1. **Free to Premium Upgrade**

   - Landing page pricing section with clear CTAs
   - Stripe checkout integration
   - Webhook confirmation and status updates
   - Instant premium access upon payment

2. **Subscription Lifecycle**
   - Automated billing through Stripe
   - Usage tracking and limits enforcement
   - Customer portal for subscription management
   - Cancellation and plan change handling

## 🔗 API Endpoints

### Course Management

- `POST /api/generate-course-outline`: Creates a new course outline with AI-generated structure
- `GET /api/courses`: Retrieves user's created courses with status information
- `POST /api/course-analytics`: Gets course progress and analytics data

### Study Materials Generation

- `POST /api/study-type`: Retrieves or initiates generation of study materials (notes, flashcards, quizzes)
- `POST /api/study-type-content`: Stores and retrieves generated study content
- `POST /api/generate-chapters`: Generates detailed chapter content with AI

### User Management & Authentication

- `POST /api/create-user`: Processes Clerk webhooks for new user creation
- `POST /api/ensure-user-exists`: Verifies and creates users if needed (background job)
- `POST /api/validate-user`: Validates user existence and permissions
- `GET|PUT /api/users/[userId]/stats`: Manages user statistics, streaks, and gamification

### Payment Processing & Monetization

- `POST /api/payment/checkout`: Creates Stripe checkout sessions for premium upgrades
- `POST /api/payment/manage-payment`: Manages existing payment settings and subscriptions
- `POST /api/payment/webhook`: Processes Stripe webhooks for payment confirmations

### Background Processing

- `GET|POST|PUT /api/inngest`: Handles Inngest events and background job functions
- **Automated Tasks:**
  - User creation and verification
  - AI content generation (notes, flashcards, quizzes)
  - Course status updates
  - User statistics tracking

## 🎯 User Journey

### For New Visitors

1. **Landing Page**: Discover features and pricing with smooth scrolling
2. **Sign Up**: Create account with Clerk authentication
3. **Free Trial**: Start with 10 courses per day limit
4. **Upgrade Option**: Seamless upgrade to premium via Stripe

### For Learners

1. **Course Creation**: Input topic and preferences
2. **AI Generation**: Instant course outline with 3 chapters
3. **Background Processing**: Notes generated asynchronously
4. **Interactive Study**: Access flashcards, quizzes, and progress tracking
5. **Analytics**: Monitor learning progress and streaks

### For Premium Users

1. **Unlimited Generation**: Create unlimited courses
2. **Advanced Analytics**: Detailed learning insights
3. **Priority Support**: Direct customer support
4. **Subscription Management**: Easy plan changes via Stripe

## 🔧 Key Workflows

### Course Generation Pipeline

```
User Input → AI Course Outline → Background Note Generation → Interactive Study → Progress Tracking
```

### Payment Flow

```
Landing Page → Stripe Checkout → Webhook Confirmation → Premium Access → Subscription Management
```

### User Onboarding

```
Sign Up → Email Verification → Dashboard → First Course → Study Materials → Progress Tracking
```

## 🚀 Deployment

### Environment Setup for Production

1. **Database**: Set up Neon PostgreSQL database
2. **Authentication**: Configure Clerk application
3. **AI Services**: Set up Google Gemini API keys (primary + fallback)
4. **Payments**: Configure Stripe account and webhooks
5. **Background Jobs**: Set up Inngest account and signing keys

### Build & Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly configured for production, especially:

- Database connection strings
- API keys and secrets
- Webhook endpoints
- CORS and security settings

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports**: Found a bug? [Open an issue](https://github.com/Shikhar1504/AI_Learning_Management_System/issues)
- 💡 **Feature Requests**: Have an idea? [Suggest a feature](https://github.com/Shikhar1504/AI_Learning_Management_System/issues)
- 📝 **Documentation**: Help improve documentation
- 🧪 **Testing**: Write tests or report test cases
- 🎨 **UI/UX**: Design improvements and user experience enhancements

### Development Workflow

1. **Fork the Project**

   ```bash
   git clone https://github.com/Shikhar1504/AI_Learning_Management_System.git
   cd
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Set up Development Environment**

   ```bash
   npm install
   # Configure environment variables
   cp .env.local.example .env.local
   ```

4. **Make Changes**

   - Follow existing code style and patterns
   - Add tests for new features
   - Update documentation as needed

5. **Commit Changes**

   ```bash
   git commit -m 'Add: Amazing new feature'
   ```

6. **Push & Create Pull Request**
   ```bash
   git push origin feature/AmazingFeature
   # Create PR on GitHub
   ```

### Code Standards

- **TypeScript/React**: Follow Next.js and React best practices
- **Styling**: Use Tailwind CSS with consistent design patterns
- **API Design**: RESTful conventions with proper error handling
- **Security**: Input validation and secure coding practices
- **Performance**: Optimize for speed and user experience

### Testing

- Write unit tests for utilities and components
- Test API endpoints with various scenarios
- Ensure responsive design across devices
- Verify accessibility compliance

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the course generation
- **Clerk** for seamless authentication
- **Stripe** for reliable payment processing
- **Inngest** for background job processing
- **Neon** for PostgreSQL hosting
- **Vercel** for deployment platform
- **Open source community** for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Shikhar1504/AI_Learning_Management_System/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shikhar1504/AI_Learning_Management_System/discussions)
- **Email**: For business inquiries or premium support

## 🔄 Version History

### v0.1.0 (Current)

- ✅ Complete AI-powered course generation
- ✅ Interactive study materials (notes, flashcards, quizzes)
- ✅ User authentication and profiles
- ✅ Payment integration with Stripe
- ✅ Background processing with Inngest
- ✅ Modern responsive UI with dark theme
- ✅ Landing page with pricing section
- ✅ Gamification and progress tracking
- ✅ API rate limiting and fallback systems

---

**Built with ❤️ by [Shikhar](https://github.com/Shikhar1504)**

_LearnForge - Transforming education through the power of AI_
