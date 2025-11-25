import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { isAdmin } from '@/lib/adminConfig';
import { onAuthStateChanged } from 'firebase/auth';

export function useAdmin() {
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email) {
                setIsAdminUser(isAdmin(user.email));
            } else {
                setIsAdminUser(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { isAdmin: isAdminUser, loading };
}
