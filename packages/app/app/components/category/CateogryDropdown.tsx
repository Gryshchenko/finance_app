import { ViewStyle } from 'react-native';
import { ICategory } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { FieldPresets } from '@/components/FieldPresets';
import { TxKeyPath } from '@/i18n';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { Logger } from '@/utils/logger/Logger';

export async function fetchCategories(): Promise<ICategory[]> {
    try {
        const categoriesService = CategoryService.instance();
        const response = await categoriesService.doGetCategories();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ICategory[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchCategories').error(`Fetch categories failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

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
            modalTitleTx={'common:expenses'}
            editable={!disabled}
            queryKey={'categories'}
            fetcher={fetchCategories}
            keyExtractor={(item: ICategory) => {
                return String(item.categoryId);
            }}
            labelExtractor={(item: ICategory) => item.categoryName}
        />
    );
};
