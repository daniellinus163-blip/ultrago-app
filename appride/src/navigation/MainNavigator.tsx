import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentMethodsSync } from '../components/payments/PaymentMethodsSync';
import { AccountNavigator } from './AccountNavigator';
import { DeliveryDeskScreen } from '../screens/delivery/DeliveryDeskScreen';
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';
import { RiderHomeScreen } from '../screens/rider/RiderHomeScreen';
import { FoodNavigator } from './FoodNavigator';
import { WalletNavigator } from './WalletNavigator';
import { TripHistoryScreen } from '../screens/trip/TripHistoryScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_BASE_HEIGHT = 56;
/** Extra lift so tabs sit clearly above the Android system navigation bar. */
const TAB_BAR_LIFT = 10;

export function MainNavigator() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const role = profile?.appRole ?? 'customer';
  const hideDriverTab = role === 'delivery_rider';
  const showDeliveryTab = role === 'delivery_rider';

  const tabBarBottomPad = Math.max(insets.bottom, 8) + TAB_BAR_LIFT;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + tabBarBottomPad;

  return (
    <>
      {role === 'customer' ? <PaymentMethodsSync /> : null}
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.headerText },
          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: tabBarBottomPad,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
        }}
      >
        <Tab.Screen
          name="RiderHome"
          component={RiderHomeScreen}
          options={{
            title: 'Ride',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Food"
          component={FoodNavigator}
          options={{
            title: 'Food',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="TripHistory"
          component={TripHistoryScreen}
          options={{
            title: 'Activity',
            tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Wallet"
          component={WalletNavigator}
          options={{
            title: 'Wallet',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="DeliveryDesk"
          component={DeliveryDeskScreen}
          options={{
            title: 'Delivery',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" color={color} size={size} />,
            tabBarButton: showDeliveryTab ? undefined : () => null,
          }}
        />
        <Tab.Screen
          name="DriverHome"
          component={DriverHomeScreen}
          options={{
            title: 'Drive',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="car" color={color} size={size} />,
            tabBarButton: hideDriverTab ? () => null : undefined,
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountNavigator}
          options={{
            title: 'Account',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </>
  );
}
