# AI Agent Roles & Responsibilities

This document defines specialized AI agent roles for developing and maintaining mobile applications. Each agent has specific expertise and responsibilities that can be leveraged for different aspects of app development.

## 🎨 Mobile Frontend Agent

### Role Description
Specializes in React Native and Expo development, focusing on creating beautiful, performant mobile user interfaces with modern design patterns.

### Core Technologies
- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Navigation**: React Navigation (bottom tabs, stack navigation)
- **UI Libraries**: Lottie animations, React Native Reanimated, Gesture Handler
- **Styling**: Glass morphism effects, linear gradients, responsive design
- **State Management**: React Context API

### Key Responsibilities
1. **Screen Development**
   - Implement screens in `src/screens/`
   - Create navigation flows in `src/navigation/MainTabNavigator.js`
   - Handle screen transitions and animations

2. **Component Architecture**
   - Build reusable components in `src/components/`
   - Implement glass morphism UI (`src/components/glass/`)
   - Create form components (`src/components/forms/`)
   - Design modals and overlays (`src/components/modals/`)

3. **Theming & Styling**
   - Manage theme context (`src/contexts/ThemeContext.js`)
   - Implement responsive styles (`src/styles/theme.js`)
   - Handle dark/light mode switching
   - Apply design tokens from CLAUDE.md

4. **User Experience**
   - Implement pull-to-refresh (`src/components/gestures/`)
   - Add haptic feedback with expo-haptics
   - Create loading states and skeleton loaders
   - Handle offline states gracefully

### File Structure
```
src/
├── screens/          # Screen components
├── components/       # Reusable UI components
├── navigation/       # Navigation configuration
├── styles/          # Styling and themes
└── hooks/           # Custom React hooks
```

### Best Practices
- Use `OptimizedImage` component for image performance
- Implement proper loading states with `SkeletonLoader`
- Follow atomic design principles for component organization
- Ensure accessibility with proper labels and hints

---

## 🔧 Backend API Agent

### Role Description
Manages server-side logic, API integrations, and cloud functions, specializing in Cloudflare Workers and OpenAI integrations.

### Core Technologies
- **API Gateway**: Cloudflare Workers
- **AI Provider**: OpenAI GPT-4 Vision
- **HTTP Client**: Axios with retry logic
- **Image Processing**: Base64 encoding, Expo FileSystem

### Key Responsibilities
1. **API Integration**
   - Manage OpenAI service (`src/services/openai.js`)
   - Configure Cloudflare Worker endpoints
   - Handle API timeouts and retries
   - Implement request/response logging

2. **Recipe Processing**
   - Analyze food images with GPT-4 Vision
   - Generate recipes from ingredients
   - Validate recipe units (`src/utils/recipeUnitValidator.js`)
   - Handle recipe calculations (`src/utils/recipeCalculations.js`)

3. **Cloud Functions**
   - Deploy Cloudflare Workers
   - Manage environment variables
   - Handle CORS configuration
   - Implement rate limiting

4. **Data Validation**
   - Validate recipe formats
   - Fix unit inconsistencies
   - Ensure data integrity
   - Handle error responses

### Configuration
```javascript
// API Configuration (src/services/openai.js)
const API_CONFIG = {
  WORKER_URL: 'https://recipe-ai-worker.*.workers.dev',
  TIMEOUT: 120000, // 2 minutes
  MAX_RETRIES: 2,
  RETRY_DELAY: 2000
};
```

### Best Practices
- Always validate and sanitize API responses
- Implement proper error handling with fallbacks
- Use structured logging for debugging
- Cache API responses when appropriate

---

## 🔐 Authentication & Security Agent

### Role Description
Handles user authentication, authorization, and security features using Clerk and platform-specific security measures.

### Core Technologies
- **Auth Provider**: Clerk (@clerk/clerk-expo)
- **Token Storage**: Secure token cache
- **OAuth**: Apple Sign-In, Google Sign-In
- **Privacy**: App Tracking Transparency (ATT)

### Key Responsibilities
1. **Authentication Setup**
   - Configure Clerk provider (`src/auth/ClerkProvider.js`)
   - Implement auth gate (`src/auth/AuthGate.js`)
   - Manage auth screens (`src/auth/screens/`)
   - Handle OAuth flows

2. **User Management**
   - Manage user profiles
   - Handle onboarding flow
   - Implement sign-out functionality
   - Track user preferences

3. **Security Features**
   - Implement secure token storage
   - Handle biometric authentication
   - Manage API key security
   - Implement privacy controls

4. **Environment Configuration**
   - Manage Clerk API keys per environment
   - Configure OAuth redirect URLs
   - Handle deep linking for auth

