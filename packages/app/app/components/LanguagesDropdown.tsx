import { ViewStyle } from 'react-native';

import { Dropdown } from '@/components/Dropdown';
import { TxKeyPath } from '@/i18n';
import { IClientConfig } from '@/interfaces/IClientConfig';
import { IClientConfigLanguage } from '@/interfaces/IClientConfigLanguages';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ClientConfigService } from '@/services/ClientConfigService';
import { Logger } from '@/utils/logger/Logger';

type LanguageDropdownProps = {
    value?: string;
    onChange?: (item: IClientConfigLanguage) => void;
    style?: ViewStyle;
    disabled?: boolean;
    filter?: (items: IClientConfigLanguage[] | undefined) => IClientConfigLanguage[];
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export async function fetchConfig(): Promise<IClientConfigLanguage[] | undefined> {
    try {
        const response = await ClientConfigService.instance().doGetConfig();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return (response.data as IClientConfig).locales as IClientConfigLanguage[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchAccounts').error(`Fetch languages failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
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
            labelTx={'common:language'}
            disabled={disabled}
            queryKey={'language'}
            fetcher={fetchConfig}
            filter={filter}
            keyExtractor={(item: IClientConfigLanguage) => {
                return String(item.locale);
            }}
            labelExtractor={(item: IClientConfigLanguage) => item.label}
        />
    );
};
