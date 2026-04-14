import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { ICurrency, IIncome } from 'tenpercent/shared';

import { GeneralDetailView } from '@/components/GeneralDetailView';
import { IconField } from '@/components/IconField';
import { TextField } from '@/components/TextField';
import { CurrencyDropdown } from '@/components/Toggle/CurrencyDropdown';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    form: Partial<IIncome>;
    errors?: Partial<Record<keyof IIncome, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    isCreate: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const IncomeFields: FC<IProps> = function IncomeFields(_props) {
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
                    labelTx={'common:selectIcon'}
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
                    labelTx={'incomeScreen:incomeName'}
                    value={String(form.incomeName)}
                    helperTx={errors?.incomeName}
                    status={errors?.incomeName ? 'error' : undefined}
                    editable={!isView}
                    style={themed($inputStyleOverride)}
                    containerStyle={themed($containerStyleOverride)}
                    LabelTextProps={{
                        style: themed($labelStyle),
                    }}
                    onChangeText={(v) => {
                        if (handleChange) {
                            handleChange('incomeName', v);
                        }
                    }}
                />
                <CurrencyDropdown
                    preset={'underline'}
                    style={$fieldCurrency}
                    editable={!isView}
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