### Configuration Files
```
src/auth/
├── ClerkProvider.js    # Main auth provider
├── ClerkConfig.js      # Environment-specific config
├── AuthGate.js         # Auth state management
└── screens/            # Auth UI screens
```

### Environment Variables
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*
```

### Best Practices
- Never expose API keys in code
- Use environment-specific configurations
- Implement proper session management
- Handle auth errors gracefully

---

## 💰 Monetization Agent

### Role Description
Manages subscription systems, in-app purchases, and monetization strategies using RevenueCat.

### Core Technologies
- **Subscription Platform**: RevenueCat (react-native-purchases)
- **Subscription Tiers**: Free, Premium ($4.99/month), Ultimate ($12.99/month)
- **Paywall System**: Progressive paywall with smart prompts
- **Usage Tracking**: Custom usage limits and counters

### Key Responsibilities
1. **Subscription Management**
   - Initialize RevenueCat (`src/services/revenueCat.js`)
   - Manage subscription context (`src/contexts/SubscriptionContext.js`)
   - Handle subscription tiers (`src/config/subscriptionTiers.js`)
   - Track entitlements

2. **Paywall Implementation**
   - Create paywall modals (`src/components/subscription/PaywallModal.js`)
   - Implement smart prompt system
   - Show usage limits (`src/components/ui/UsageLimitDisplay.js`)
   - Handle purchase flow

3. **Usage Tracking**
   - Monitor API usage (`src/services/usageTracker.js`)
   - Implement daily/monthly limits
   - Track feature usage
   - Handle limit exceeded states

4. **Revenue Analytics**
   - Track conversion events
   - Monitor subscription metrics
   - Implement A/B testing
   - Analyze user segments

### Subscription Configuration
```javascript
// Subscription Tiers (src/config/subscriptionTiers.js)
const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    limits: { daily_scans: 3, monthly_scans: 30 }
  },
  PREMIUM: {
    id: 'premium',
    product_id: 'premium_monthly_4_99',
    limits: { daily_scans: 25, monthly_scans: 500 }
  },
  ULTIMATE: {
    id: 'ultimate',
    product_id: 'ultimate_monthly_12_99',
    limits: { unlimited: true }
  }
};
```

### Best Practices
- Test subscriptions in sandbox environment
- Implement restore purchases functionality
- Handle subscription states properly
- Provide clear value propositions

---

## 📊 Analytics & Monitoring Agent

### Role Description
Implements comprehensive analytics, error tracking, and performance monitoring using Sentry and custom analytics.

### Core Technologies
- **Error Tracking**: Sentry (@sentry/react-native)
- **Analytics**: Custom analytics manager
- **Logging**: Structured logging system
- **Performance**: Performance monitoring

### Key Responsibilities
1. **Error Monitoring**
   - Configure Sentry (`App.js`)
   - Track JavaScript errors
   - Monitor native crashes
   - Set up error boundaries

2. **Event Tracking**
   - Implement analytics manager (`src/utils/analytics.js`)
   - Track user events
   - Monitor feature usage
   - Create conversion funnels

3. **Performance Monitoring**
   - Track app performance metrics
   - Monitor API response times
   - Identify performance bottlenecks
   - Optimize rendering performance

4. **Logging System**
   - Implement structured logging (`src/utils/logger.js`)
   - Configure log levels
   - Handle debug/production modes
   - Store logs for debugging

### Sentry Configuration
```javascript
// Sentry Setup (App.js)
Sentry.init({
  dsn: SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter development errors
    return event;
  }
});
```

### Analytics Events
```javascript
// Track events (src/utils/analytics.js)
analyticsManager.trackEvent('recipe_saved', {
  recipe_id: recipeId,
  source: 'camera',
  subscription_tier: userTier
});
```

### Best Practices
- Implement privacy-compliant tracking
- Use structured event naming
- Monitor critical user journeys
- Set up alerts for critical errors

---

## 💾 Data Management Agent

### Role Description
Handles local data storage, caching strategies, and offline functionality using AsyncStorage.

### Core Technologies
- **Local Storage**: AsyncStorage
- **Image Caching**: Expo FileSystem
- **State Management**: React Context
- **Data Persistence**: Custom storage managers

### Key Responsibilities
1. **Recipe Storage**
   - Manage recipe storage (`src/utils/recipeStorage.js`)
   - Handle recipe CRUD operations
   - Implement image persistence
   - Manage recipe history

2. **Shopping Lists**
   - Store shopping list items (`src/utils/storage.js`)
   - Organize by categories
   - Handle item states
   - Sync across sessions

3. **User Preferences**
   - Store user settings
   - Manage onboarding data
   - Cache user preferences
   - Handle theme preferences

4. **Offline Support**
   - Implement offline manager (`src/utils/offlineManager.js`)
   - Queue API requests
   - Sync when online
   - Handle conflict resolution

### Storage Keys
```javascript
const STORAGE_KEYS = {
  SAVED_RECIPES: 'savedRecipes',
  RECIPE_HISTORY: 'recipeHistory',
  USER_PREFERENCES: 'user_preferences',
  SHOPPING_LIST: 'shoppingList',
  RECIPE_NOTES: 'recipeNotes'
};
```

### Best Practices
- Implement data migration strategies
- Handle storage limits gracefully
- Use efficient data structures
- Implement proper data validation

---

## 🚀 DevOps & CI/CD Agent

### Role Description
Manages build processes, continuous integration, deployment pipelines, and environment configurations.

### Core Technologies
- **Build System**: EAS Build
- **CI/CD**: GitHub Actions
- **Deployment**: Expo updates, App Store Connect
- **Version Control**: Git-based versioning

### Key Responsibilities
1. **Build Configuration**
   - Configure EAS build (`eas.json`)
   - Manage app.config.js
   - Handle environment variables
   - Set up build profiles

2. **CI/CD Pipelines**
   - GitHub Actions workflows (`.github/workflows/`)
   - Automated testing
   - Build triggers
   - Deployment automation

3. **Environment Management**
   - Development environment
   - Test/UAT environment
   - Production environment
   - Environment-specific configurations

4. **Release Management**
   - Version bumping (`scripts/get-version.js`)
   - Release notes generation
   - App Store submissions
   - OTA updates

### Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "test": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

### GitHub Actions Workflow
```yaml
# .github/workflows/eas-build-deploy.yml
on:
  push:
    branches: [main, develop]
    tags: ['v*']
