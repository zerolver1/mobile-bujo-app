# Mobile BuJo App

A React Native bullet journal app that bridges analog and digital productivity workflows. Capture your handwritten bullet journal pages with OCR and seamlessly sync with Apple Reminders and Calendar.

## Features

- 📸 **Camera Capture**: Scan your handwritten bullet journal pages
- 🔤 **OCR Text Extraction**: Real text extraction from images using OCR.space API
- 📝 **Bullet Journal Parsing**: Automatically recognizes bullet journal notation
- 🍎 **Apple Integration**: Syncs tasks to Reminders and events to Calendar
- 💎 **Premium Features**: Subscription tiers with RevenueCat integration
- 🎨 **Beautiful UI**: Follows Apple Human Interface Guidelines

## Tech Stack

- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Zustand** for state management
- **OCR.space API** for text recognition
- **Apple EventKit** for iOS integration
- **RevenueCat** for subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zerolver1/mobile-bujo-app.git
cd mobile-bujo-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.development
```

4. Configure OCR services:
   - **Mistral AI (Recommended)**: Sign up at [console.mistral.ai](https://console.mistral.ai) and add your API key to `.env.development`
   - **OCR.space (Fallback)**: Included with demo key, get your own at [ocr.space](https://ocr.space/ocrapi)

5. Start the development server:
```bash
npm start
```

6. Run on iOS Simulator:
```bash
npm run ios
```

## Bullet Journal Notation

The app recognizes standard bullet journal symbols:

- `•` Task (bullet)
- `○` Event (circle)  
- `—` Note (dash)
- `x` Completed task
- `>` Migrated task
- `<` Scheduled task
- `!` Priority indicator
- `@context` Context tags
- `#tag` Hashtags

## Project Structure

```
src/
├── screens/          # Screen components
├── services/         # Business logic services
│   ├── ocr/         # OCR implementations
│   ├── parser/      # BuJo notation parser
│   └── apple-integration/  # iOS native integration
├── stores/          # Zustand stores
├── types/           # TypeScript definitions
└── navigation/      # React Navigation setup
```

## OCR Services

The app supports multiple OCR providers for maximum accuracy:

### Primary: Mistral AI OCR
- **99%+ accuracy** for handwritten text
- **AI-powered** bullet journal understanding
- **Structured extraction** - directly parses BuJo notation
- **Cost**: $0.001 per page
- **Setup**: Add `EXPO_PUBLIC_MISTRAL_API_KEY` to your environment

### Fallback: OCR.space API
- Free tier: 25,000 requests/month
- Basic handwriting recognition
- Works with Expo managed workflow
- Automatically used if Mistral OCR is unavailable

## Apple Integration

Native iOS module for EventKit integration:
- Creates dedicated "Bullet Journal" calendar and reminders list
- Syncs tasks to Apple Reminders
- Syncs events to Apple Calendar
- Preserves contexts, tags, and priorities

## Subscription Tiers

- **Free**: 5 scans/month
- **Premium** ($4.99/month): 100 scans/month
- **Ultimate** ($9.99/month): Unlimited scans

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Bullet Journal® is a registered trademark of Ryder Carroll
- Built with React Native and Expo
- OCR powered by OCR.space API