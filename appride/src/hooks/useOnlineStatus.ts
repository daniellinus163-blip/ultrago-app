import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void NetInfo.fetch().then((s) => {
      if (!cancelled) {
        setOnline(Boolean(s.isConnected && s.isInternetReachable !== false));
      }
    });
    const unsub = NetInfo.addEventListener((s) => {
      setOnline(Boolean(s.isConnected && s.isInternetReachable !== false));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return online;
}
