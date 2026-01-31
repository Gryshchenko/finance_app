import { StyleProp, TextStyle } from 'react-native';
import { ICurrency } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { fetchCurrencies } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';

type CurrencyDropdownProps = {
    error?: TxKeyPath;
    value?: number;
    onChange?: (item: ICurrency) => void;
    style?: StyleProp<TextStyle>;
    disabled?: boolean;
    filter?: (items: ICurrency[] | undefined) => ICurrency[];
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
    value,
    onChange,
    style,
    disabled,
    filter,
    helperTx,
    status,
}) => {
    return (
        <Dropdown
            helperTx={helperTx}
            status={status}
            style={style}
            onChange={onChange}
            value={value}
            labelTx={'common:currency'}
            disabled={disabled}
            queryKey={'currencies'}
            fetcher={fetchCurrencies}
            filter={filter}
            keyExtractor={(item: ICurrency) => {
                return String(item.currencyId);
            }}
            labelExtractor={(item: ICurrency) => `${item.currencyName} - ${item.symbol}`}
        />
    );
};
