import { useWindowDimensions } from 'react-native';

export const useScreenWidth = (): number => {
    const { width } = useWindowDimensions();
    return width;
};
