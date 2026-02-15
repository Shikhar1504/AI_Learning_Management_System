# 🧠 LearnForge - AI-Powered Learning Management System

LearnForge - AI-Powered Learning Management System

Next-Generation Education Platform 🚀

LearnForge is a comprehensive, AI-powered Learning Management System (LMS) that revolutionizes education by allowing users to generate complete courses on any topic instantly. It leverages Google's Gemini AI to create personalized course outlines, detailed notes, interactive flashcards, and quizzes, providing an engaging and adaptive learning experience.

🧠 Explore Features • 🚀 Quick Start • 🛠️ Tech Stack • 📂 Documentation

## ✨ Features

### 🤖 AI-Powered Course Generation

Advanced course creation powered by Google Gemini AI with intelligent content structuring and personalized learning paths

### 📚 Interactive Study Materials

Comprehensive study tools including detailed notes, interactive flashcards, practice quizzes, and progress tracking

### 🎯 Gamification & Analytics

Experience points, streaks, and achievement system with detailed learning analytics and performance insights

### 💳 Monetization & Premium Features

Flexible pricing with free plan (10 courses/day) and premium unlimited access with advanced analytics

### 🔐 Enterprise Authentication

Secure authentication and authorization using Clerk with role-based access control

### 📊 Comprehensive Dashboard

Personalized dashboards with course progress, analytics, and learning insights

### 🚀 Background Processing

Asynchronous content generation using Inngest for non-blocking AI content creation

### 🎨 Modern Responsive UI

Beautiful, accessible interface built with Tailwind CSS and Radix UI components

### 🔍 Smart Learning Features

Adaptive content based on user progress and learning style preferences

### 📱 Cross-Platform Accessibility

Fully responsive design optimized for desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Core Technologies

- **Frontend Framework:** Next.js 15.1.11 with App Router
- **Runtime:** Node.js 18+
- **Language:** JavaScript/JSX
- **Package Manager:** npm/yarn

### AI & Machine Learning

- **AI Assistant:** Google Gemini AI for course content generation
- **AI Models:** Gemini-2.5-Flash for educational content creation
- **Fallback System:** Automatic API key rotation for reliability

### Authentication & Security

- **Authentication:** Clerk with role-based access control
- **Authorization:** Server-side middleware and route protection
- **Security:** Secure API key management and user data protection

### Database & ORM

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM with advanced schema management
- **Database Operations:** Server actions with transaction support

### Frontend & UI

- **Styling:** Tailwind CSS 3.4.1 with custom educational themes
- **UI Components:** Radix UI primitives with custom implementations
- **Icons:** Lucide React for consistent iconography
- **Notifications:** Sonner for toast notifications
- **Theme:** Custom dark/light theme support

### Payment & Monetization

- **Payment Processor:** Stripe for secure transactions
- **Subscription Management:** Automated billing and plan management
- **Webhook Handling:** Real-time payment status updates

### Background Processing

- **Job Queue:** Inngest for asynchronous content generation
- **Event-Driven:** Background job processing and user management
- **Reliability:** Built-in retries and error handling

### Development & Deployment

- **Build Tool:** Next.js built-in build system
- **Linting:** ESLint with Next.js configuration
- **Deployment:** Vercel with automatic CI/CD
- **Monitoring:** Built-in error tracking and performance monitoring

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have installed:

- Node.js (v18 or higher)
- npm or yarn package manager
- PostgreSQL database (Neon recommended)

### Installation

Clone the repository:

```bash
git clone https://github.com/Shikhar1504/AI_Learning_Management_System.git
cd LearnForge
```

Install dependencies:

```bash
npm install
```

Set up environment variables:

Create a `.env.local` file in the root directory and add the following variables:

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

Run database migrations:

