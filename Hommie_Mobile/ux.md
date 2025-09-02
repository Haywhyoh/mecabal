# MeCabal Community App Style Guide
*Modern Nigerian Neighborhood Design System*

## 🎨 Brand Colors

### Primary Palette - Community Trust
- **MeCabal Green**: `#00A651` - Nigeria's pride, main brand color for trust
- **Deep Forest**: `#006B3C` - For pressed states, depth, security
- **Sage Light**: `#E8F5E8` - Gentle backgrounds, peaceful spaces
- **Community Mint**: `#B8E6B8` - Success states, positive connections

### Neutral Foundation - Clean & Approachable
- **Pure White**: `#FFFFFF` - Clean backgrounds, cards, fresh starts
- **Warm Off-White**: `#FAFAFA` - Secondary backgrounds, comfort
- **Soft Gray**: `#F5F5F5` - Gentle dividers, non-intrusive elements
- **Friendly Gray**: `#8E8E8E` - Secondary text, approachable guidance
- **Rich Charcoal**: `#2C2C2C` - Primary text, strong hierarchy
- **Deep Black**: `#000000` - High contrast, important information

### Accent Colors - Local Energy
- **Lagos Orange**: `#FF6B35` - Energy, community alerts, celebrations
- **Trust Blue**: `#0066CC` - Links, reliability, helpful information
- **Safety Red**: `#E74C3C` - Urgent alerts, safety notifications
- **Warm Gold**: `#FFC107` - Achievements, highlights, joy

### Community-Specific Colors
- **Neighbor Purple**: `#7B68EE` - Community connections, social features
- **Market Green**: `#228B22` - Local business, marketplace
- **Evening Blue**: `#4682B4` - Events, gatherings, nighttime activities
- **Sunrise Pink**: `#FF69B4` - Celebrations, positive news, community joy

## 📱 Typography

### Font Families (React Native)
- **Primary**: System fonts (`-apple-system`, `Roboto`)
- **Headings**: `System` with `fontWeight: '600'` or `'700'`
- **Body**: `System` with `fontWeight: '400'`
- **Captions**: `System` with `fontWeight: '300'`

### Font Scales
```javascript
const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36
}
```

### Text Hierarchy
- **H1**: 36px, Bold, Dark Gray - Page titles
- **H2**: 30px, SemiBold, Dark Gray - Section headers
- **H3**: 24px, SemiBold, Dark Gray - Sub-sections
- **H4**: 20px, Medium, Dark Gray - Card titles
- **Body Large**: 18px, Regular, Dark Gray - Important content
- **Body**: 16px, Regular, Dark Gray - Main text
- **Body Small**: 14px, Regular, Medium Gray - Secondary text
- **Caption**: 12px, Light, Medium Gray - Helper text, timestamps

## 📐 Spacing & Layout

### Spacing Scale (React Native units)
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
}
```

### Layout Guidelines
- **Screen Padding**: 16px horizontal, 24px top
- **Card Padding**: 16px all sides
- **Button Padding**: 12px vertical, 24px horizontal
- **Input Padding**: 16px all sides
- **Section Spacing**: 32px between major sections
- **Item Spacing**: 16px between related items

## 🔘 Components

### Buttons

#### Primary Button
```javascript
backgroundColor: '#00A651'
color: '#FFFFFF'
borderRadius: 8
paddingVertical: 12
paddingHorizontal: 24s
fontSize: 16
fontWeight: '600'
```

#### Secondary Button
```javascript
backgroundColor: 'transparent'
borderColor: '#00A651'
borderWidth: 2
color: '#00A651'
borderRadius: 8
paddingVertical: 12
paddingHorizontal: 24
```

#### Ghost Button
```javascript
backgroundColor: 'transparent'
color: '#00A651'
paddingVertical: 8
paddingHorizontal: 16
```

### Cards
```javascript
backgroundColor: '#FFFFFF'
borderRadius: 12
shadowColor: '#000000'
shadowOpacity: 0.1
shadowRadius: 8
shadowOffset: { width: 0, height: 2 }
elevation: 3 // Android
padding: 16
marginBottom: 16
```

### Input Fields
```javascript
backgroundColor: '#FAFAFA'
borderColor: '#F5F5F5'
borderWidth: 1
borderRadius: 8
paddingVertical: 16
paddingHorizontal: 16
fontSize: 16
color: '#2C2C2C'
```

### Navigation
- **Tab Bar Height**: 60px
- **Header Height**: 44px (iOS) / 56px (Android)
- **Tab Icon Size**: 24x24px
- **Active Tab Color**: `#00A651`
- **Inactive Tab Color**: `#8E8E8E`

