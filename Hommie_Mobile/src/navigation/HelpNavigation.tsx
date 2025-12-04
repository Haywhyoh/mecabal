import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HelpRequestsScreen from '../screens/help/HelpRequestsScreen';
import HelpRequestDetailScreen from '../screens/help/HelpRequestDetailScreen';
import OfferHelpScreen from '../screens/help/OfferHelpScreen';
import CreateHelpRequestScreen from '../screens/help/CreateHelpPostScreen';
import MyHelpActivityScreen from '../screens/help/MyHelpActivityScreen';

export type HelpStackParamList = {
  HelpRequests: undefined;
  HelpRequestDetail: {
    requestId: string;
    focusComment?: boolean;
  };
  OfferHelp: {
    requestId: string;
  };
  CreateHelpRequest: undefined;
  MyHelpActivity: undefined;
};

const Stack = createStackNavigator<HelpStackParamList>();

export const HelpNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F2F2F7' },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen
        name="HelpRequests"
        component={HelpRequestsScreen}
        options={{ title: 'Community Help' }}
      />
      <Stack.Screen
        name="HelpRequestDetail"
        component={HelpRequestDetailScreen}
        options={{ title: 'Help Request' }}
      />
      <Stack.Screen
        name="OfferHelp"
        component={OfferHelpScreen}
        options={{
          title: 'Offer Help',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="CreateHelpRequest"
        component={CreateHelpRequestScreen}
        options={{
          title: 'Request Help',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="MyHelpActivity"
        component={MyHelpActivityScreen}
        options={{ title: 'My Help Activity' }}
      />
    </Stack.Navigator>
  );
};

export default HelpNavigator;
