import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FoodCartScreen } from '../screens/food/FoodCartScreen';
import { FoodCheckoutScreen } from '../screens/food/FoodCheckoutScreen';
import { FoodItemDetailScreen } from '../screens/food/FoodItemDetailScreen';
import { FoodOrderTrackingScreen } from '../screens/food/FoodOrderTrackingScreen';
import { RestaurantDetailScreen } from '../screens/food/RestaurantDetailScreen';
import { RestaurantsScreen } from '../screens/food/RestaurantsScreen';
import { colors } from '../theme/colors';
import type { FoodStackParamList } from './types';

const Stack = createNativeStackNavigator<FoodStackParamList>();

export function FoodNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="FoodRestaurants" component={RestaurantsScreen} options={{ headerShown: false, title: 'Food' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'Menu (legacy)' }} />
      <Stack.Screen
        name="FoodItemDetail"
        component={FoodItemDetailScreen}
        options={{ title: '', headerTransparent: true, headerTintColor: colors.headerText }}
      />
      <Stack.Screen name="FoodCart" component={FoodCartScreen} options={{ title: 'Your cart' }} />
      <Stack.Screen name="FoodCheckout" component={FoodCheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen
        name="FoodOrderTracking"
        component={FoodOrderTrackingScreen}
        options={{ title: 'Order status' }}
      />
    </Stack.Navigator>
  );
}
