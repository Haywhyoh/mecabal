# MeCabal - Nigerian Community Platform
*"NextDoor for Nigeria" - Connecting Neighborhoods, Estates, and Compounds*

## 🇳🇬 About MeCabal

MeCabal is a comprehensive community application designed specifically for Nigerian neighborhoods, estates, and compounds. The platform facilitates genuine connections, local commerce, community events, and safety features tailored to Nigerian culture and context.

## 🏗️ Project Architecture

### **Hybrid Backend Strategy**

MeCabal uses a **two-phase hybrid architecture** that balances rapid time-to-market with long-term scalability:

- **Phase 1 (MVP - 4-6 weeks)**: Supabase-powered backend for rapid development
- **Phase 2 (Scale - 3-6 months)**: Migration to hybrid Supabase + NestJS microservices

```
Current Implementation:
Mobile App (React Native) → Supabase Platform → Nigerian Integrations
```

**Key Benefits:**
- ✅ **60% faster MVP development** vs traditional backend
- ✅ **Built-in real-time features** for community engagement  
- ✅ **Nigerian-specific integrations** via Edge Functions
- ✅ **Clear migration path** to full microservices architecture

## 📱 Mobile Application

### Technology Stack
- **Framework**: React Native with Expo (~53.0.20)
- **Navigation**: React Navigation v7
- **UI Components**: React Native Paper + React Native Elements
- **Location Services**: Expo Location + React Native Maps
- **Storage**: AsyncStorage + SecureStore
- **Language**: TypeScript

### Nigerian Cultural Integration
- **Terminology**: "Estate" and "Compound" instead of "Neighborhood"
- **Phone Verification**: Nigerian carriers (MTN, Airtel, Glo, 9mobile)
- **Currency**: Naira (₦) formatting and calculations
- **Languages**: English, Hausa, Yoruba, Igbo support
- **Cultural Context**: Nigerian-specific UI patterns and references

## 🔧 Backend Architecture

### **Phase 1: Supabase Foundation**

```
supabase-integration/
├── database/
│   ├── schema.sql              # Nigerian-optimized database schema
│   └── functions/              # PostGIS location functions
├── edge-functions/
│   ├── nigerian-phone-verify/  # MTN/Airtel/Glo/9mobile OTP
│   ├── paystack-payment/       # Nigerian payment processing
│   └── location-services/      # Estate/compound verification
├── mobile-integration/
│   └── supabase-client.ts      # React Native integration
└── documentation/
    └── supabase-setup.md       # Complete setup guide
```

**Core Features:**
- **Authentication**: Nigerian phone verification (+234)
- **Real-time**: WebSocket-based community feeds and messaging
- **Geolocation**: PostGIS-powered estate/compound mapping
- **Payments**: Paystack integration for marketplace transactions
- **Storage**: S3-compatible media upload and management

### **Phase 2: NestJS Microservices (Future)**

```
backend-phase2-nestjs/
├── apps/                       # Microservices
│   ├── api-gateway/           # Request routing
│   ├── marketplace-service/   # Advanced commerce features
│   ├── trust-safety/          # AI content moderation
│   ├── nigerian-integration/  # Local payment/compliance
│   └── analytics-service/     # Business intelligence
└── libs/                      # Shared libraries
```

**Migration Benefits:**
- Complex marketplace features (escrow, trust scoring)
- Advanced Nigerian integrations (NIN verification, local compliance)
- AI-powered content moderation and safety
- Comprehensive analytics and business intelligence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Nigerian SMS service API (production)
- Paystack account (payments)

### Development Setup

1. **Clone and Install**
```bash
git clone https://github.com/your-username/mecabal.git
cd mecabal
```

2. **Mobile App Setup**
```bash
cd Hommie_Mobile
npm install
```

3. **Supabase Integration**
```bash
cd ../supabase-integration
# Follow supabase-setup.md for complete configuration
```

4. **Environment Configuration**
```bash
# Hommie_Mobile/.env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# supabase-integration/.env.local  
PAYSTACK_SECRET_KEY=your-paystack-key
NIGERIAN_SMS_API_KEY=your-sms-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

5. **Run Development**
```bash
# Mobile app
cd Hommie_Mobile
npm start

