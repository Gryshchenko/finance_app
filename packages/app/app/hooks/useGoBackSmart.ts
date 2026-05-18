import { useNavigation } from '@react-navigation/native';

import type { BackTarget } from '@/types/BackTarget';
import { OverviewPath } from '@/types/OverviewPath';

export function useGoBackSmart(back?: BackTarget) {
    const navigation = useNavigation();
    return () => {
        const parent = navigation.getParent();
        if (back?.path) {
            if (back.screen) {
                parent?.navigate(back.path, { screen: back.screen, params: back.params });
            } else {
                parent?.navigate(back.path, back.params);
            }
            return;
        }
        if (parent?.canGoBack()) {
            parent.goBack();
            return;
        }
        parent?.navigate(OverviewPath.Dashboard);
    };
}
