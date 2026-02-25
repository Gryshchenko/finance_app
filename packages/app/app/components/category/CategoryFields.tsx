import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { ICategory } from 'tenpercent/shared';
import { ICurrency } from 'tenpercent/shared';

import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailViewю';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';

interface IProps {
    form: Partial<ICategory>;
    errors?: Partial<Record<keyof ICategory, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const CategoryFields: FC<IProps> = function CategoryFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit } = _props;
    return (
        <GeneralDetailView isView={isView} onEdit={edit} onCancel={cancel} onSave={handleSave} onDelete={onDelete}>
            <View style={$fieldWrapper as undefined}>
                <Field
                    style={$fieldName}
                    label={translate('common:name')}
                    componentProps={{
                        value: String(form.categoryName),
                        helperTx: errors?.categoryName,
                        status: errors?.categoryName ? 'error' : undefined,
                        editable: !isView,
                        onChangeText: (v) => {
                            if (handleChange) {
                                handleChange('categoryName', v);
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
