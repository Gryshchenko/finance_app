import { FC } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ICurrency } from 'tenpercent/shared';
import { IIncome } from 'tenpercent/shared';

import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailViewю';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';

interface IProps {
    form: Partial<IIncome>;
    errors?: Partial<Record<keyof IIncome, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const IncomeFields: FC<IProps> = function IncomeFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit } = _props;
    return (
        <GeneralDetailView isView={isView} onEdit={edit} onCancel={cancel} onSave={handleSave} onDelete={onDelete}>
            <view style={$fieldWrapper as undefined}>
                <Field
                    style={$fieldName}
                    label={translate('common:name')}
                    componentProps={{
                        value: String(form.incomeName),
                        helperTx: errors?.incomeName,
                        status: errors?.incomeName ? 'error' : undefined,
                        editable: !isView,
                        onChangeText: (v) => {
                            if (handleChange) {
                                handleChange('incomeName', v);
                            }
                        },
                    }}
                />
                <CurrencyDropdown
                    style={$fieldCurrency}
                    disabled={isView || isEdit}
                    helperTx={errors?.currencyId}
                    status={errors?.currencyId ? 'error' : undefined}
                    value={form.currencyId}
                    onChange={(item: ICurrency) => {
                        if (handleChange) {
                            handleChange('currencyId', item.currencyId);
                        }
                    }}
                />
            </view>
        </GeneralDetailView>
    );
};
const $fieldWrapper: StyleProp<ViewStyle> = {
    display: 'flex',
    justifyContent: 'space-between',
};
const $fieldName: StyleProp<TextStyle> = {
    width: '60%',
};
const $fieldCurrency: StyleProp<TextStyle> = {
    width: '38%',
};
