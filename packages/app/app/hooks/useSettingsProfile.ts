import { useMemo, useState } from 'react';
import { ICurrency, IProfileClient } from 'tenpercent/shared';

import { LanguageOption } from '@/components/settings/settingsLocales';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery, useInvalidateQuery } from '@/hooks/useAppQuery';
import { changeLanguage } from '@/i18n/translate';
import { IClientConfig } from '@/interfaces/IClientConfig';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ClientConfigService } from '@/services/ClientConfigService';
import { ProfileService } from '@/services/ProfileService';
import { InvalidationGroups, QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';

export async function fetchProfile(): Promise<IProfileClient | undefined> {
    const response = await ProfileService.instance().doGetProfile();
    if (response.kind === GeneralApiProblemKind.Ok) return response.data as IProfileClient;
    buildGeneralApiBaseHandler(response);
    return undefined;
}

async function fetchClientConfig(): Promise<IClientConfig | undefined> {
    const response = await ClientConfigService.instance().doGetConfig();
    if (response.kind === GeneralApiProblemKind.Ok) return response.data as IClientConfig;
    buildGeneralApiBaseHandler(response);
    return undefined;
}

export interface UseSettingsProfileResult {
    profile: IProfileClient | undefined;
    currencyList: ICurrency[];
    currencyValue: string | undefined;
    currencyDisplayValue: string | undefined;
    languageOptions: LanguageOption[];
    languageValue: string | undefined;
    languageDisplayValue: string | undefined;
    isSaving: boolean;
    handleCurrencyChange: (item: ICurrency) => Promise<void>;
    handleLanguageChange: (item: LanguageOption) => Promise<void>;
}

export function useSettingsProfile(): UseSettingsProfileResult {
    const { currencies } = useCurrency();
    const invalidateQuery = useInvalidateQuery();
    const [isSaving, setIsSaving] = useState(false);

    const { data: profile } = useAppQuery<IProfileClient | undefined>(QueryKeys.profile(), fetchProfile, {
        staleTime: QueryStaleTimes.detail,
    });

    const { data: config } = useAppQuery<IClientConfig | undefined>(QueryKeys.clientConfig(), fetchClientConfig, {
        staleTime: QueryStaleTimes.static,
    });

    const currencyList = useMemo(() => Array.from(currencies.values()), [currencies]);

    const currencyDisplayValue = useMemo(() => {
        if (profile?.currencyCode == null) return undefined;
        const c = currencies.get(profile.currencyCode);
        return c ? `${c.currencyName} - ${c.symbol}` : undefined;
    }, [profile?.currencyCode, currencies]);

    const languageOptions: LanguageOption[] = config?.locales ?? [];

    const languageDisplayValue = useMemo(() => {
        if (!profile?.locale) return undefined;
        return config?.locales.find((l) => l.locale === profile.locale)?.label ?? profile.locale;
    }, [profile?.locale, config?.locales]);

    async function handleCurrencyChange(item: ICurrency) {
        if (!profile || item.currencyCode === profile.currencyCode || isSaving) return;
        setIsSaving(true);
        try {
            const response = await ProfileService.instance().doPatchProfile({
                currencyCode: String(item.currencyCode),
                locale: profile.locale,
                publicName: profile.publicName,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.success({ message: 'settingsScreen:updateCurrencySuccess' });
                await invalidateQuery(InvalidationGroups.profile());
            } else {
                ToastService.error({ message: 'settingsScreen:updateCurrencyFailed' });
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleLanguageChange(item: LanguageOption) {
        if (!profile || item.locale === profile.locale || isSaving) return;
        setIsSaving(true);
        try {
            const response = await ProfileService.instance().doPatchProfile({
                locale: item.locale,
                currencyCode: profile.currencyCode != null ? String(profile.currencyCode) : undefined,
                publicName: profile.publicName,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.success({ message: 'settingsScreen:updateLanguageSuccess' });
                await invalidateQuery(InvalidationGroups.profile());
                await changeLanguage(item.locale);
            } else {
                ToastService.error({ message: 'settingsScreen:updateLanguageFailed' });
            }
        } finally {
            setIsSaving(false);
        }
    }

    return {
        profile,
        currencyList,
        currencyValue: profile?.currencyCode != null ? String(profile.currencyCode) : undefined,
        currencyDisplayValue,
        languageOptions,
        languageValue: profile?.locale,
        languageDisplayValue,
        isSaving,
        handleCurrencyChange,
        handleLanguageChange,
    };
}
