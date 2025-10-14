import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import CategoryBrowseScreen from '../screens/CategoryBrowseScreen';
import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import ServiceProviderProfileScreen from '../screens/ServiceProviderProfileScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import BusinessSearchScreen from '../screens/BusinessSearchScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';

// Define navigation parameter types
export type MarketplaceStackParamList = {
  Marketplace: undefined;
  CategoryBrowse: {
    categoryId: string;
    categoryName: string;
  };
  ListingDetail: {
    listingId: string;
  };
  CreateListing: undefined;
  ServiceProviderProfile: {
    providerId: string;
  };
  MyListings: undefined;
  BusinessSearch: undefined;
  BusinessDetail: {
    businessId: string;
  };
};

const Stack = createStackNavigator<MarketplaceStackParamList>();

export const MarketplaceNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // All screens have custom headers
        cardStyle: { backgroundColor: '#FAFAFA' },
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
        name="Marketplace" 
        component={MarketplaceScreen}
        options={{ title: 'Estate Marketplace' }}
      />
      <Stack.Screen 
        name="CategoryBrowse" 
        component={CategoryBrowseScreen}
        options={{ title: 'Browse Category' }}
      />
      <Stack.Screen 
        name="ListingDetail" 
        component={ListingDetailsScreen}
        options={{ title: 'Item Details' }}
      />
      <Stack.Screen 
        name="CreateListing" 
        component={CreateListingScreen}
        options={{ 
          title: 'Create Listing',
          presentation: 'modal' // iOS modal presentation
        }}
      />
      <Stack.Screen 
        name="ServiceProviderProfile" 
        component={ServiceProviderProfileScreen}
        options={{ title: 'Service Provider' }}
      />
      <Stack.Screen 
        name="MyListings" 
        component={MyListingsScreen}
        options={{ title: 'My Listings' }}
      />
      <Stack.Screen 
        name="BusinessSearch" 
        component={BusinessSearchScreen}
        options={{ title: 'Local Businesses' }}
      />
      <Stack.Screen 
        name="BusinessDetail" 
        component={BusinessDetailScreen}
        options={{ title: 'Business Details' }}
      />
    </Stack.Navigator>
  );
};