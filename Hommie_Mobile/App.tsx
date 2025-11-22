import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { logEnvironment, validateEnvironment } from './src/config/environment';

// Import improved screens
import WelcomeScreen from './src/screens/onBoarding/WelcomeScreen';
import { OAuthCallbackScreen } from './src/screens/auth';

import WelcomeHeroScreen from './src/screens/onBoarding/WelcomeHeroScreen';
import PhoneVerificationScreen from './src/screens/onBoarding/PhoneVerificationScreen';
import OTPVerificationScreen from './src/screens/onBoarding/OTPVerificationScreen';
import LocationSetupScreen from './src/screens/onBoarding/LocationSetupScreen';
import LocationSetupScreenNew from './src/screens/onBoarding/LocationSetupScreenNew';
import EstateSelectionScreen from './src/screens/onBoarding/EstateSelectionScreen';
import ProfileSetupScreen from './src/screens/onBoarding/ProfileSetupScreen';
import EmailRegistrationScreen from './src/screens/onBoarding/EmailRegistrationScreen';
import EmailVerificationScreen from './src/screens/onBoarding/EmailVerificationScreen';
import EmailLoginScreen from './src/screens/onBoarding/EmailLoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import { MarketplaceNavigator } from './src/navigation/MarketplaceNavigation';
import { HelpNavigator } from './src/navigation/HelpNavigation';

// Profile and Community Screens
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import EstateManagerScreen from './src/screens/EstateManagerScreen';
import CulturalProfileScreen from './src/screens/CulturalProfileScreen';
import NINVerificationScreen from './src/screens/NINVerificationScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import BadgeSystemScreen from './src/screens/BadgeSystemScreen';
import BusinessRegistrationScreen from './src/screens/BusinessRegistrationScreen';
import EditBusinessProfileScreen from './src/screens/EditBusinessProfileScreen';
import ProfessionalSkillsScreen from './src/screens/ProfessionalSkillsScreen';
import LocalBusinessDirectoryScreen from './src/screens/LocalBusinessDirectoryScreen';
import BusinessDetailScreen from './src/screens/BusinessDetailScreen';
import BusinessReviewsScreen from './src/screens/BusinessReviewsScreen';
import WriteReviewScreen from './src/screens/WriteReviewScreen';
import BusinessAnalyticsScreen from './src/screens/BusinessAnalyticsScreen';
import BusinessInquiriesScreen from './src/screens/BusinessInquiriesScreen';
import MyInquiriesScreen from './src/screens/MyInquiriesScreen';
import AdvancedSearchFiltersScreen from './src/screens/AdvancedSearchFiltersScreen';
import CommunityActivityScreen from './src/screens/CommunityActivityScreen';
import NeighborRatingScreen from './src/screens/NeighborRatingScreen';
import CommunityEngagementScreen from './src/screens/CommunityEngagementScreen';
import NeighborConnectionsScreen from './src/screens/NeighborConnectionsScreen';
import RegisterScreen from './src/screens/onBoarding/RegisterScreen';
import LocationTestScreen from './src/screens/LocationTestScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MoreScreen from './src/screens/MoreScreen';



// Event Screens
import CreateEventScreen from './src/screens/CreateEventScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import EventAttendeesScreen from './src/screens/EventAttendeesScreen';
import CategoryEventsScreen from './src/screens/CategoryEventsScreen';
import CommunityEndorsementScreen from './src/screens/CommunityEndorsementScreen';
import EventPaymentScreen from './src/screens/EventPaymentScreen';

// Messaging and Notifications
import NotificationsScreen from './src/screens/NotificationsScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import ChatScreen from './src/screens/ChatScreen';

// Community Posts
import CreatePostScreen from './src/screens/CreatePostScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['mecabal://', 'https://mecabal.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          EventsTab: 'events-tab',  // Note: different from stack 'Events'
          Market: 'market',
          Help: 'help',
          ProfileTab: 'profile-tab',  // Note: different from stack 'Profile'
        },
      },
      Events: 'events',
      CategoryEvents: 'events/category/:categoryId',
      EventDetails: 'events/:id',
      EventAttendees: 'events/:id/attendees',
      CreateEvent: 'events/create',
      Profile: 'profile',
      Notifications: 'notifications',
      Messaging: 'messages',  // ADD THIS LINE
      Chat: 'messages/:conversationId',  // ADD THIS LINE
      BusinessReviews: 'business/:businessId/reviews',
      WriteReview: 'business/:businessId/review/write',
      BusinessAnalytics: 'business/:businessId/analytics',
      // OAuth callback routes
      OAuthCallback: 'oauth/callback',
    },
  },
};