## 📍 Nigerian Context Elements

### Cultural Considerations
- **Language Support**: English (primary), Pidgin English phrases
- **Local References**: Use "Estate", "Area", "Community" instead of "Neighborhood"
- **Currency**: Naira (₦) symbol and formatting
- **Time Format**: 12-hour format preferred
- **Phone Format**: +234 country code support

### Common UI Patterns
- **Location Format**: "Ikeja, Lagos" or "Garki, Abuja"
- **Business Hours**: "8:00 AM - 6:00 PM" format
- **Distance**: Use kilometers (km) and meters (m)
- **Emergency Numbers**: Include local emergency services

## 🎯 Modern Community UX Guidelines

### Navigation Philosophy - "Neighborhood First"
- **Bottom Tab Navigation** with community-focused icons and labels
- **Gesture-First Design** - Swipe between community sections naturally
- **Progressive Disclosure** - Show relevant info when needed, hide complexity
- **Context-Aware Navigation** - Location and time-sensitive navigation

### Information Architecture - "Your Digital Neighborhood"
1. **Community Hub** - Local updates, neighbor connections, safety updates
2. **Neighborhood Directory** - Local businesses, services, trusted recommendations  
3. **Events & Activities** - Community gatherings, local celebrations
4. **Marketplace** - Buy, sell, share within your community
5. **Safety Network** - Emergency contacts, safety alerts, neighborhood watch
6. **Your Profile** - Personal community presence and preferences

### Modern UX Patterns
- **Contextual Onboarding** - Progressive introduction to features
- **Community-Centric Design** - Always show local context and neighbors
- **Trust Indicators** - Verification badges, community endorsements
- **Inclusive Accessibility** - Works for all ages and tech comfort levels
- **Offline-Ready** - Core features work without internet
- **Privacy-First** - Clear controls over what neighbors can see

### Interaction States
- **Default State**: Clean, unambiguous
- **Hover State**: Subtle background color change
- **Active/Pressed**: Darker shade of primary color
- **Loading State**: Skeleton screens or spinners
- **Empty State**: Friendly illustrations with helpful text
- **Error State**: Clear error message with retry options

## 📱 Platform-Specific Guidelines

### iOS Considerations
- Use iOS-style navigation patterns
- Implement swipe-back gestures
- Follow iOS Human Interface Guidelines
- Use iOS-native modal presentations

### Android Considerations
- Material Design principles
- Use Android navigation patterns (back button)
- Implement Material shadows and elevations
- Follow Android design guidelines

## 🔧 Technical Specifications

### Image Guidelines
- **Profile Pictures**: 80x80px minimum, circular crop
- **Business Photos**: 16:9 aspect ratio preferred
- **Icons**: 24x24px for UI elements
- **Thumbnails**: 120x120px for grid layouts
- **Hero Images**: Device width, 200px height

### Performance
- **Image Optimization**: Use WebP format when possible
- **Lazy Loading**: Implement for lists and feeds
- **Caching**: Cache frequently accessed data
- **Offline Support**: Handle poor connectivity gracefully

## 🌟 Accessibility

### Requirements
- **Minimum Touch Target**: 44x44px
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
- **Screen Reader**: Meaningful labels and hints
- **Focus Management**: Clear focus indicators
- **Font Scaling**: Support dynamic type sizing

### Implementation
- Use `accessibilityLabel` for all interactive elements
- Implement `accessibilityHint` for complex actions
- Support VoiceOver/TalkBack navigation
- Test with high contrast mode enabled

## 📋 Content Guidelines

### Tone of Voice
- **Friendly**: Warm and approachable
- **Local**: Use familiar Nigerian expressions
- **Helpful**: Focus on community benefit
- **Trustworthy**: Clear and honest communication

