import { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { hasAdminClaim } from '@/lib/adminConfig';
import { getIdTokenResult, onIdTokenChanged } from 'firebase/auth';

export function useAdmin() {
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [loading, setLoading] = useState(isFirebaseConfigured);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            return;
        }

        let active = true;

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (!user) {
                setIsAdminUser(false);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const tokenResult = await getIdTokenResult(user);
                if (active) {
                    setIsAdminUser(hasAdminClaim(tokenResult.claims));
                }
            } catch (error) {
                console.error('Failed to verify admin claim:', error);
                if (active) {
                    setIsAdminUser(false);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return { isAdmin: isAdminUser, loading };
}
