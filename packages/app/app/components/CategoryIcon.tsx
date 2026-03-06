import { FC } from 'react';
import { CategoryIconType } from 'tenpercent/shared';

import { Icon } from '@/components/Icon';

interface AppIconProps {
    name: CategoryIconType;
    size?: number;
    color?: string;
}

export const CategoryIcon: FC<AppIconProps> = ({ name, size = 24, color }) => {
    return <Icon icon={name} size={size} color={color} />;
};
