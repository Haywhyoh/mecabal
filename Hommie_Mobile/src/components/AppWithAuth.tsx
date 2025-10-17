// MeCabal App with Authentication
// Example integration of AuthContext with the main app

import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthGuard from './AuthGuard';

// Import your screens
import WelcomeScreen from '../screens/onBoarding/WelcomeScreen';
import PhoneVerificationScreen from '../screens/onBoarding/PhoneVerificationScreen';
import OTPVerificationScreen from '../screens/onBoarding/OTPVerificationScreen';
import EmailLoginScreen from '../screens/onBoarding/EmailLoginScreen';
import EmailVerificationScreen from '../screens/onBoarding/EmailVerificationScreen';
import LocationSetupScreen from '../screens/onBoarding/LocationSetupScreen';
import RegisterScreen from '../screens/onBoarding/RegisterScreen';
// import LoginScreen from '../screens/onBoarding/LoginScreen'; // File doesn't exist

// Import main app screens (you'll need to create these)
// import MainTabs from '../screens/MainTabs';
// import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

// Main app content that requires authentication
const AuthenticatedApp = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Add your main app screens here */}
      {/* <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Home" component={HomeScreen} /> */}
      
      {/* Temporary placeholder */}
      <Stack.Screen name="Placeholder" component={() => (
        <AuthGuard>
          <Text>Main App - Authentication Required</Text>
        </AuthGuard>
      )} />
    </Stack.Navigator>
  );
};

// Onboarding flow (no authentication required)
const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={EmailLoginScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// App content based on authentication state
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <OnboardingStack />;
};

// Main app component with AuthProvider
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppWithAuth;
