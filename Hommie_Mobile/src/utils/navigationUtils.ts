import { NavigationProp, ParamListBase } from '@react-navigation/native';

/**
 * Safely navigate back, with fallback options if no previous screen exists
 * @param navigation - React Navigation object
 * @param fallbackRoute - Route to navigate to if can't go back
 * @param fallbackParams - Params for fallback route
 */
export const safeGoBack = (
  navigation: NavigationProp<ParamListBase>,
  fallbackRoute?: string,
  fallbackParams?: any
) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (fallbackRoute) {
    navigation.navigate(fallbackRoute as never, fallbackParams);
  } else {
    // Default fallback to Welcome screen for onboarding flows
    navigation.navigate('Welcome' as never);
  }
};

/**
 * Check if the navigation can go back
 * @param navigation - React Navigation object
 * @returns boolean indicating if back navigation is possible
 */
export const canNavigateBack = (navigation: NavigationProp<ParamListBase>): boolean => {
  return navigation.canGoBack();
};

/**
 * Navigate back with custom logic for different screen contexts
 * @param navigation - React Navigation object
 * @param context - Screen context ('onboarding', 'main', 'auth')
 */
export const contextAwareGoBack = (
  navigation: NavigationProp<ParamListBase>,
  context: 'onboarding' | 'main' | 'auth' = 'main'
) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  // Context-specific fallbacks
  switch (context) {
    case 'onboarding':
      navigation.navigate('Welcome' as never);
      break;
    case 'auth':
      navigation.navigate('Welcome' as never);
      break;
    case 'main':
      navigation.navigate('Home' as never);
      break;
    default:
      navigation.navigate('Welcome' as never);
  }
};

/**
 * Reset navigation stack to specific route
 * Useful for onboarding flows where you want to prevent going back
 * @param navigation - React Navigation object
 * @param routeName - Route to reset to
 * @param params - Optional params for the route
 */
export const resetToRoute = (
  navigation: NavigationProp<ParamListBase>,
  routeName: string,
  params?: any
) => {
  navigation.reset({
    index: 0,
    routes: [{ name: routeName, params }],
  });
};

/**
 * Navigate with stack reset - useful for completing onboarding
 * @param navigation - React Navigation object
 * @param routeName - Route to navigate to
 * @param params - Optional params
 */
export const navigateAndReset = (
  navigation: NavigationProp<ParamListBase>,
  routeName: string,
  params?: any
) => {
  navigation.reset({
    index: 0,
    routes: [{ name: routeName, params }],
  });
};

/**
 * Get navigation state information for debugging
 * @param navigation - React Navigation object
 * @returns Object with navigation state info
 */
export const getNavigationInfo = (navigation: NavigationProp<ParamListBase>) => {
  return {
    canGoBack: navigation.canGoBack(),
    currentRoute: navigation.getState()?.routes[navigation.getState()?.index || 0]?.name,
    routesCount: navigation.getState()?.routes.length || 0,
  };
};