// Home Stack Navigator to keep tabs visible
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#00A651', // Using Nigerian green from style guide
        tabBarInactiveTintColor: '#8E8E8E',
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
          // Badge for upcoming events (optional enhancement)
          tabBarBadge: undefined, // TODO: Add count of upcoming events user is attending
        }}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketplaceNavigator}
        options={{
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shopping" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Help" 
        component={HelpNavigator}
        options={{
          tabBarLabel: 'Help',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hand-heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused, size }) => {
            // NOTE: This requires useAuth hook to be accessible here
            // We'll need to refactor to get user data
            return (
              <MaterialCommunityIcons
                name="account-circle"
                color={color}
                size={size}
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Profile Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <Stack.Screen name="EstateManager" component={EstateManagerScreen} />
      <Stack.Screen name="CulturalProfile" component={CulturalProfileScreen} />
      <Stack.Screen name="NINVerification" component={NINVerificationScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="BadgeSystem" component={BadgeSystemScreen} />
      
      {/* Business Screens */}
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationScreen} />
      <Stack.Screen name="EditBusinessProfile" component={EditBusinessProfileScreen} />
      <Stack.Screen name="ProfessionalSkills" component={ProfessionalSkillsScreen} />
      <Stack.Screen name="LocalBusinessDirectory" component={LocalBusinessDirectoryScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen name="BusinessReviews" component={BusinessReviewsScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="BusinessAnalytics" component={BusinessAnalyticsScreen} />
      <Stack.Screen name="BusinessInquiries" component={BusinessInquiriesScreen} />
      <Stack.Screen name="MyInquiries" component={MyInquiriesScreen} />
      <Stack.Screen name="AdvancedSearchFilters" component={AdvancedSearchFiltersScreen} />
      
      {/* Community Screens */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="CommunityActivity" component={CommunityActivityScreen} />
      <Stack.Screen name="NeighborRating" component={NeighborRatingScreen} />
      <Stack.Screen name="CommunityEngagement" component={CommunityEngagementScreen} />
      <Stack.Screen name="NeighborConnections" component={NeighborConnectionsScreen} />
      
      {/* Event Screens */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="CategoryEvents" component={CategoryEventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} />
      <Stack.Screen name="CommunityEndorsement" component={CommunityEndorsementScreen} />
      <Stack.Screen name="EventPayment" component={EventPaymentScreen} />
      
      {/* Messaging and Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />

      {/* Development & Testing */}
      <Stack.Screen name="LocationTest" component={LocationTestScreen} />
    </Stack.Navigator>
  );
}


// Loading component
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}

// App content component that uses authentication context
function AppContent() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  
  // Validate environment on startup
  React.useEffect(() => {
    logEnvironment();
    const validation = validateEnvironment();
    if (!validation.valid) {
      console.error('❌ App startup failed - missing environment variables:', validation.missing);
    }
  }, []);

  const handleLoginSuccess = () => {
    // Refresh auth state to trigger navigation to main app
    // The actual authentication should have been completed by this point
    console.log('Authentication completed successfully');
    refreshUser(); // Refresh authentication state
  };

  // Function to handle social login success
  const handleSocialLoginSuccess = () => {
    // For social login, authentication should be completed by the social provider
    // This callback ensures the UI updates accordingly  
    console.log('Social authentication completed successfully');
    refreshUser(); // Refresh authentication state
  };

  if (isLoading) {
    return (
      <PaperProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="auto" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Loading" component={LoadingScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="auto" />
        {isAuthenticated ? (
          <MainStackNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="WelcomeHero">
            {/* NEW ONBOARDING FLOW */}
            
            {/* Welcome Screen - First screen with Join/Login options */}
            <Stack.Screen 
              name="WelcomeHero" 
              component={WelcomeHeroScreen}
             
            />
            
            {/* Email Registration Flow - For new users choosing email */}
            <Stack.Screen 
              name="EmailRegistration" 
              component={EmailRegistrationScreen}
            />
            
            {/* Email Verification - For both signup and login */}
            <Stack.Screen 
              name="EmailVerification" 
              component={EmailVerificationScreen}
            />
            
            {/* Email Login - For existing users */}
            <Stack.Screen 
              name="EmailLogin" 
              component={EmailLoginScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess, onSocialLoginSuccess: handleSocialLoginSuccess }}
            />
            

            
            {/* Phone Verification - After email verification or SSO signup */}
            <Stack.Screen 
              name="PhoneVerification" 
              component={PhoneVerificationScreen}
            />
       
            {/* OTP Verification with fallback options */}
            <Stack.Screen 
              name="OTPVerification" 
              component={OTPVerificationScreen}
            />
            
            {/* Location Setup with multiple options - NEW DESIGN */}
            <Stack.Screen 
              name="LocationSetup" 
              component={LocationSetupScreenNew}
              initialParams={{ onSetupComplete: handleLoginSuccess }}
            />
            
            {/* Estate Selection Screen - NEW */}
            <Stack.Screen 
              name="EstateSelection" 
              component={EstateSelectionScreen}
            />
            
            {/* Profile Setup Screen - NEW */}
            <Stack.Screen 
              name="ProfileSetup" 
              component={ProfileSetupScreen}
            />
            
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess, onSocialLoginSuccess: handleSocialLoginSuccess }}
            />
            
            {/* OAuth Callback Screen */}
            <Stack.Screen 
              name="OAuthCallback" 
              component={OAuthCallbackScreen}
            />
            
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

// Main App component with AuthProvider, ProfileProvider, and LocationProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}