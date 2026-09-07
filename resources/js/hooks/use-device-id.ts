import { useEffect, useState } from 'react';

export function useDeviceId(): string {
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        const key = 'softrly_device_uuid';
        let value = window.localStorage.getItem(key);

        if (!value) {
            value = crypto.randomUUID();
            window.localStorage.setItem(key, value);
        }

        document.cookie = `device_uuid=${value}; path=/; max-age=31536000; SameSite=Lax`;
        setDeviceId(value);
    }, []);

    return deviceId;
}
