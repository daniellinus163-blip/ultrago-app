import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'PaymentMethods'>;

/** Deep-link alias — forwards to the Phase 2 customer wallet home. */
export function PaymentMethodsScreen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace('WalletHome');
  }, [navigation]);
  return null;
}
