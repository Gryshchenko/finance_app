import { FC, FunctionComponent, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { TransactionType, Utils, IRate } from '@tenpercent/shared';

import { AccountDropdown } from '@/components/account/AccountDropdown';
import { CategoryDropdown } from '@/components/category/CateogryDropdown';
import { CurrencyField } from '@/components/CurrencyField';
import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailView';
import { DatePickerType, IgniteDatePicker } from '@/components/IgniteDatePicker';
import { IncomeDropdown } from '@/components/income/IncomeDropdown';
import { NumericKeypad } from '@/components/keypad';
import { TextField } from '@/components/TextField';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { TxKeyPath } from '@/i18n';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ExchangeService } from '@/services/ExchangeService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { Logger } from '@/utils/logger/Logger';

interface IProps {
    form: Partial<ITransactionClient>;
    errors?: Partial<Record<keyof ITransactionClient, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    isCreate: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
    isSaveDisabled?: boolean;
    isDeleteDisabled?: boolean;
}

const fetchRates = async (
    sourceCurrencySymbol: string | undefined,
    targetCurrencySymbol: string | undefined,
    date: string,
): Promise<IRate | undefined> => {
    try {
        if (sourceCurrencySymbol === targetCurrencySymbol) return undefined;
        if (!targetCurrencySymbol && !sourceCurrencySymbol) return undefined;
        if (!targetCurrencySymbol || !sourceCurrencySymbol) return undefined;

        const exchangeService = ExchangeService.instance();

        const response = await exchangeService.doGetRateForCurrency(sourceCurrencySymbol, targetCurrencySymbol, date);
        if (response.kind === GeneralApiProblemKind.Ok) {
            return response.data as IRate;
        } else {
            return undefined;
        }
    } catch (e) {
        Logger.Of('TransactionFilds').error(e);
        return undefined;
    }
};