### Writing Style
- Use active voice
- Keep sentences short and clear
- Include local context when relevant
- Be inclusive and respectful
- Avoid jargon and technical terms

## 🚨 Safety & Trust Indicators

### Visual Trust Elements
- **Verification Badges**: Green checkmark for verified accounts
- **Security Icons**: Lock icon for secure information
- **Community Guidelines**: Clear, accessible policies
- **Reporting Features**: Easy-to-find report buttons

### Safety Features
- **User Verification**: Phone number or ID verification
- **Content Moderation**: Clear community standards
- **Privacy Controls**: Granular privacy settings
- **Block/Report**: Easy blocking and reporting tools

---

## 💡 Usage Notes for AI Agents

When using this style guide to recreate app pages:

1. **Always start with the color palette** - Use primary green (#00A651) as the main brand color
2. **Follow spacing consistently** - Use the 8px grid system (8, 16, 24, 32px)
3. **Maintain hierarchy** - Use the typography scale for clear information hierarchy
4. **Consider context** - Remember this is for Nigerian users (locations, currency, culture)
5. **Focus on community** - Emphasize local connections and neighborhood feel
6. **Prioritize safety** - Include trust indicators and safety features
7. **Mobile-first** - Design for touch interaction and small screens
8. **Test accessibility** - Ensure sufficient contrast and touch targets

## 🚀 Modern Onboarding Experience

### Onboarding Philosophy - "Welcome to Your Digital Neighborhood"
- **Story-Driven Approach** - Show real community benefits, not features
- **Progressive Trust Building** - Build confidence step by step
- **Cultural Relevance** - Use familiar Nigerian contexts and language
- **Quick Wins Early** - Show immediate value before asking for commitment

### Onboarding Flow Structure
1. **Cultural Welcome** - Language selection with local context
2. **Community Vision** - Show what makes neighborhoods better
3. **Trust & Safety** - Explain verification and privacy
4. **Location Connection** - Help users find their digital neighborhood
5. **First Connections** - Introduce them to their new community

### Modern UI Components for Onboarding

#### Hero Cards
```javascript
backgroundColor: '#FFFFFF'
borderRadius: 20
padding: 24
marginHorizontal: 16
shadowColor: '#00A651'
shadowOpacity: 0.08
shadowRadius: 16
elevation: 8
```

#### Progress Indicators
```javascript
// Friendly dots instead of harsh progress bars
activeColor: '#00A651'
inactiveColor: '#E8F5E8'
size: 12
spacing: 8
```

#### Community-Focused CTAs
```javascript
primaryButton: {
  backgroundColor: '#00A651'
  borderRadius: 16
  paddingVertical: 16
  paddingHorizontal: 32
  marginBottom: 12
}

secondaryButton: {
  backgroundColor: 'transparent'
  borderColor: '#00A651'
  borderWidth: 2
  borderRadius: 16
  paddingVertical: 14
  paddingHorizontal: 32
}

ghostButton: {
  backgroundColor: 'transparent'
  paddingVertical: 12
  paddingHorizontal: 16
  underlineColor: '#00A651'
}
```

### Nigerian Cultural Elements

#### Local Context Integration
- **Estate/Compound Terminology** - Use familiar housing terms
- **Community Greetings** - "Welcome to your digital compound"
- **Local Success Stories** - Show how neighbors help neighbors
- **Safety First Mindset** - Address security concerns early

#### Trust Building Elements
- **Verification Badges** - Clear, recognizable trust indicators
- **Community Testimonials** - Real neighbor success stories
- **Privacy Controls** - Granular, easy-to-understand settings
- **Local Authority Endorsements** - Where applicable

### Accessibility & Inclusion

#### Multi-Generational Design
- **Large Touch Targets** - Minimum 48px for all ages
- **Clear Visual Hierarchy** - Easy to scan for seniors
- **Simple Language** - Avoid tech jargon
- **Voice-Over Support** - Full screen reader compatibility

#### Digital Literacy Friendly
- **Contextual Help** - Subtle hints and tips
- **Error Prevention** - Guide users away from mistakes
- **Undo Actions** - Always allow easy reversal
- **Progressive Complexity** - Start simple, add features gradually

This style guide should be referenced for every UI element to maintain consistency across the entire application.