# MeCabal Marketplace Navigation Integration Guide

## Overview
This document provides a complete guide for integrating all marketplace screens with React Navigation in the MeCabal app.

## Navigation Structure

### Marketplace Stack Navigator
The marketplace uses a stack navigator with the following screens:

```
MarketplaceStack
├── Marketplace (Main marketplace screen)
├── CategoryBrowse (Category-specific browsing)
├── ListingDetail (Individual item details)
├── CreateListing (Create new listing - Modal)
├── ServiceProviderProfile (Service provider details)
└── MyListings (User's listing management)
```

## Screen Flow Diagram

```
MarketplaceScreen (Main)
├── Category tap → CategoryBrowseScreen
├── Item tap → ListingDetailScreen
├── FAB/Create → CreateListingScreen (Modal)
├── Search result → ListingDetailScreen
└── Profile menu → MyListingsScreen

CategoryBrowseScreen
├── Item tap → ListingDetailScreen
├── Back → MarketplaceScreen
└── Service provider → ServiceProviderProfileScreen

ListingDetailScreen
├── Contact seller → Chat/ServiceProviderProfile
├── Back → Previous screen
└── Share → System share

CreateListingScreen
├── Cancel/Submit → MarketplaceScreen
└── Image picker → System gallery/camera

ServiceProviderProfileScreen
├── Book service → Booking flow
├── Message → Chat
├── Back → Previous screen
└── Portfolio item → Project details

MyListingsScreen
├── Edit listing → CreateListingScreen (edit mode)
├── View listing → ListingDetailScreen
├── Create new → CreateListingScreen
└── Back → MarketplaceScreen
```

## Navigation Parameters

### MarketplaceStackParamList
```typescript
export type MarketplaceStackParamList = {
  Marketplace: undefined;
  CategoryBrowse: {
    categoryId: string;
    categoryName: string;
  };
  ListingDetail: {
    listingId: string;
  };
  CreateListing: {
    editMode?: boolean;
    listingId?: string;
  };
  ServiceProviderProfile: {
    providerId: string;
  };
  MyListings: undefined;
};
```

## Integration with Main App

### Tab Navigator Integration
Add marketplace to the main tab navigator:

```typescript
// In your main tab navigator
<Tab.Screen 
  name="Marketplace" 
  component={MarketplaceNavigator}
  options={{
    tabBarLabel: 'Marketplace',
    tabBarIcon: ({ focused }) => (
      <Icon name="shopping-bag" color={focused ? colors.primary : colors.gray} />
    ),
  }}
/>
```

### Deep Linking Support
Configure deep links for marketplace screens:

```typescript
const linking = {
  prefixes: ['mecabal://'],
  config: {
    screens: {
      Marketplace: {
        screens: {
          Marketplace: 'marketplace',
          CategoryBrowse: 'marketplace/category/:categoryId',
          ListingDetail: 'marketplace/listing/:listingId',
          CreateListing: 'marketplace/create',
          ServiceProviderProfile: 'marketplace/provider/:providerId',
          MyListings: 'marketplace/my-listings',
        },
      },
    },
  },
};
```

## Navigation Usage Examples

### From MarketplaceScreen
```typescript
// Navigate to category browse
navigation.navigate('CategoryBrowse', {
  categoryId: 'electronics',
  categoryName: 'Electronics'
});

// Navigate to listing details
navigation.navigate('ListingDetail', {
  listingId: 'listing-123'
});

// Navigate to create listing (modal)
navigation.navigate('CreateListing');
```

### From CategoryBrowseScreen
```typescript
// Navigate to listing details
navigation.navigate('ListingDetail', {
  listingId: item.id
});

// Navigate to service provider
navigation.navigate('ServiceProviderProfile', {
  providerId: item.providerId
});

// Go back to marketplace
navigation.goBack();
```

### From ListingDetailScreen
```typescript
// Navigate to service provider profile
navigation.navigate('ServiceProviderProfile', {
  providerId: listing.sellerId
});

// Go back to previous screen
navigation.goBack();

// Navigate to create listing (duplicate)
navigation.navigate('CreateListing', {
  duplicateFrom: listingId
});
```

