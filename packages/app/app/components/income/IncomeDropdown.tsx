import { ViewStyle } from 'react-native';
import { IIncome } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { FieldPresets } from '@/components/FieldPresets';
import { TxKeyPath } from '@/i18n';
import { fetchIncomes } from '@/screens/IncomeScreens/IncomesScreen';

type IncomeDropdownProps = {
    preset?: FieldPresets;
    value?: number;
    onChange?: (item: IIncome) => void;
    style?: ViewStyle;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export const IncomeDropdown: React.FC<IncomeDropdownProps> = ({ preset, value, onChange, style, disabled, helperTx, status }) => {
    return (
        <Dropdown
            preset={preset}
            helperTx={helperTx}
            status={status}
            style={style}
            onChange={onChange}
            value={value}
            labelTx={'common:incomes'}
            modalTitleTx={'common:incomes'}
            editable={!disabled}
            queryKey={'incomes'}
            fetcher={fetchIncomes}
            keyExtractor={(item: IIncome) => {
                return String(item.incomeId);
            }}
            labelExtractor={(item: IIncome) => item.incomeName}
        />
    );
};
