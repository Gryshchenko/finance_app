import { ViewStyle } from 'react-native';
import { ICategory } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { FieldPresets } from '@/components/FieldPresets';
import { TxKeyPath } from '@/i18n';
import { fetchCategories } from '@/screens/CategoryScreens/CategoriesScreen';

type CategoryDropdownProps = {
    preset?: FieldPresets;
    value?: number;
    onChange?: (item: ICategory) => void;
    style?: ViewStyle;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
    preset,
    value,
    onChange,
    style,
    disabled,
    helperTx,
    status,
}) => {
    return (
        <Dropdown
            preset={preset}
            helperTx={helperTx}
            status={status}
            style={style}
            onChange={onChange}
            value={value}
            labelTx={'common:expenses'}
            disabled={disabled}
            queryKey={'categories'}
            fetcher={fetchCategories}
            keyExtractor={(item: ICategory) => {
                return String(item.categoryId);
            }}
            labelExtractor={(item: ICategory) => item.categoryName}
        />
    );
};
