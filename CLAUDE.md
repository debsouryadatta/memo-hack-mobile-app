# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native education app called "memo-hack" built with Expo and using file-based routing via Expo Router. The app appears to be designed for CBSE curriculum students to access educational content organized by subjects and chapters.

## Key Technologies & Architecture

- **Framework**: React Native with Expo (~53.0.12)
- **Routing**: Expo Router with file-based routing and typed routes enabled
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Convex for real-time database and API functions
- **UI Components**: Custom components with Lucide React Native icons
- **Fonts**: SpaceMono loaded via Expo Fonts

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start

# Platform-specific development
npm run android    # Android emulator
npm run ios        # iOS simulator  
npm run web        # Web browser

# Code quality
npm run lint       # ESLint with Expo config

# Reset project structure
npm run reset-project
```

## File Structure & Routing

The app uses Expo Router's file-based routing system:

- `app/_layout.tsx` - Root layout with theme provider and navigation
- `app/index.tsx` - Landing/entry screen
- `app/(auth)/` - Authentication group with sign-in flow
- `app/(tabs)/` - Main app with tab navigation
- `app/(tabs)/home/` - Home screen and subject-specific routes
- `app/(tabs)/home/[subject]/` - Dynamic routes for subjects (physics, biology)

## Data Structure

The app includes CBSE syllabus data in `constants/constants.ts` organized by:
- Classes: 9, 10, 11, 12
- Subjects: Physics, Biology
- Chapters: Detailed chapter lists for each class/subject combination

This suggests the app is designed to provide educational content following the CBSE curriculum structure.

## Authentication Flow

The app implements a phone number + OTP authentication system:
- Sign-in screen with phone number input
- OTP verification step
- Navigation to home screen upon successful authentication
- Mock implementation (no real OTP service integrated yet)

## Backend Integration

Convex is set up for backend functionality:
- Configuration files in `convex/` directory
- Generated API types and server code
- Schema planning included in `convex/README.md` for user management
- Database queries and mutations follow Convex patterns

## Styling System

- NativeWind for Tailwind-style classes in React Native
- Custom theme colors and gradients (primarily indigo/blue palette)
- Responsive design with proper mobile layouts
- Linear gradients used extensively for visual appeal

## Platform Configuration

- iOS: Tablet support enabled, adaptive icons configured
- Android: Edge-to-edge enabled, adaptive icon setup
- Web: Metro bundler with static output
- Universal app design across all platforms