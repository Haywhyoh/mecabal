import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import improved screens
import WelcomeScreen from './src/screens/onBoarding/WelcomeScreen';

import WelcomeHeroScreen from './src/screens/onBoarding/WelcomeHeroScreen';
import PhoneVerificationScreen from './src/screens/onBoarding/PhoneVerificationScreen';
import OTPVerificationScreen from './src/screens/onBoarding/OTPVerificationScreen';
import ConsentBasicsScreen from './src/screens/onBoarding/ConsentBasicsScreen';
import LocationSetupScreen from './src/screens/onBoarding/LocationSetupScreen';
import EmailRegistrationScreen from './src/screens/onBoarding/EmailRegistrationScreen';
import EmailVerificationScreen from './src/screens/onBoarding/EmailVerificationScreen';
import EmailLoginScreen from './src/screens/onBoarding/EmailLoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import { MarketplaceNavigator } from './src/navigation/MarketplaceNavigation';
import InboxScreen from './src/screens/InboxScreen';
import MoreScreen from './src/screens/MoreScreen';

// Profile and Community Screens
import ProfileScreen from './src/screens/ProfileScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import EstateManagerScreen from './src/screens/EstateManagerScreen';
import CulturalProfileScreen from './src/screens/CulturalProfileScreen';
import PhoneVerificationEnhancedScreen from './src/screens/PhoneVerificationEnhancedScreen';
import NINVerificationScreen from './src/screens/NINVerificationScreen';
import BadgeSystemScreen from './src/screens/BadgeSystemScreen';
import BusinessRegistrationScreen from './src/screens/BusinessRegistrationScreen';
import ProfessionalSkillsScreen from './src/screens/ProfessionalSkillsScreen';
import LocalBusinessDirectoryScreen from './src/screens/LocalBusinessDirectoryScreen';
import CommunityActivityScreen from './src/screens/CommunityActivityScreen';
import NeighborRatingScreen from './src/screens/NeighborRatingScreen';
import CommunityEngagementScreen from './src/screens/CommunityEngagementScreen';
import NeighborConnectionsScreen from './src/screens/NeighborConnectionsScreen';
import LoginScreen from './src/screens/onBoarding/LoginScreen';
import RegisterScreen from './src/screens/onBoarding/RegisterScreen';

import OnboardingScreen from './src/screens/onBoarding/OnboardingScreen';
import LocationSelectionScreen from './src/screens/onBoarding/LocationSelectionScreen';
import InvitationCodeScreen from './src/screens/onBoarding/InvitationCodeScreen';
import LocationAccessScreen from './src/screens/onBoarding/LocationAccessScreen';

// Event Screens
import CreateEventScreen from './src/screens/CreateEventScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import EventAttendeesScreen from './src/screens/EventAttendeesScreen';
import CommunityEndorsementScreen from './src/screens/CommunityEndorsementScreen';
import EventPaymentScreen from './src/screens/EventPaymentScreen';

// Messaging and Notifications
import NotificationsScreen from './src/screens/NotificationsScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import ChatScreen from './src/screens/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen}
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text" color={color} size={size} />
          ),
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
        name="More" 
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal" color={color} size={size} />
          ),
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
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <Stack.Screen name="EstateManager" component={EstateManagerScreen} />
      <Stack.Screen name="CulturalProfile" component={CulturalProfileScreen} />
      <Stack.Screen name="PhoneVerificationEnhanced" component={PhoneVerificationEnhancedScreen} />
      <Stack.Screen name="NINVerification" component={NINVerificationScreen} />
      <Stack.Screen name="BadgeSystem" component={BadgeSystemScreen} />
      
      {/* Business Screens */}
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationScreen} />
      <Stack.Screen name="ProfessionalSkills" component={ProfessionalSkillsScreen} />
      <Stack.Screen name="LocalBusinessDirectory" component={LocalBusinessDirectoryScreen} />
      
      {/* Community Screens */}
      <Stack.Screen name="CommunityActivity" component={CommunityActivityScreen} />
      <Stack.Screen name="NeighborRating" component={NeighborRatingScreen} />
      <Stack.Screen name="CommunityEngagement" component={CommunityEngagementScreen} />
      <Stack.Screen name="NeighborConnections" component={NeighborConnectionsScreen} />
      
      {/* Event Screens */}
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} />
      <Stack.Screen name="CommunityEndorsement" component={CommunityEndorsementScreen} />
      <Stack.Screen name="EventPayment" component={EventPaymentScreen} />
      
      {/* Messaging and Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
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
  const { isAuthenticated, isLoading } = useAuth();

  const handleLoginSuccess = () => {
    // This will be handled by the AuthContext automatically
  };

  // Function to handle social login success
  const handleSocialLoginSuccess = () => {
    // This will be handled by the AuthContext automatically
  };

  if (isLoading) {
    return (
      <PaperProvider>
        <NavigationContainer>
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
      <NavigationContainer>
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
            
            {/* Location Setup with multiple options */}
            <Stack.Screen 
              name="LocationSetup" 
              component={LocationSetupScreen}
              initialParams={{ onSetupComplete: handleLoginSuccess }}
            />
            
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess, onSocialLoginSuccess: handleSocialLoginSuccess }}
            />
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess, onSocialLoginSuccess: handleSocialLoginSuccess }}
            />
            <Stack.Screen 
              name="LocationSelection" 
              component={LocationSelectionScreen}
            />
            <Stack.Screen 
              name="InvitationCode" 
              component={InvitationCodeScreen}
            />
            <Stack.Screen 
              name="LocationAccess" 
              component={LocationAccessScreen}
            />
            <Stack.Screen 
              name="ConsentBasics" 
              component={ConsentBasicsScreen}
            />
            
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess, onSocialLoginSuccess: handleSocialLoginSuccess }}
            />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

// Main App component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}