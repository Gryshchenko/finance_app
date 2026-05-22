import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { ICategory, ICurrency } from 'tenpercent/shared';

import { CurrencyField } from '@/components/CurrencyField';
import { GeneralDetailView } from '@/components/GeneralDetailView';
import { IconField } from '@/components/IconField';
import { TextField } from '@/components/TextField';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
import { useCurrency } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    form: Partial<ICategory>;
    errors?: Partial<Record<keyof ICategory, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    isCreate: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const CategoryFields: FC<IProps> = function CategoryFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit, isCreate } = _props;
    const { themed } = useAppTheme();
    const { getCurrencySymbol } = useCurrency();
    return (
        <GeneralDetailView
            isCreate={isCreate}
            isEdit={isEdit}
            isView={isView}
            onEdit={edit}
            onCancel={cancel}
            onSave={handleSave}
            onDelete={onDelete}
        >
            <View style={$fieldWrapper as undefined}>
                <IconField
                    value={form.iconId}
                    disabled={isView}
                    onChange={(newIcon) => {
                        if (handleChange) {
                            handleChange('iconId', newIcon);
                        }
                    }}
                />
                <TextField
                    preset={'underlineBig'}
                    focusOnMount={true}
                    inputWrapperStyle={themed($inputWrapperStyle)}
                    labelTx={'common:categoryName'}
                    value={String(form.categoryName)}
                    helperTx={errors?.categoryName}
                    status={errors?.categoryName ? 'error' : undefined}
                    editable={!isView}
                    style={themed($inputStyleOverride)}
                    containerStyle={themed($containerStyleOverride)}
                    LabelTextProps={{
                        style: themed($labelStyle),
                    }}
                    onChangeText={(v) => {
                        if (handleChange) {
                            handleChange('categoryName', v);
                        }
                    }}
                />
                <CurrencyDropdown
                    preset={'underline'}
                    style={$fieldCurrency}
                    editable={isCreate}
                    helperTx={errors?.currencyId}
                    status={errors?.currencyId ? 'error' : undefined}
                    value={form.currencyId}
                    onChange={(item: ICurrency) => {
                        if (handleChange) {
                            handleChange('currencyId', item.currencyId);
                        }
                    }}
                />
                <CurrencyField
                    currency={getCurrencySymbol(form.currencyId!)}
                    preset={'underline'}
                    labelTx={'common:categoryBudget'}
                    placeholderTx={'common:categoryBudgetPlaceholder'}
                    keyboardType={'numeric'}
                    value={form.budget !== undefined && form.budget !== null ? String(form.budget) : ''}
                    helperTx={errors?.budget}
                    status={errors?.budget ? 'error' : undefined}
                    editable={!isView}
                    onChangeCleaned={(v) => {
                        if (!handleChange) return;
                        const normalized = v.replace(',', '.').replace(/[^0-9.]/g, '');
                        if (normalized === '') {
                            handleChange('budget', '');
                            return;
                        }
                        const num = Number(normalized);
                        if (!isNaN(num)) {
                            handleChange('budget', num);
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

const $fieldCurrency: StyleProp<TextStyle> = {
    width: '100%',
};

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
});

const $labelStyle: ThemedStyle<TextStyle> = () => ({
    fontSize: 12,
    textAlign: 'center',
});

const $inputStyleOverride: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 64,
    letterSpacing: -1.6,
    height: 120,
    textAlign: 'center',
    text: colors.text,
});

const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
    height: 170,
});
