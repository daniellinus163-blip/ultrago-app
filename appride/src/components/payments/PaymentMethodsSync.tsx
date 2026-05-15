import React, { useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { subscribePaymentMethods } from '../../services/payments/paymentMethodsFirestore';
import { usePaymentMethodsStore } from '../../store/paymentMethodsStore';

/** Hydrates customer payment methods from Firestore while the wallet stack is mounted. */
export function PaymentMethodsSync() {
  const { user, profile } = useAuth();
  const setMethods = usePaymentMethodsStore((s) => s.setMethods);
  const setError = usePaymentMethodsStore((s) => s.setError);
  const setLoading = usePaymentMethodsStore((s) => s.setLoading);

  useEffect(() => {
    if (!user || profile?.appRole !== 'customer') {
      setMethods([]);
      return;
    }
    setLoading(true);
    const unsub = subscribePaymentMethods(
      user.uid,
      (rows) => setMethods(rows),
      (msg) => setError(msg),
    );
    return unsub;
  }, [user, profile?.appRole, setMethods, setError, setLoading]);

  return null;
}
