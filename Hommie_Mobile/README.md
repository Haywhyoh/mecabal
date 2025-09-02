# MeCabal Mobile App

**NextDoor for Nigeria - Connect with your neighborhood community**

## 🚀 Project Overview

MeCabal is a mobile application designed to foster community connection, information exchange, and collaboration among individuals living in various neighborhoods across Nigeria. The app allows users to interact with their neighbors, share local news, organize events, seek services, and offer recommendations, all within a trusted and geographically relevant environment.

## ✨ Features

### Core Features (MVP)
- **User Authentication**: Phone number + OTP verification
- **Neighborhood Discovery**: Location-based community matching
- **Community Feed**: Share and view local posts
- **Events Management**: Create and join neighborhood events
- **User Profiles**: Manage personal information and preferences

### Advanced Features (Future Releases)
- **Marketplace**: Buy, sell, and trade local items
- **Safety Alerts**: Report and receive neighborhood safety updates
- **Community Groups**: Interest-based neighborhood groups
- **Local Services**: Directory of neighborhood service providers
- **Push Notifications**: Stay updated on community activities

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper + React Native Elements
- **State Management**: React Hooks + Context API
- **Storage**: AsyncStorage + SecureStore
- **Location**: Expo Location + React Native Maps
- **Notifications**: Expo Notifications
- **Media**: Expo Image Picker + Camera

## 📱 Platform Support

- ✅ iOS (iPhone & iPad)
- ✅ Android
- ✅ Web (Progressive Web App)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MeCabal_Mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API and external services
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── constants/          # App constants
└── assets/             # Images, fonts, etc.
```

## 🔧 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run build` - Build for production
- `npm run eject` - Eject from Expo managed workflow

### Code Style

- Use TypeScript for all new code
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component and function names

### Testing

- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows
- Manual testing on various devices

## 📱 App Screens

### Authentication
- **Login Screen**: Phone number + OTP verification
- **Register Screen**: User registration with neighborhood selection

### Main App
- **Home Screen**: Quick actions and recent activity
- **Feed Screen**: Community posts and updates
- **Events Screen**: Local events and calendar
- **Marketplace Screen**: Buy/sell items and services
- **Profile Screen**: User profile and settings

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=https://api.MeCabal.ng
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_SMS_SERVICE_API_KEY=your_sms_service_api_key
```

## 📊 Development Phases

### Phase 1: Foundation (Months 1-2)
- [x] Project setup and configuration
- [x] Basic navigation structure
- [x] Screen components
- [ ] Authentication system
- [ ] Basic UI components

### Phase 2: Core Features (Months 3-4)
- [ ] User profiles and neighborhoods
- [ ] Community feed
- [ ] Events system
- [ ] Basic marketplace

### Phase 3: Advanced Features (Months 5-6)
- [ ] Safety alerts
- [ ] Community groups
- [ ] Payment integration
- [ ] Advanced notifications

### Phase 4: Polish (Month 7)
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Testing and bug fixes

### Phase 5: Launch (Month 8)
- [ ] Final testing
- [ ] App store submission
- [ ] Marketing launch

## 🚨 Known Issues

- Some dependencies may show deprecation warnings (these are being addressed)
- Vector icons package needs migration to new model
- ESLint version needs updating

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@MeCabal.ng
- **Website**: https://MeCabal.ng
- **Documentation**: [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous improvements
- Nigerian tech community for inspiration and support

---

**Built with ❤️ for Nigerian communities**