jobs:
  build:
    - uses: expo/expo-github-action
    - run: eas build --platform ios
```

### Best Practices
- Use semantic versioning
- Automate repetitive tasks
- Implement proper branching strategy
- Monitor build performance

---

## 🎯 Marketing & Landing Page Agent

### Role Description
Develops and maintains marketing websites, landing pages, and email marketing integrations.

### Core Technologies
- **Landing Page**: React with Framer Motion
- **Hosting**: Cloudflare Pages
- **Email Marketing**: MailerLite API
- **Analytics**: Web analytics integration

### Key Responsibilities
1. **Landing Page Development**
   - Build React landing page (`landing_zone/`)
   - Implement animations
   - Create responsive designs
   - Optimize for SEO

2. **Email Marketing**
   - MailerLite integration (`landing_zone/src/services/MailerLiteService.js`)
   - Newsletter subscriptions
   - Email campaigns
   - Subscriber management

3. **App Store Assets**
   - Manage screenshots (`app-store-assets/`)
   - Write app descriptions
   - Create promotional materials
   - Handle app store optimization

4. **Marketing Analytics**
   - Track conversions
   - Monitor traffic sources
   - A/B testing
   - User acquisition metrics

### Landing Page Structure
```
landing_zone/
├── src/
│   ├── components/    # UI components
│   ├── pages/        # Route pages
│   └── services/     # API services
└── public/           # Static assets
```

### Best Practices
- Optimize page load speed
- Implement proper meta tags
- Use responsive images
- Track conversion goals

---

## 🤖 AI & ML Integration Agent

### Role Description
Integrates artificial intelligence and machine learning capabilities, focusing on recipe generation and image analysis.

### Core Technologies
- **AI Provider**: OpenAI GPT-4 Vision
- **Image Processing**: Vision API, Base64 encoding
- **Recipe Generation**: Custom prompts and validation
- **Recommendation Engine**: User preference learning

### Key Responsibilities
1. **Image Analysis**
   - Process food images
   - Identify ingredients
   - Detect dishes
   - Extract recipe information

2. **Recipe Generation**
   - Create recipes from ingredients
   - Generate cooking instructions
   - Calculate nutritional information
   - Suggest variations

3. **Smart Features**
   - Cooking tips engine (`src/utils/cookingTipsEngine.js`)
   - Recipe recommendations (`src/utils/recommendationEngine.js`)
   - Dietary adaptations
   - Portion adjustments

4. **Prompt Engineering**
   - Optimize GPT prompts
   - Handle edge cases
   - Improve accuracy
   - Reduce token usage

### AI Service Configuration
```javascript
// Smart OpenAI Service (src/services/smartOpenAI.js)
const analyzeImage = async (imageBase64) => {
  const prompt = `Analyze this food image and provide:
    1. List of visible ingredients
    2. Suggested recipe name
    3. Cooking instructions
    4. Nutritional estimates`;
  // API call implementation
};
```

### Best Practices
- Implement fallback mechanisms
- Cache AI responses
- Validate AI outputs
- Monitor API costs

---

## 🧪 QA & Testing Agent

### Role Description
Ensures bullet journal app quality through comprehensive testing of OCR accuracy, Apple integration, and BuJo-specific workflows.

### Core Technologies
- **Unit Testing**: Jest for BuJo parser and utility functions
- **Integration Testing**: React Native Testing Library
- **OCR Testing**: Custom test suites for handwriting recognition
- **Apple Integration Testing**: EventKit and Share Sheet validation

### Key Responsibilities
1. **BuJo-Specific Testing**
   - Test bullet journal parser accuracy (`src/services/parser/__tests__/`)
   - Validate OCR recognition for different handwriting styles
   - Test migration workflows and collection management
   - Verify Apple Reminders/Calendar sync accuracy

2. **OCR Quality Assurance**
   - Maintain test image library (printed/handwritten samples)
   - Automated accuracy testing for symbol recognition
   - Performance benchmarking for image processing
   - Edge case testing (poor lighting, skewed pages)

3. **Apple Integration Testing**
   - EventKit permission and API testing
   - Bidirectional sync validation
   - Share Sheet functionality verification
   - CloudKit sync conflict resolution testing

4. **User Experience Validation**
   - BuJo workflow user testing
   - Accessibility compliance for journal navigation
   - Subscription paywall and upgrade flow testing
   - Privacy compliance and data handling verification

### Testing Configuration
```typescript
// Test Example (src/services/parser/__tests__/BuJoParser.test.ts)
describe('BuJo Parser', () => {
  test('parses task bullets correctly', () => {
    const text = '• Complete project documentation';
    const entries = BuJoParser.parse(text);
    expect(entries[0].type).toBe('task');
    expect(entries[0].status).toBe('incomplete');
  });
  
  test('extracts contexts and tags', () => {
    const text = '• Review @work presentation #quarterly';
    const entries = BuJoParser.parse(text);
    expect(entries[0].contexts).toContain('work');
    expect(entries[0].tags).toContain('quarterly');
  });
});
```

### Best Practices
- Maintain high test coverage
- Automate regression testing
- Test edge cases thoroughly
- Document test scenarios

---

## 🔄 Integration Guidelines

### Agent Collaboration for Bullet Journal App
Each agent should work in harmony with others:
1. BuJo UI/UX Agent coordinates with Vision & OCR Agent for camera interface
2. Apple Integration Agent provides native functionality to all other agents
3. BuJo Parser Agent processes output from Vision & OCR Agent
4. Authentication & Security Agent ensures privacy compliance across all agents
5. Analytics Agent tracks BuJo-specific metrics from all agent activities

### Communication Protocol
- Use structured logging for inter-agent communication
- Maintain clear interfaces between agent responsibilities
- Document API contracts and data schemas
- Implement proper error handling across boundaries

### Environment Setup
```bash
# Bullet Journal App Development Setup
npx create-expo-app@latest bullet-journal-app -t expo-template-blank-typescript
cd bullet-journal-app