```bash
npx drizzle-kit push:pg
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Run Inngest Dev Server:
In a separate terminal, run:

```bash
npx inngest-cli dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
LearnForge/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── course-analytics/     # Course progress tracking
│   │   ├── courses/              # Course management
│   │   ├── create-user/          # User creation (Clerk webhooks)
│   │   ├── ensure-user-exists/   # User verification
│   │   ├── generate-chapters/    # Chapter generation
│   │   ├── generate-course-outline/ # Course outline generation
│   │   ├── generate-topic-notes/ # Topic content generation
│   │   ├── inngest/              # Inngest background processing
│   │   ├── payment/              # Stripe payment integration
│   │   ├── study-type/           # Study material type management
│   │   ├── study-type-content/   # Study material content
│   │   ├── users/                # User stats and management
│   │   └── validate-user/        # User validation
│   ├── course/                   # Course viewing pages
│   │   ├── [courseId]/           # Dynamic course routes
│   │   │   ├── flashcards/       # Flashcard study interface
│   │   │   ├── notes/            # Course notes interface
│   │   │   ├── quiz/             # Quiz interface
│   │   │   └── page.jsx          # Course overview page
│   ├── create/                   # Course creation page
│   ├── dashboard/                # User dashboard
│   │   ├── _components/          # Dashboard components
│   │   ├── profile/              # User profile management
│   │   ├── upgrade/              # Premium subscription upgrade
│   │   └── page.jsx              # Dashboard main page
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/              # Sign-in page
│   │   └── sign-up/              # Sign-up page
│   ├── globals.css               # Global styles and Tailwind imports
│   ├── layout.js                 # Root layout with providers
│   ├── page.js                   # Landing page with pricing section
│   └── provider.js               # Context providers
├── components/                   # Reusable UI components
│   ├── ui/                       # Shadcn/ui components
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── carousel.jsx
│   │   ├── progress-dashboard.jsx
│   │   ├── progress.jsx
│   │   ├── select.jsx
│   │   ├── textarea.jsx
│   │   ├── toast.jsx
│   │   ├── toaster.jsx
│   │   └── toast.jsx
├── configs/                      # Configuration files
│   ├── AiModel.js                # Gemini AI configuration with fallback
│   ├── db.js                     # Database connection
│   └── schema.js                 # Database schema with all tables
├── inngest/                      # Background processing
│   ├── client.js                 # Inngest client setup
│   ├── functions.js              # Background job functions
├── lib/                          # Utility functions
│   ├── userStatsService.js       # User statistics and gamification
│   └── utils.js                  # General utilities
├── hooks/                        # Custom React hooks
├── utils/                        # Utility functions
├── public/                       # Static assets
│   ├── RisePic/                  # Project screenshots
│   └── assets/                   # Images and icons
├── drizzle/                      # Database migrations
├── .env.local                    # Environment variables (create this)
├── middleware.js                 # Next.js middleware
├── next.config.mjs               # Next.js configuration
├── package.json                  # Project dependencies and scripts
├── tailwind.config.mjs           # Tailwind CSS configuration
└── .gitignore                    # Git ignore rules
```

## 🧠 How LearnForge Works

### 🤖 AI Course Generation Engine

Intelligent course creation with advanced AI content structuring:

- **Smart Topic Analysis:** AI analyzes user input to understand learning objectives
- **Structured Course Outline:** Generates exactly 3 chapters with logical progression
- **Content Personalization:** Adapts difficulty level based on user preferences
- **Fallback Content Generation:** Automatic fallback when AI services are unavailable
- **Background Processing:** Non-blocking content generation with progress tracking

### 📚 Interactive Learning Experience

Comprehensive study tools designed for effective learning:

- **Detailed Topic Notes:** AI-generated explanations with key concepts and examples
- **Interactive Flashcards:** Smart flashcards that adapt to learning progress
- **Practice Quizzes:** Multiple-choice questions with immediate feedback
- **Progress Analytics:** Real-time tracking of learning achievements and streaks
- **Gamification Elements:** Experience points, levels, and achievement badges

### 🎯 Personalized Learning Paths

Adaptive learning system that responds to user progress:

- **Difficulty Adjustment:** Courses adapt based on user performance
- **Learning Style Detection:** Content presentation optimized for individual preferences
- **Progress-Based Recommendations:** AI suggests next steps based on current achievements
- **Study Session Tracking:** Comprehensive analytics of study time and patterns

### 💳 Flexible Monetization System

Subscription-based model with transparent pricing:

- **Free Tier:** 10 courses per day with basic features
- **Premium Access:** Unlimited course generation with advanced analytics
- **Credit-Based System:** Pay-per-course with subscription discounts
- **Transparent Billing:** Clear pricing with Stripe-powered secure payments

### 🔐 Secure User Management

Enterprise-grade authentication and data protection:

- **Clerk Integration:** Secure authentication with social login options
- **Role-Based Access:** Multi-level permissions for different user types
- **Data Privacy:** Secure handling of user data and learning progress
- **Webhook Security:** Automated user management with secure webhooks

### 📊 Comprehensive Analytics Dashboard

Real-time insights into learning progress and performance:

- **Course Progress Tracking:** Visual progress bars and completion metrics
- **Study Session Analytics:** Time spent, streaks, and learning patterns
- **Performance Insights:** Quiz scores, flashcard mastery, and improvement trends
- **Gamification Metrics:** Experience points, levels, and achievement tracking

### 🚀 Background Content Generation

Asynchronous AI processing for seamless user experience:

- **Inngest Integration:** Event-driven background job processing
- **Progress Updates:** Real-time status updates during content generation
- **Error Recovery:** Automatic retry mechanisms with fallback content
- **Rate Limiting:** Smart API usage management to prevent service limits

### 🎨 Modern User Interface

Beautiful, accessible design optimized for learning:

- **Dark/Light Themes:** Comfortable viewing in any environment
- **Responsive Design:** Optimized for desktop, tablet, and mobile devices
- **Accessibility Compliance:** WCAG-compliant design for inclusive education
- **Smooth Animations:** Engaging transitions and interactive elements

### 🔍 Smart Study Features

Advanced learning tools powered by AI and data analytics:

- **Adaptive Flashcards:** Cards that adjust difficulty based on user performance
- **Quiz Analytics:** Detailed performance analysis with improvement suggestions
- **Study Reminders:** Intelligent notifications based on learning patterns
- **Progress Predictions:** AI-powered estimates of completion timelines

### 📱 Cross-Platform Learning

Seamless learning experience across all devices:

- **Mobile Optimization:** Touch-friendly interface for smartphones and tablets
- **Offline Capabilities:** Limited functionality available without internet
- **Progressive Web App:** App-like experience in web browsers
- **Cross-Browser Support:** Consistent experience across all modern browsers

## 🗃️ Database Schema

The application uses PostgreSQL with Drizzle ORM and includes the following comprehensive data models:

### Core Models

- **User:** Multi-role user management with authentication integration and gamification stats
- **StudyMaterial:** Course content with AI-generated outlines and metadata
- **Topic:** Granular topic-level tracking for precise learning progress
- **ChapterNotes:** Detailed chapter content with AI-generated explanations
- **StudyTypeContent:** Flashcards and quizzes with dynamic content
- **PaymentRecord:** Stripe payment tracking and subscription management

### Key Features

- **Role-based Access:** Comprehensive user roles with appropriate field access
- **Gamification System:** Experience points, streaks, and achievement tracking
- **Content Generation:** AI-generated course content with status tracking
- **Financial Tracking:** Complete audit trail for payments and subscriptions
- **Progress Analytics:** Detailed learning progress and performance metrics

### Security & Compliance

- **Data Encryption:** Sensitive user data protection
- **Audit Trails:** Complete transaction and action logging
- **Privacy Controls:** User data protection and consent management
- **Secure Authentication:** Enterprise-grade security with Clerk integration

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx drizzle-kit push:pg  # Push database schema changes
npx inngest-cli dev  # Run Inngest development server
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports:** Found a bug? [Open an issue](https://github.com/Shikhar1504/AI_Learning_Management_System/issues)
- 💡 **Feature Requests:** Have an idea? [Suggest a feature](https://github.com/Shikhar1504/AI_Learning_Management_System/issues)
- 📝 **Documentation:** Help improve documentation
- 🧪 **Testing:** Write tests or report test cases
- 🎨 **UI/UX:** Design improvements and user experience enhancements

### Development Workflow

1. **Fork the Project**

   ```bash
   git clone https://github.com/Shikhar1504/AI_Learning_Management_System.git
   cd LearnForge
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