export const TransactionFields: FC<IProps> = function TransactionFields(_props) {
    const { isView, form, handleChange, handleSave, edit, errors, isEdit, isCreate, isSaveDisabled, isDeleteDisabled } = _props;
    const { getCurrencySymbol, getCurrency } = useCurrency();
    const { targetCurrencyCode, currencyCode } = form;

    const hasDifferentCurrencies =
        !!form.targetCurrencyCode && !!form.currencyCode && form.targetCurrencyCode !== form.currencyCode;

    const sourceCurrencySymbol = hasDifferentCurrencies ? getCurrency(form.currencyCode as string)?.currencyCode : undefined;
    const targetCurrencySymbol = hasDifferentCurrencies
        ? getCurrency(form.targetCurrencyCode as string)?.currencyCode
        : undefined;

    const { data: rates } = useAppQuery<IRate | undefined>(
        [QueryKeys.rates(form.currencyCode, form.targetCurrencyCode), form.createdAt, sourceCurrencySymbol, targetCurrencySymbol],
        () => fetchRates(sourceCurrencySymbol, targetCurrencySymbol, form.createdAt as string),
        { enabled: hasDifferentCurrencies, staleTime: QueryStaleTimes.rates },
    );

    // Which amount field the keypad currently edits. In single-currency mode this
    // is always `amount`; in dual-currency mode it follows the tapped field.
    const [activeField, setActiveField] = useState<'amount' | 'targetAmount'>('amount');

    // Mirror the same currency-conversion side effect used by the text inputs so
    // the keypad and manual typing stay consistent.
    const commitAmount = (field: 'amount' | 'targetAmount', next: string) => {
        if (field === 'targetAmount') {
            handleChange?.('targetAmount', next);
            return;
        }
        handleChange?.('amount', next);
        if (hasDifferentCurrencies) {
            if (rates?.rate && next !== '' && !isNaN(Number(next))) {
                handleChange?.('targetAmount', String(Utils.roundNumber(Number(next) * rates.rate)));
            }
        } else {
            handleChange?.('targetAmount', next);
        }
    };

    const appendKey = (current: string, key: string): string => {
        if (key === '.') {
            if (current.includes('.')) return current;
            return current === '' ? '0.' : current + '.';
        }
        // Replace a lone leading zero so we never build values like "07".
        if (current === '0') return key === '00' ? '0' : key;
        return current + key;
    };

    const editActiveAmount = (transform: (current: string) => string) => {
        const raw = activeField === 'amount' ? form.amount : form.targetAmount;
        const current = raw === undefined || raw === null ? '' : String(raw);
        commitAmount(activeField, transform(current));
    };

    const renderDropdownInputs = () => {
        switch (form.transactionTypeId) {
            case TransactionType.Transafer:
                return (
                    <>
                        <View style={$twoAmountField}>
                            <AccountDropdown
                                preset={'underline'}
                                value={form.accountId}
                                disabled={isView}
                                helperTx={errors?.accountId}
                                status={errors?.accountId ? 'error' : undefined}
                                onChange={(v) => {
                                    handleChange?.('accountId', v.accountId);
                                    handleChange?.('currencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                        <View style={$twoAmountField}>
                            <AccountDropdown
                                labelTx={'transactionScreen:transferToAccount'}
                                modalTitleTx={'transactionScreen:transferToAccount'}
                                preset={'underline'}
                                value={form.targetAccountId}
                                disabled={isView}
                                helperTx={errors?.targetAccountId}
                                status={errors?.targetAccountId ? 'error' : undefined}
                                filter={(items) => items?.filter((item) => item.accountId !== form.accountId) ?? []}
                                onChange={(v) => {
                                    handleChange?.('targetAccountId', v.accountId);
                                    handleChange?.('targetCurrencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                    </>
                );
            case TransactionType.Expense:
                return (
                    <>
                        <View style={$twoAmountField}>
                            <AccountDropdown
                                preset={'underline'}
                                value={form.accountId}
                                disabled={isView}
                                helperTx={errors?.accountId}
                                status={errors?.accountId ? 'error' : undefined}
                                onChange={(v) => {
                                    handleChange?.('accountId', v.accountId);
                                    handleChange?.('currencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                        <View style={$twoAmountField}>
                            <CategoryDropdown
                                preset={'underline'}
                                value={form.categoryId}
                                disabled={isView}
                                helperTx={errors?.categoryId}
                                status={errors?.categoryId ? 'error' : undefined}
                                onChange={(v) => {
                                    handleChange?.('categoryId', v.categoryId);
                                    handleChange?.('targetCurrencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                    </>
                );
            case TransactionType.Income:
                return (
                    <>
                        <View style={$twoAmountField}>
                            <IncomeDropdown
                                preset={'underline'}
                                value={form.incomeId}
                                disabled={isView}
                                helperTx={errors?.incomeId}
                                status={errors?.incomeId ? 'error' : undefined}
                                onChange={(v) => {
                                    handleChange?.('incomeId', v.incomeId);
                                    handleChange?.('currencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                        <View style={$twoAmountField}>
                            <AccountDropdown
                                preset={'underline'}
                                value={form.accountId}
                                disabled={isView}
                                helperTx={errors?.accountId}
                                status={errors?.accountId ? 'error' : undefined}
                                onChange={(v) => {
                                    handleChange?.('accountId', v.accountId);
                                    handleChange?.('targetCurrencyCode', v.currencyCode);
                                }}
                            />
                        </View>
                    </>
                );
            default:
                return null;
        }
    };

    const renderAmountInputs = () => {
        const showDualCurrency = !!targetCurrencyCode && !!currencyCode && targetCurrencyCode !== currencyCode;

        if (showDualCurrency) {
            return (
                <View style={$twoAmountFieldWrapper}>
                    <View style={$twoAmountField}>
                        <Field
                            Component={CurrencyField as FunctionComponent<unknown>}
                            componentProps={{
                                preset: 'underline',
                                focusOnMount: true,
                                showSoftInputOnFocus: false,
                                onPressIn: () => setActiveField('amount'),
                                onChangeCleaned: (v: string) => commitAmount('amount', v),
                                currency: getCurrencySymbol(form.currencyCode!),
                                value: form.amount!,
                                editable: !isView,
                                helperTx: errors?.amount,
                                labelTx: 'common:amount',
                                status: errors?.amount ? 'error' : undefined,
                            }}
                        />
                    </View>
                    <View style={$twoAmountField}>
                        <Field
                            Component={CurrencyField as FunctionComponent<unknown>}
                            componentProps={{
                                preset: 'underline',
                                focusOnMount: false,
                                showSoftInputOnFocus: false,
                                onPressIn: () => setActiveField('targetAmount'),
                                onChangeCleaned: (v: string) => commitAmount('targetAmount', v),
                                currency: getCurrencySymbol(form.targetCurrencyCode!),
                                value: form.targetAmount!,
                                editable: !isView,
                                helperTx: errors?.targetAmount,
                                labelTx: ' ',
                                status: errors?.targetAmount ? 'error' : undefined,
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
                        showSoftInputOnFocus: false,
                        onPressIn: () => setActiveField('amount'),
                        onChangeCleaned: (v: string) => commitAmount('amount', v),
                        currency: getCurrencySymbol(form.currencyCode!),
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
            isSaveDisabled={isSaveDisabled}
            isDeleteDisabled={isDeleteDisabled}
        >
            <View style={$fieldWrapper as undefined}>
                {renderAmountInputs()}
                <View style={$twoAmountFieldWrapper}>{renderDropdownInputs()}</View>
                <View style={$twoAmountFieldWrapper}>
                    <View style={$twoAmountField}>
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
                    </View>

                    <View style={$twoAmountField}>
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
                </View>

                <NumericKeypad
                    isSubmitDisabled={isSaveDisabled}
                    onKeyPress={(key) => editActiveAmount((current) => appendKey(current, key))}
                    onBackspace={() => editActiveAmount((current) => current.slice(0, -1))}
                    onClear={() => editActiveAmount(() => '')}
                    onSubmit={handleSave}
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
