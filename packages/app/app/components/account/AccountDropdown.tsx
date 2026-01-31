import { ViewStyle } from 'react-native';
import { IAccountListItem } from 'tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { TxKeyPath } from '@/i18n';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';

type AccountDropdownProps = {
    value?: number; // accountId
    onChange?: (item: IAccountListItem) => void;
    style?: ViewStyle;
    disabled?: boolean;
    filter?: (items: IAccountListItem[] | undefined) => IAccountListItem[];
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export const AccountDropdown: React.FC<AccountDropdownProps> = ({
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
            labelTx={'common:accounts'}
            disabled={disabled}
            queryKey={'accounts'}
            fetcher={fetchAccounts}
            filter={filter}
            keyExtractor={(item: IAccountListItem) => {
                return String(item.accountId);
            }}
            labelExtractor={(item: IAccountListItem) => item.accountName}
        />
    );
};