## State Management Integration

### Navigation State Persistence
```typescript
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistenceKey = 'NAVIGATION_STATE_V1';

function App() {
  const [initialState, setInitialState] = useState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl == null) {
          const savedStateString = await AsyncStorage.getItem(persistenceKey);
          const state = savedStateString ? JSON.parse(savedStateString) : undefined;
          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem(persistenceKey, JSON.stringify(state))
      }
    >
      <MarketplaceNavigator />
    </NavigationContainer>
  );
}
```

### Context Integration
```typescript
// Create marketplace context for shared state
const MarketplaceContext = createContext({
  favorites: [],
  addFavorite: (listingId: string) => {},
  removeFavorite: (listingId: string) => {},
  searchHistory: [],
  addSearch: (query: string) => {},
});

// Wrap navigator with context
<MarketplaceContext.Provider value={marketplaceState}>
  <MarketplaceNavigator />
</MarketplaceContext.Provider>
```

## Animation Configuration

### Custom Transitions
```typescript
const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.neutral.offWhite },
  
  // Slide from right (iOS style)
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  
  // Modal presentation for CreateListing
  presentation: 'modal',
  
  // Custom animation for category browse
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
  },
};
```

## Error Handling

### Navigation Error Boundaries
```typescript
class NavigationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Navigation error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <NavigationErrorScreen />;
    }

    return this.props.children;
  }
}
```

### Invalid Navigation Handling
```typescript
const navigateToListing = (listingId: string) => {
  try {
    navigation.navigate('ListingDetail', { listingId });
  } catch (error) {
    console.warn('Navigation failed:', error);
    // Fallback to marketplace
    navigation.navigate('Marketplace');
  }
};
```

## Performance Optimization

### Lazy Loading
```typescript
import { lazy } from 'react';

const ListingDetailScreen = lazy(() => import('../screens/ListingDetailScreen'));
const ServiceProviderProfileScreen = lazy(() => import('../screens/ServiceProviderProfileScreen'));
```

### Screen Preloading
```typescript
// Preload next likely screens
useEffect(() => {
  if (Platform.OS === 'android') {
    // Preload components on Android
    import('../screens/ListingDetailScreen');
  }
}, []);
```

## Testing Navigation

### Navigation Testing
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { render, fireEvent } from '@testing-library/react-native';

const renderWithNavigation = (component) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

test('navigates to category browse', () => {
  const { getByText } = renderWithNavigation(<MarketplaceScreen />);
  fireEvent.press(getByText('Electronics'));
  // Assert navigation occurred
});
```

## Security Considerations

### Parameter Validation
```typescript
// Validate navigation parameters
const validateListingId = (id: string) => {
  if (!id || typeof id !== 'string' || id.length < 1) {
    throw new Error('Invalid listing ID');
  }
  return true;
};

// Use in screen components
const ListingDetailScreen = ({ route }) => {
  const { listingId } = route.params;
  
  useEffect(() => {
    try {
      validateListingId(listingId);
    } catch (error) {
      navigation.navigate('Marketplace');
      return;
    }
  }, [listingId]);
};
```

### Route Protection
```typescript
// Protect routes that require authentication
const ProtectedRoute = ({ children, requiresAuth = false }) => {
  const { user } = useAuth();
  
  if (requiresAuth && !user) {
    return <LoginPrompt />;
  }
  
  return children;
};
```

## Final Integration Checklist

- [ ] Install navigation dependencies
- [ ] Configure navigation container
- [ ] Add marketplace navigator to tab navigator
- [ ] Test all navigation flows
- [ ] Configure deep linking
- [ ] Add navigation state persistence
- [ ] Implement error boundaries
- [ ] Test navigation with real data
- [ ] Optimize performance
- [ ] Add navigation analytics

## Dependencies Required

```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
# For React Native CLI
npm install react-native-screens react-native-safe-area-context
# For Expo
expo install react-native-screens react-native-safe-area-context
```

This guide provides everything needed to integrate the marketplace screens with React Navigation in the MeCabal app.