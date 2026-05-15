import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddBankAccountScreen } from '../screens/wallet/AddBankAccountScreen';
import { AddDebitCardScreen } from '../screens/wallet/AddDebitCardScreen';
import { AddPaymentMethodHubScreen } from '../screens/wallet/AddPaymentMethodHubScreen';
import { PaymentHistoryScreen } from '../screens/wallet/PaymentHistoryScreen';
import { PaymentMethodsScreen } from '../screens/wallet/PaymentMethodsScreen';
import { PromoCodesScreen } from '../screens/wallet/PromoCodesScreen';
import { ReferralScreen } from '../screens/wallet/ReferralScreen';
import { WalletHomeScreen } from '../screens/wallet/WalletHomeScreen';
import { WalletTransactionsScreen } from '../screens/wallet/WalletTransactionsScreen';
import { PartnerWalletHomeScreen } from '../screens/wallet/PartnerWalletHomeScreen';
import { PartnerWithdrawScreen } from '../screens/wallet/PartnerWithdrawScreen';
import { PartnerAddBankAccountForWithdrawalScreen } from '../screens/wallet/PartnerAddBankAccountForWithdrawalScreen';
import { PartnerSetDefaultPayoutMethodScreen } from '../screens/wallet/PartnerSetDefaultPayoutMethodScreen';
import { colors } from '../theme/colors';
import type { WalletStackParamList } from './types';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export function WalletNavigator() {
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
        <Stack.Screen name="WalletHome" component={WalletHomeScreen} options={{ title: 'Payment methods' }} />
        <Stack.Screen name="AddPaymentMethodHub" component={AddPaymentMethodHubScreen} options={{ title: 'Add payment method' }} />
        <Stack.Screen name="AddDebitCard" component={AddDebitCardScreen} options={{ title: 'Add card' }} />
        <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} options={{ title: 'Add bank account' }} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment methods' }} />
        <Stack.Screen name="WalletTransactions" component={WalletTransactionsScreen} options={{ title: 'Transactions' }} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Gateway log' }} />
        <Stack.Screen name="PromoCodes" component={PromoCodesScreen} options={{ title: 'Promos' }} />
        <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Refer friends' }} />
        <Stack.Screen name="PartnerWalletHome" component={PartnerWalletHomeScreen} options={{ title: 'Earnings wallet' }} />
        <Stack.Screen name="PartnerWithdraw" component={PartnerWithdrawScreen} options={{ title: 'Withdraw' }} />
        <Stack.Screen
          name="PartnerAddBankAccountForWithdrawal"
          component={PartnerAddBankAccountForWithdrawalScreen}
          options={{ title: 'Add bank account' }}
        />
        <Stack.Screen
          name="PartnerSetDefaultPayoutMethod"
          component={PartnerSetDefaultPayoutMethodScreen}
          options={{ title: 'Set payout method' }}
        />
      </Stack.Navigator>
  );
}