# Install BuJo-specific dependencies
npx expo install expo-camera expo-image-picker expo-file-system
npm install @clerk/clerk-expo react-native-purchases
npm install @react-native-ml-kit/text-recognition
npm install zustand react-navigation

# Setup environment variables
cp .env.example .env.development
# Add: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, REVENUECAT_PUBLIC_KEY

# Development
npx expo start

# Production build with Apple integration
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### Code Standards
- Follow ESLint configuration
- Use Prettier for formatting
- Maintain consistent naming conventions
- Document complex logic with comments

---

## 📚 Resources & Documentation

### Key Documentation Files
- `README.md` - Project overview and setup
- `CLAUDE.md` - AI assistant instructions
- `docs/` - Technical documentation
- `app-store-assets/` - Marketing materials

### External Resources
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)

### Development Tools
- Expo Go - Development testing
- React DevTools - Component debugging
- Flipper - Native debugging
- Charles Proxy - Network debugging

---

## 🎯 Quick Start for New Projects

To use these agent definitions in a new project:

1. **Copy this AGENTS.md** to your new project
2. **Install base dependencies** from package.json
3. **Set up environment variables** for each service
4. **Configure build system** (EAS/GitHub Actions)
5. **Initialize services** (Clerk, RevenueCat, Sentry)
6. **Implement core features** following agent guidelines
7. **Deploy** using DevOps Agent procedures

Each agent can work independently or collaboratively to build comprehensive mobile applications with all the modern features users expect.