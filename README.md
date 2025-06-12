# Yalla

A cross-platform mobile application built with React Native, Expo, and Supabase, designed for a seamless user experience with a focus on performance and scalability.

## 📱 Features

- 🔐 User authentication and profiles
- 📱 Cross-platform (iOS & Android) support
- 🎨 Modern UI with custom animations
- 📷 Camera and media integration
- 🔄 Real-time data synchronization
- 💾 Offline support with AsyncStorage
- 🌐 Deep linking

## 🏗️ Architecture

The application follows a modern, component-based architecture with clear separation of concerns, built on the Expo platform with file-based routing.

## 🚀 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database & Backend**: Supabase
- **Authentication**: Supabase Auth & Expo Apple Authentication
- **Navigation**: Expo Router
- **State Management**: React Hooks with Context
- **UI Components**: Custom components with Expo UI libraries
- **Animations**: React Native Reanimated & Moti
- **Media**: Expo Camera, Image Picker, Audio & Video
- **Build & Deployment**: EAS Build

## 📦 Packages

### Core

- `react`: 19.0.0
- `react-native`: 0.79.2
- `expo`: ^53.0.9
- `expo-router`: ~5.0.0
- `@supabase/supabase-js`: ^2.49.8

### UI & Animation

- `@expo/vector-icons`: ^14.1.0
- `@gorhom/bottom-sheet`: ^5.1.6
- `expo-blur`: ~14.1.0
- `expo-linear-gradient`: ~14.1.5
- `lottie-react-native`: 7.2.2
- `moti`: ^0.30.0
- `react-native-actions-sheet`: ^0.9.7
- `react-native-gesture-handler`: ~2.24.0
- `react-native-linear-gradient`: ^2.8.3
- `react-native-modal`: ^14.0.0-rc.1
- `react-native-reanimated`: ~3.17.0
- `react-native-skeleton-placeholder`: ^5.2.4
- `react-native-svg`: 15.11.2

### Navigation & Layout

- `@react-navigation/bottom-tabs`: ^7.0.0
- `@react-navigation/native`: ^7.0.0
- `@react-native-masked-view/masked-view`: ^0.2.9
- `react-native-safe-area-context`: 5.4.0
- `react-native-screens`: ~4.10.0

### Media & Assets

- `expo-camera`: ~16.1.0
- `expo-audio`: ^0.4.5
- `expo-image-manipulator`: ~13.1.0
- `expo-image-picker`: ^16.1.4
- `expo-media-library`: ~17.1.0
- `expo-video`: ~2.1.9
- `react-native-image-colors`: ^2.3.0

### Authentication & Data

- `expo-apple-authentication`: ~7.2.4
- `@react-native-async-storage/async-storage`: ^2.1.2
- `react-native-url-polyfill`: ^2.0.0

## 📊 Version Information

- **App Version**: 1.0.0
- **React Native**: 0.79.2
- **Expo SDK**: 53.0.9
- **React**: 19.0.0
- **TypeScript**: 5.3.0
- **Supabase JS**: 2.49.8

## 🛠️ Development Setup

1. **Prerequisites**

   - Node.js 16+
   - npm
   - Expo CLI
   - For iOS development: macOS with Xcode
   - For Android development: Android Studio with SDK

2. **Environment Variables**
   Create a `.env` file in the root directory with your Supabase credentials.

3. **Installation**

   ```bash
   git clone https://github.com/tahahasan7/yalla.git

   npm install
   ```

4. **Development Server**

   ```bash
   npx expo start

   ```

5. **Build**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

## 📁 Project Structure

```
yalla/
├── src/
│   ├── app/            # Application screens and navigation (Expo Router)
│   ├── components/     # Reusable UI components
│   ├── constants/      # App constants and configuration
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core functionality and utilities
│   ├── services/       # API services and data handling
│   └── types/          # TypeScript type definitions
├── assets/             # Static assets (images, fonts, etc.)
├── supabase/           # Supabase configuration and migrations
├── App.tsx             # Main application entry point
└── app.json            # Expo configuration
```

