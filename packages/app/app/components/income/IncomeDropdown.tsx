import { ViewStyle } from 'react-native';
import { IIncome } from '@tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { FieldPresets } from '@/components/FieldPresets';
import { TxKeyPath } from '@/i18n';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { Logger } from '@/utils/logger/Logger';

type IncomeDropdownProps = {
    preset?: FieldPresets;
    value?: number;
    onChange?: (item: IIncome) => void;
    style?: ViewStyle;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
};

export async function fetchIncomes(): Promise<IIncome[]> {
    try {
        const incomeService = IncomeService.instance();
        const response = await incomeService.doGetIncomes();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IIncome[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchIncomes').error(`Fetch income failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

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