# Choose platform: iOS (i), Android (a), or Web (w)
```

## 🏘️ Core Features

### Community Engagement
- **Estate/Compound Feeds**: Location-based community posts
- **Real-time Messaging**: Direct and group chat between neighbors
- **Community Events**: Local gatherings, meetings, celebrations
- **Safety Alerts**: Incident reporting and neighborhood watch

### Local Commerce
- **Marketplace**: Buy/sell within neighborhoods
- **Service Directory**: Local professionals and services
- **Nigerian Payments**: Paystack integration with Naira support
- **Trust System**: Community-driven reputation scoring

### Nigerian Context
- **Location Verification**: GPS-based estate/compound verification
- **Cultural Categories**: Religious, cultural, business events
- **Multi-language**: English, Pidgin, and local languages
- **Local Business**: Integration with Nigerian SMEs

## 📊 Development Progress

### ✅ Completed (Phase 1 Foundation)
- Mobile app architecture and navigation
- Nigerian-themed design system and UX
- Authentication screens with cultural context
- Supabase integration structure
- Database schema with Nigerian geolocation
- Edge Functions for Nigerian services
- Comprehensive documentation

### 🔄 In Progress (Phase 1 MVP)
- Supabase database deployment
- Edge Functions deployment and testing
- Mobile app backend integration
- Nigerian SMS service integration
- Paystack payment processing
- Real-time features implementation

### 📋 Upcoming (Phase 1 Completion)
- Community feed and posting system
- Event creation and RSVP functionality
- Basic marketplace with payment processing
- Safety alert system
- Beta testing with Nigerian users
- MVP launch and user feedback collection

## 📁 Project Structure

```
mecabal/
├── Hommie_Mobile/                 # React Native mobile application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── constants/            # Design system and Nigerian data
│   │   ├── contexts/             # React contexts for state
│   │   ├── screens/              # Main app screens
│   │   └── services/             # API and external services
│   ├── assets/                   # Images, icons, media
│   ├── CLAUDE.md                 # Mobile-specific development guide
│   └── ux.md                     # Nigerian design system guide
├── supabase-integration/          # Phase 1 backend implementation
│   ├── database/                 # Schema and functions
│   ├── edge-functions/           # Nigerian business logic
│   ├── mobile-integration/       # React Native client
│   └── documentation/            # Setup and deployment guides
├── backend-phase2-nestjs/         # Phase 2 microservices (archived)
├── HYBRID_BACKEND_ARCHITECTURE.md # Complete architecture overview
└── documentation/                 # Project-wide documentation
```

## 🇳🇬 Nigerian Market Focus

### Target Communities
- **Lagos**: Victoria Island, Ikoyi, Lekki, Ikeja estates
- **Abuja**: Maitama, Asokoro, Wuse residential areas
- **Port Harcourt**: GRA, Trans Amadi residential estates
- **Kano**: Nassarawa GRA, Bompai housing estates

### Cultural Integration
- **Local Languages**: Hausa, Yoruba, Igbo interface options
- **Payment Methods**: Naira-focused with local banking integration
- **Business Hours**: Nigerian timezone and working hours
- **Cultural Events**: Traditional festivals, religious gatherings
- **Safety Context**: Community policing and neighborhood watch

## 📈 Success Metrics

### Phase 1 Targets (6 weeks)
- **1,000+ registered users** across target cities
- **100+ daily active users** per estate
- **500+ community posts** weekly
- **50+ marketplace listings** weekly
- **95% app uptime** with responsive performance

### Phase 2 Targets (6 months)
- **10,000+ active users** across Nigeria
- **₦1M+ monthly GMV** in marketplace transactions
- **50+ verified estates** with active communities
- **90%+ user satisfaction** with community features
- **5+ cities** with active user bases

## 🛠️ Development Commands

### Mobile App (Hommie_Mobile/)
```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator  
npm run android    # Run on Android emulator
npm run web        # Run on web browser
```

### Supabase Integration
```bash
supabase start     # Start local development
supabase db reset  # Reset database with schema
supabase functions deploy  # Deploy edge functions
supabase db push   # Push schema changes
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards in `CLAUDE.md`
4. Test thoroughly with Nigerian context in mind
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- Follow React Native and TypeScript best practices
- Use the Nigerian design system from `ux.md`
- Include cultural context in UI/UX decisions
- Test with Nigerian phone numbers and addresses
- Optimize for varying internet connectivity

## 📚 Documentation

- **[HYBRID_BACKEND_ARCHITECTURE.md](HYBRID_BACKEND_ARCHITECTURE.md)**: Complete technical architecture
- **[Hommie_Mobile/CLAUDE.md](Hommie_Mobile/CLAUDE.md)**: Mobile app development guide
- **[Hommie_Mobile/ux.md](Hommie_Mobile/ux.md)**: Nigerian design system and style guide
- **[supabase-integration/documentation/](supabase-integration/documentation/)**: Backend setup guides

## 🔐 Security & Compliance

- **Data Privacy**: GDPR-compliant with Nigerian data protection considerations
- **Phone Verification**: Secure OTP system with Nigerian carriers
- **Payment Security**: PCI-compliant through Paystack integration
- **Location Privacy**: Granular controls for estate/compound sharing
- **Content Moderation**: Community-driven with AI assistance

## 📞 Support & Community

- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Community discussions and development chat
- **Email**: support@mecabal.app for general inquiries
- **Documentation**: Comprehensive guides in `/documentation`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Nigerian communities for inspiration and feedback
- Supabase for the excellent backend-as-a-service platform
- React Native and Expo teams for mobile development tools
- OpenStreetMap and Mapbox for Nigerian geolocation data
- Local Nigerian developers and advisors

---

**MeCabal** - *Building stronger Nigerian communities, one neighborhood at a time* 🇳🇬