## 🔐 Authentication

Authentication is handled through Supabase Auth with:

- Email/Password authentication
- Apple authentication (via expo-apple-authentication)
- Protected routes
- User profiles
- Session management

## 💾 Database

The application uses Supabase with tables for:

- User profiles
- Application data
- Media references

## 🎯 Key Design Decisions

1. **Expo Platform**

   - Used Expo for rapid development and easy deployment
   - Leveraged Expo's extensive native module library
   - File-based routing with Expo Router

2. **UI/UX**

   - Custom animations for a polished user experience
   - Responsive design for various device sizes
   - Skeleton loading states for better perceived performance

3. **Performance**

   - Optimized image loading and caching
   - Efficient re-rendering with memoization
   - Background data synchronization

4. **Offline Support**
   - Local data persistence with AsyncStorage
   - Optimistic UI updates
   - Background sync when connection is restored

## 🔜 Roadmap

The following features and improvements are planned for future releases:

- **Must**

  - Push notification integration
  - Enhanced analytics dashboard
  - Performance optimizations for low-end devices

- **Later**

  - Social media sharing integration
  - User-to-user messaging
  - Additional authentication methods

- **Possible**
  - Machine learning features
  - Advanced search capabilities
  - Web platform support

## 🔒 Security

We take security seriously in the Yalla application:

- All API requests are authenticated and encrypted using HTTPS
- User data is stored securely in Supabase with row-level security policies
- Authentication tokens are stored securely using AsyncStorage with proper encryption
- Regular security audits are conducted on the codebase

### Reporting Security Issues

If you discover a security vulnerability, please DO NOT open an issue. Email me instead.

## 📚 Resources

### Official Documentation

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Layouts](https://docs.expo.dev/router/basics/layout/)
- [EAS Update with Dev Client](https://docs.expo.dev/eas-update/expo-dev-client/)
- [Expo Media Library](https://docs.expo.dev/versions/latest/sdk/media-library/)
- [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/#development-and-testing)
- [Expo Splash Screen & App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/)
- [EAS JSON Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo SDK 53 Beta Changelog](https://expo.dev/changelog/sdk-53-beta)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Signout](https://supabase.com/docs/guides/auth/signout)
- [Supabase Google Authentication](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=react-native)
- [Supabase Apple Authentication](https://supabase.com/docs/guides/auth/social-login/auth-apple?queryGroups=platform&platform=react-native#configure-your-services-id)

### UI Components & Animation

- [React Native Bottom Sheet](https://gorhom.dev/react-native-bottom-sheet/scrollables)
- [React Native Actions Sheet](https://www.reddit.com/r/reactnative/comments/1kwx389/react_native_actions_sheet_broken/#:~:text=Actually%2C%20the%20lib%20works%20perfectly,it%20unusable%20on%20android%20mostly)
- [Moti Skeleton Component](https://moti.fyi/skeleton)
- [Skeleton Loaders in React Native](https://medium.com/@andrew.chester/react-native-skeleton-loaders-elevate-your-apps-ux-with-shimmering-placeholders-5003b9507117)

### External APIs

- [Artlist](https://artlist.io) - Music licensing platform
- [Quotable Quotes API](https://publicapi.dev/quotable-quotes-api) - API for quotes

### Issue Tracking & Discussions

- [Expo GitHub Discussion #36551](https://github.com/expo/expo/discussions/36551)
- [Supabase JS Issue #1400](https://github.com/supabase/supabase-js/issues/1400)

### AI Assistants Used

The development of this application was assisted by the following AI tools:

- **Claude** (Anthropic) - Used for code generation, debugging, and architecture planning
- **ChatGPT** (OpenAI) - Used for solving specific coding challenges and API integration
- **Gemini** (Google) - Used for UI/UX suggestions and optimization recommendations

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 👤 Author

- **Taha Hasan** - _Initial work_ - [tahahasan7](https://github.com/tahahasan7)
- ✉️ **Email**: taha.hasan@student.ehb.be
