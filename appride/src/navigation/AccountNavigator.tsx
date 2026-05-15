import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountHomeScreen } from '../screens/account/AccountHomeScreen';
import { AppRoleScreen } from '../screens/account/AppRoleScreen';
import { AppSettingsScreen } from '../screens/account/AppSettingsScreen';
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { ContactSupportScreen } from '../screens/account/ContactSupportScreen';
import { EditProfileScreen } from '../screens/account/EditProfileScreen';
import { FAQScreen } from '../screens/account/FAQScreen';
import { HelpSupportScreen } from '../screens/account/HelpSupportScreen';
import { NotificationSettingsScreen } from '../screens/account/NotificationSettingsScreen';
import { ProfilePhotoScreen } from '../screens/account/ProfilePhotoScreen';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { SavedPlacesScreen } from '../screens/account/SavedPlacesScreen';
import { SecuritySettingsScreen } from '../screens/account/SecuritySettingsScreen';
import { ThemeLanguageScreen } from '../screens/account/ThemeLanguageScreen';
import { colors } from '../theme/colors';
import type { AccountStackParamList } from './types';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export function AccountNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AccountHome" component={AccountHomeScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="AppRole" component={AppRoleScreen} options={{ title: 'App role' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ title: 'App settings' }} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} options={{ title: 'Saved places' }} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: 'Help & support' }} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ title: 'Contact support' }} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Password' }} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} options={{ title: 'Profile photo' }} />
      <Stack.Screen name="ThemeLanguage" component={ThemeLanguageScreen} options={{ title: 'Theme & language' }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: 'Security' }} />
    </Stack.Navigator>
  );
}
