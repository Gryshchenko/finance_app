import { FC } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { IAccount } from 'tenpercent/shared';
import { ICurrency } from 'tenpercent/shared';

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
    form: Partial<IAccount>;
    errors?: Partial<Record<keyof IAccount, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    isCreate: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const AccountFields: FC<IProps> = function AccountFields(_props) {
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
                    labelTx={'common:accountName'}
                    value={String(form.accountName)}
                    helperTx={errors?.accountName}
                    status={errors?.accountName ? 'error' : undefined}
                    editable={!isView}
                    style={themed($inputStyleOverride)}
                    containerStyle={themed($containerStyleOverride)}
                    LabelTextProps={{
                        style: themed($labelStyle),
                    }}
                    onChangeText={(v) => {
                        if (handleChange) {
                            handleChange('accountName', v);
                        }
                    }}
                />
                <CurrencyField
                    preset={'underline'}
                    labelTx={'common:amount'}
                    value={String(form.amount)}
                    helperTx={errors?.amount}
                    status={errors?.amount ? 'error' : undefined}
                    editable={!isView}
                    currency={getCurrencySymbol(form?.currencyId as number)}
                    onChangeCleaned={(v) => {
                        if (handleChange) {
                            handleChange('amount', v);
                        }
                    }}
                />
                <CurrencyDropdown
                    preset={'underline'}
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
