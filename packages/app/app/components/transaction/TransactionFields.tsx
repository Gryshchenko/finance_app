import { FC, FunctionComponent } from 'react';
import { ITransaction } from 'tenpercent/shared';
import { TransactionType } from 'tenpercent/shared';

import { AccountDropdown } from '@/components/account/AccountDropdown';
import { CategoryDropdown } from '@/components/category/CateogryDropdown';
import { CurrencyField } from '@/components/CurrencyField';
import { Field } from '@/components/Field';
import { GeneralDetailView } from '@/components/GeneralDetailView';
import { DatePickerType, IgniteDatePicker } from '@/components/IgniteDatePicker';
import IgniteSwitcher from '@/components/IgniteSwitcher';
import { IncomeDropdown } from '@/components/income/IncomeDropdown';
import { useCurrency } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';

interface IProps {
    form: Partial<ITransaction>;
    errors?: Partial<Record<keyof ITransaction, TxKeyPath>>;
    handleChange?: (key: string, value: string | number) => void;
    isView: boolean;
    isEdit: boolean;
    edit?: () => void;
    cancel?: () => void;
    onDelete?: () => void;
    handleSave?: () => void;
}

export const TransactionFields: FC<IProps> = function TransactionFields(_props) {
    const { isView, form, handleChange, handleSave, edit, cancel, onDelete, errors } = _props;
    const { getCurrencySymbol } = useCurrency();

    const renderInputs = () => {
        switch (form.transactionTypeId) {
            case TransactionType.Transafer:
                return (
                    <>
                        <AccountDropdown
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('accountId', v.accountId)}
                        />
                        <AccountDropdown
                            value={form.targetAccountId}
                            disabled={isView}
                            helperTx={errors?.targetAccountId}
                            status={errors?.targetAccountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('targetAccountId', v.accountId)}
                        />
                    </>
                );
            case TransactionType.Expense:
                return (
                    <>
                        <AccountDropdown
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('accountId', v.accountId)}
                        />
                        <CategoryDropdown
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
                            value={form.incomeId}
                            disabled={isView}
                            helperTx={errors?.incomeId}
                            status={errors?.incomeId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('incomeId', v.incomeId)}
                        />
                        <AccountDropdown
                            value={form.accountId}
                            disabled={isView}
                            helperTx={errors?.accountId}
                            status={errors?.accountId ? 'error' : undefined}
                            onChange={(v) => handleChange?.('accountId', v.accountId)}
                        />
                    </>
                );
            default:
                return null;
        }
    };
    return (
        <GeneralDetailView isView={isView} onEdit={edit} onCancel={cancel} onSave={handleSave} onDelete={onDelete}>
            <IgniteSwitcher
                disabled={isView}
                options={[
                    {
                        id: TransactionType.Income,
                        label: translate('common:incomes'),
                        value: TransactionType.Income,
                    },
                    {
                        id: TransactionType.Expense,
                        label: translate('common:expenses'),
                        value: TransactionType.Expense,
                    },
                    {
                        id: TransactionType.Transafer,
                        label: translate('common:transfer'),
                        value: TransactionType.Transafer,
                    },
                ]}
                value={form.transactionTypeId}
                onChange={(opt) => handleChange?.('transactionTypeId', opt.value as number)}
            />

            {renderInputs()}

            <Field
                label={translate('common:amount')}
                Component={CurrencyField as FunctionComponent<unknown>}
                componentProps={{
                    onChangeCleaned: (v: string) => handleChange?.('amount', v),
                    currency: getCurrencySymbol(form.currencyId!),
                    value: String(form.amount!),
                    editable: !isView,
                    helperTx: errors?.amount,
                    status: errors?.amount ? 'error' : undefined,
                }}
            />

            <Field
                label={translate('transactionScreen:description')}
                componentProps={{
                    value: form.description!,
                    editable: !isView,
                    helperTx: errors?.description,
                    status: errors?.description ? 'error' : undefined,
                    onChangeText: (v) => handleChange?.('description', v),
                }}
            />

            <IgniteDatePicker
                disabled={isView}
                mode={DatePickerType.Datetime}
                value={form.createdAt!}
                helperTx={errors?.createdAt}
                status={errors?.createdAt ? 'error' : undefined}
                onChange={() => null}
            />
        </GeneralDetailView>
    );
};
