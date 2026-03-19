import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { ICategory } from 'tenpercent/shared';
import { ICurrency } from 'tenpercent/shared';

import { GeneralDetailView } from '@/components/GeneralDetailView';
import { IconField } from '@/components/IconField';
import { TextField } from '@/components/TextField';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
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
                    inputWrapperStyle={themed($inputWrapperStyle)}
                    labelTx={'common:name'}
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
