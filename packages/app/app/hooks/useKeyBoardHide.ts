import { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';

const useKeyBoardHide = (): boolean => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);
    return keyboardVisible;
};

export { useKeyBoardHide };
