import { ViewStyle } from 'react-native';

import { Dropdown } from '@/components/Dropdown';
import { fetchConfig } from '@/components/LanguagesDropdown';
import { TxKeyPath } from '@/i18n';
import { IClientConfigLanguage } from '@/interfaces/IClientConfigLanguages';

type CurrencyDropdownProps = {
    value?: string;
    onChange?: (item: IClientConfigLanguage) => void;
    style?: ViewStyle;
    disabled?: boolean;
    filter?: (items: IClientConfigLanguage[] | undefined) => IClientConfigLanguage[];
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
            queryKey={'currency'}
            fetcher={fetchConfig}
            filter={filter}
            keyExtractor={(item: IClientConfigLanguage) => {
                return String(item.currencyCode);
            }}
            labelExtractor={(item: IClientConfigLanguage) => `${item.label} (${item.symbol})`}
        />
    );
};
