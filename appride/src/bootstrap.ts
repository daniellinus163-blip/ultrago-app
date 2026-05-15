/**
 * Runs before the app tree mounts. Keeps Expo Go from dying on optional native modules.
 */
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'MODULE_TYPELESS_PACKAGE_JSON',
  'Non-serializable values were found in the navigation state',
]);

if (__DEV__ && typeof ErrorUtils !== 'undefined') {
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[UltraGo]', isFatal ? 'Fatal:' : 'Error:', error?.message ?? error);
    previousHandler(error, isFatal);
  });
}
