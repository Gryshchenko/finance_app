import { Fragment, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

export function ResetOnBlur({ children }: { children: React.ReactNode }) {
    const isFocused = useIsFocused();
    const [mountKey, setMountKey] = useState(0);

    useEffect(() => {
        if (!isFocused) {
            setMountKey((k) => k + 1);
        }
    }, [isFocused]);

    return <Fragment key={mountKey}>{children}</Fragment>;
}
