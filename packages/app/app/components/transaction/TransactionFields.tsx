import { FC, FunctionComponent } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { TransactionType, Utils } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

import { AccountDropdown } from '@/components/account/AccountDropdown';
import { CategoryDropdown } from '@/components/category/CateogryDropdown';
import { CurrencyField } from '@/components/CurrencyField';
import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailView';
import { DatePickerType, IgniteDatePicker } from '@/components/IgniteDatePicker';
import { IncomeDropdown } from '@/components/income/IncomeDropdown';
import { TextField } from '@/components/TextField';
import { useCurrency } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';
import { ITransactionClient } from '@/interfaces/ITransactionClient';

interface IProps {
    form: Partial<ITransactionClient>;
    rates?: IRate | undefined;
    errors?: Partial<Record<keyof ITransactionClient, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    isCreate: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const TransactionFields: FC<IProps> = function TransactionFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit, isCreate, rates } = _props;
    const { getCurrencySymbol } = useCurrency();
    const { sourceCurrencyId, currencyId } = form;

    const renderDropdownInputs = () => {
        switch (form.transactionTypeId) {
            case TransactionType.Transafer:
                return (
                    <>
                        <AccountDropdown
                            preset={'underline'}
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('accountId', v.accountId)}
                        />
                        <AccountDropdown
                            labelTx={'transactionScreen:transferToAccount'}
                            modalTitleTx={'transactionScreen:transferToAccount'}
                            preset={'underline'}
                            value={form.targetAccountId}
                            disabled={isView}
                            helperTx={errors?.targetAccountId}
                            status={errors?.targetAccountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('targetAccountId', v?.accountId)}
                        />
                    </>
                );
            case TransactionType.Expense:
                return (
                    <>
                        <AccountDropdown
                            preset={'underline'}
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('accountId', v.accountId)}
                        />
                        <CategoryDropdown
                            preset={'underline'}
                            value={form.categoryId}
                            disabled={isView}
                            helperTx={errors?.categoryId}
                            status={errors?.categoryId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('categoryId', v.categoryId)}
                        />
                    </>
                );
            case TransactionType.Income:
                return (
                    <>
                        <IncomeDropdown
                            preset={'underline'}
                            value={form.incomeId}
                            disabled={isView}
                            helperTx={errors?.incomeId}
                            status={errors?.incomeId ? 'error' : undefined}
                            onChange={(v) => {
                                handleChange?.('incomeId', v.incomeId);
                            }}
                        />
                        <AccountDropdown
                            preset={'underline'}
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => {
                                handleChange?.('accountId', v.accountId);
                            }}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    const renderAmountInputs = () => {
        const showDualCurrency =
            !!sourceCurrencyId &&
            !!currencyId &&
            !isNaN(sourceCurrencyId) &&
            !isNaN(currencyId) &&
            sourceCurrencyId !== currencyId;

        if (showDualCurrency) {
            return (
                <View style={$twoAmountFieldWrapper}>
                    <View style={$twoAmountField}>
                        <Field
                            Component={CurrencyField as FunctionComponent<unknown>}
                            componentProps={{
                                preset: 'underline',
                                focusOnMount: true,
                                onChangeCleaned: (v: string) => {
                                    handleChange?.('amountInCurrency', v);
                                    if (rates && rates.rate > 0 && !isNaN(Number(v))) {
                                        handleChange?.('amount', Utils.roundNumber(Number(v) * rates.rate));
                                    }
                                },
                                currency: getCurrencySymbol(form.sourceCurrencyId!),
                                value: form.amountInCurrency!,
                                editable: !isView,
                                helperTx: errors?.amountInCurrency,
                                labelTx: 'common:amount',
                                status: errors?.amountInCurrency ? 'error' : undefined,
                            }}
                        />
                    </View>
                    <View style={$twoAmountField}>
                        <Field
                            Component={CurrencyField as FunctionComponent<unknown>}
                            componentProps={{
                                preset: 'underline',
                                focusOnMount: false,
                                onChangeCleaned: (v: string) => handleChange?.('amount', v),
                                currency: getCurrencySymbol(form.currencyId!),
                                value: form.amount!,
                                editable: !isView,
                                helperTx: errors?.amount,
                                labelTx: ' ',
                                status: errors?.amount ? 'error' : undefined,
                            }}
                        />
                    </View>
                </View>
            );
        } else {
            return (
                <Field
                    Component={CurrencyField as FunctionComponent<unknown>}
                    componentProps={{
                        preset: 'underlineBig',
                        focusOnMount: true,
                        onChangeCleaned: (v: string) => handleChange?.('amount', v),
                        currency: getCurrencySymbol(form.currencyId!),
                        value: String(form.amount!),
                        editable: !isView,
                        helperTx: errors?.amount,
                        labelTx: 'common:amount',
                        status: errors?.amount ? 'error' : undefined,
                    }}
                />
            );
        }
    };

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
                {renderAmountInputs()}
                {renderDropdownInputs()}

                <IgniteDatePicker
                    preset={'underline'}
                    disabled={isView}
                    mode={DatePickerType.Datetime}
                    value={form.createdAt!}
                    helperTx={errors?.createdAt}
                    status={errors?.createdAt ? 'error' : undefined}
                    onChange={(v) => {
                        handleChange?.('createdAt', v);
                    }}
                />

                <TextField
                    preset={'underline'}
                    labelTx={'transactionScreen:description'}
                    value={form.description!}
                    helperTx={errors?.description}
                    status={errors?.description ? 'error' : undefined}
                    editable={!isView}
                    onChangeText={(v) => handleChange?.('description', v)}
                />
            </View>
        </GeneralDetailView>
    );
};

const $fieldWrapper: StyleProp<ViewStyle> = {
    display: 'flex',
    justifyContent: 'space-between',
};

const $twoAmountFieldWrapper: StyleProp<ViewStyle> = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
};

const $twoAmountField: StyleProp<ViewStyle> = {
    width: '48%',
};
