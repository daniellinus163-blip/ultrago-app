import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import type { MainTabParamList } from '../navigation/types';
import { hasActivePaymentMethod } from '../store/paymentMethodsStore';

export const ADD_PAYMENT_METHOD_MESSAGE = 'Add payment method first';

type TabNav = NavigationProp<MainTabParamList>;

export function ensureCustomerPaymentMethod(tabNav: TabNav | undefined): boolean {
  if (hasActivePaymentMethod()) {
    return true;
  }
  Alert.alert('Payment required', ADD_PAYMENT_METHOD_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Add payment method',
      onPress: () => tabNav?.navigate('Wallet', { screen: 'AddPaymentMethodHub' }),
    },
  ]);
  return false;
}
