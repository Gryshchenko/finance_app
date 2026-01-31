import { ViewStyle } from 'react-native';
import { IIncome } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { TxKeyPath } from '@/i18n';
import { fetchIncomes } from '@/screens/IncomeScreens/IncomesScreen';

type IncomeDropdownProps = {
    value?: number;
    onChange?: (item: IIncome) => void;
    style?: ViewStyle;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export const IncomeDropdown: React.FC<IncomeDropdownProps> = ({ value, onChange, style, disabled, helperTx, status }) => {
    return (
        <Dropdown
            helperTx={helperTx}
            status={status}
            style={style}
            onChange={onChange}
            value={value}
            labelTx={'common:incomes'}
            disabled={disabled}
            queryKey={'incomes'}
            fetcher={fetchIncomes}
            keyExtractor={(item: IIncome) => {
                return String(item.incomeId);
            }}
            labelExtractor={(item: IIncome) => item.incomeName}
        />
    );
};
