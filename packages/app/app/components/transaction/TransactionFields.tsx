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
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors, isEdit, isCreate } = _props;
    const { getCurrencySymbol, getCurrency } = useCurrency();
    const { targetCurrencyId, currencyId } = form;

    const hasDifferentCurrencies =
        !!form.targetCurrencyId &&
        !!form.currencyId &&
        !isNaN(form.targetCurrencyId) &&
        !isNaN(form.currencyId) &&
        form.targetCurrencyId !== form.currencyId;

    const sourceCurrencySymbol = hasDifferentCurrencies ? getCurrency(form.currencyId as number)?.currencyCode : undefined;
    const targetCurrencySymbol = hasDifferentCurrencies ? getCurrency(form.targetCurrencyId as number)?.currencyCode : undefined;

    const { data: rates } = useAppQuery<IRate | undefined>(
        [QueryKeys.rates(form.currencyId, form.targetCurrencyId), form.createdAt, sourceCurrencySymbol, targetCurrencySymbol],
        () => fetchRates(sourceCurrencySymbol, targetCurrencySymbol, form.createdAt as string),
        { enabled: hasDifferentCurrencies, staleTime: QueryStaleTimes.rates },
    );
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
                            onChange={(v) => {
                                handleChange?.('accountId', v.accountId);
                                handleChange?.('currencyId', v.currencyId);
                            }}
                        />
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
                                handleChange?.('targetCurrencyId', v.currencyId);
                            }}
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
                            onChange={(v) => {
                                handleChange?.('accountId', v.accountId);
                                handleChange?.('currencyId', v.currencyId);
                            }}
                        />
                        <CategoryDropdown
                            preset={'underline'}
                            value={form.categoryId}
                            disabled={isView}
                            helperTx={errors?.categoryId}
                            status={errors?.categoryId ? 'error' : undefined}
                            onChange={(v) => {
                                handleChange?.('categoryId', v.categoryId);
                                handleChange?.('targetCurrencyId', v.currencyId);
                            }}
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
                                handleChange?.('currencyId', v.currencyId);
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
                                handleChange?.('targetCurrencyId', v.currencyId);
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
            !!targetCurrencyId &&
            !!currencyId &&
            !isNaN(targetCurrencyId) &&
            !isNaN(currencyId) &&
            targetCurrencyId !== currencyId;

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
                                    handleChange?.('amount', v);
                                    if (rates && rates.rate && !isNaN(Number(v))) {
                                        handleChange?.('targetAmount', String(Utils.roundNumber(Number(v) * rates.rate)));
                                    }
                                },
                                currency: getCurrencySymbol(form.currencyId!),
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
                                onChangeCleaned: (v: string) => handleChange?.('targetAmount', v),
                                currency: getCurrencySymbol(form.targetCurrencyId!),
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
                        onChangeCleaned: (v: string) => {
                            handleChange?.('amount', v);
                            handleChange?.('targetAmount', v);
                        },
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