- **TypeScript/React:** Follow Next.js and React best practices
- **Styling:** Use Tailwind CSS with consistent design patterns
- **API Design:** RESTful conventions with proper error handling
- **Security:** Input validation and secure coding practices
- **Performance:** Optimize for speed and user experience

### Testing

- Write unit tests for utilities and components
- Test API endpoints with various scenarios
- Ensure responsive design across devices
- Verify accessibility compliance

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the repository or contact the maintainers.

## 🎓 Key Learning / Skills Demonstrated

This project showcases a comprehensive full-stack development skill set suitable for modern web applications:

### Frontend Development

- **React 19** with Next.js 15 App Router
- **Modern UI/UX** with Tailwind CSS and Shadcn/ui components
- **Responsive Design** for mobile, tablet, and desktop
- **State Management** using React Context and hooks
- **Animation & Interactions** with Framer Motion
- **Form Handling** and user input validation

### Backend Development

- **API Design** with RESTful conventions
- **Database Design** with PostgreSQL and Drizzle ORM
- **Authentication** integration with Clerk
- **Payment Processing** with Stripe webhooks
- **Background Processing** with Inngest
- **Error Handling** and fallback systems

### AI & Machine Learning Integration

- **Google Gemini AI** integration for content generation
- **Fallback Systems** for API reliability
- **Rate Limiting** and error recovery
- **Content Generation** for courses, notes, flashcards, and quizzes
- **Prompt Engineering** for optimal AI responses

### DevOps & Deployment

- **Environment Configuration** for development and production
- **Database Migrations** with Drizzle Kit
- **Security Best Practices** with middleware and validation
- **Performance Optimization** with lazy loading and caching
- **Monitoring & Logging** for debugging and analytics

### Business & Product Skills

- **User Experience Design** with intuitive workflows
- **Monetization Strategy** with freemium model
- **Analytics & Tracking** for user behavior insights
- **Gamification** for user engagement
- **Scalability Planning** for growing user base

### Technical Architecture

- **Microservices Architecture** with separate concerns
- **Event-Driven Processing** for asynchronous tasks
- **Database Optimization** with efficient queries
- **Security Implementation** with proper authentication
- **API Rate Limiting** and abuse prevention

---

**Built with ❤️ by [Shikhar](https://github.com/Shikhar1504)**

_LearnForge - Transforming education through the power of AI_
