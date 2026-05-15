import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UltraGoAuthScreen } from '../screens/auth/UltraGoAuthScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={UltraGoAuthScreen} />
    </Stack.Navigator>
  );
}
