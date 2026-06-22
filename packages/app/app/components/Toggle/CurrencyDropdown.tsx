import { StyleProp, TextStyle } from 'react-native';
import { ICurrency } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { TextFieldPresets } from '@/components/TextField';
import { fetchCurrencies } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';

type CurrencyDropdownProps = {
    error?: TxKeyPath;
    value?: string;
    onChange?: (item: ICurrency) => void;
    style?: StyleProp<TextStyle>;
    filter?: (items: ICurrency[] | undefined) => ICurrency[];
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
    preset?: TextFieldPresets;
    editable?: boolean;
};

export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
    value,
    onChange,
    style,
    editable,
    filter,
    helperTx,
    status,
    preset,
}) => {
    return (
        <Dropdown
            helperTx={helperTx}
            status={status}
            style={style}
            onChange={onChange}
            value={value}
            labelTx={'common:currency'}
            modalTitleTx={'common:currency'}
            editable={editable}
            queryKey={'currencies'}
            fetcher={fetchCurrencies}
            filter={filter}
            preset={preset}
            keyExtractor={(item: ICurrency) => {
                return String(item.currencyCode);
            }}
            labelExtractor={(item: ICurrency) => `${item.currencyName} - ${item.symbol}`}
        />
    );
};
