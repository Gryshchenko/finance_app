import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { IAccount } from 'tenpercent/shared';
import { ICurrency } from 'tenpercent/shared';

import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailViewю';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';

interface IProps {
    form: Partial<IAccount>;
    errors?: Partial<Record<keyof IAccount, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const AccountFields: FC<IProps> = function AccountFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit } = _props;
    return (
        <GeneralDetailView isView={isView} onEdit={edit} onCancel={cancel} onSave={handleSave} onDelete={onDelete}>
            <View style={$fieldWrapper as undefined}>
                <Field
                    style={$fieldName}
                    label={translate('common:name')}
                    componentProps={{
                        value: String(form.accountName),
                        helperTx: errors?.accountName,
                        status: errors?.accountName ? 'error' : undefined,
                        editable: !isView,
                        onChangeText: (v) => {
                            if (handleChange) {
                                handleChange('accountName', v);
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
            </View>
            <View>
                <Field
                    style={$fieldName}
                    label={translate('common:amount')}
                    componentProps={{
                        value: String(form.amount),
                        helperTx: errors?.amount,
                        status: errors?.amount ? 'error' : undefined,
                        editable: !isView,
                        onChangeText: (v) => {
                            if (handleChange) {
                                handleChange('amount', v);
                            }
                        },
                    }}
                />
            </View>
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
