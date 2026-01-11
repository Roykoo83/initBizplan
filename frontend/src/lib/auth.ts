import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useGuestAuth() {
    const [guestId, setGuestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedGuestId = localStorage.getItem('guest_id');
        if (storedGuestId) {
            setGuestId(storedGuestId);
        }
        setLoading(false);
    }, []);

    const loginAsGuest = async () => {
        setLoading(true);
        // Simulate login delay or API call if needed
        await new Promise(resolve => setTimeout(resolve, 500));

        let id = localStorage.getItem('guest_id');
        if (!id) {
            id = uuidv4();
            localStorage.setItem('guest_id', id);
        }
        setGuestId(id);
        setLoading(false);
        return id;
    };

    return { guestId, loading, loginAsGuest };
}
