import { ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ICategory } from 'tenpercent/shared';
import { TransactionFieldType } from 'tenpercent/shared';
import { TransactionType } from 'tenpercent/shared';

import { AddButton } from '@/components/buttons/AddButton';
import { Categories } from '@/components/category/Categories';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

export async function fetchCategories(): Promise<ICategory[]> {
    try {
        const categoriesService = CategoryService.instance();
        const response = await categoriesService.doGetCategories();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ICategory[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchCategories').error(`Fetch categories failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

type Props = NativeStackScreenProps<ParamListBase, string>;

export const CategoriesScreen = function ExpensesScreen(_props: Props) {
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<ICategory[] | undefined>(QueryKeys.categories(), fetchCategories, {
        staleTime: QueryStaleTimes.list,
    });

    return (
        <GenericListScreen
            name={translate('common:expenses')}
            isError={isError}
            isPending={isPending}
            props={{
                data,
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(OverviewPath.Categories, {
                        screen: TransactionPath.Transactions,
                        params: { id, name, type: TransactionFieldType.Category, path: OverviewPath.Categories },
                    });
                },
            }}
            RenderComponent={Categories}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Categories, {
                            screen: TransactionPath.TransactionCreate,
                            params: {
                                payload: {
                                    transactionTypeId: TransactionType.Expense,
                                },
                            },
                        });
                    }}
                />
            }
        />
    );
};
