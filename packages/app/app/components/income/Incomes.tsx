import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IIncome, Utils } from 'tenpercent/shared';

import { $center } from '@/components/category/CategoriesSectionList';
import { EmptyState } from '@/components/EmptyState';
import { ListItem } from '@/components/ListItem';
import { Text } from '@/components/Text';
import { ViewButton } from '@/components/ViewButton';
import { useCurrency } from '@/context/CurrencyContext';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { useAppTheme } from '@/theme/context';
import { OverviewPath } from '@/types/OverviewPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

interface IIncomesPros {
    data: IIncome[] | undefined;
    fetch?: () => Promise<IIncome[] | undefined>;
    onPress?: (id: number, name: string) => void;
}

export const Incomes: FC<IIncomesPros> = function Incomes(_props) {
    const { data, onPress } = _props;
    const navigation = useNavigation();
    const { themed } = useAppTheme();
    const { getCurrencySymbol } = useCurrency();

    if (!data || data?.length <= 0) {
        return (
            <EmptyState
                style={$containerStyleOverride}
                buttonOnPress={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            />
        );
    }

    return (
        <>
            {data.map(({ incomeId, incomeName, currencyId }) => {
                return (
                    <ListItem
                        key={incomeId}
                        disabled={!Utils.isNumber(incomeId as unknown as string)}
                        bottomSeparator
                        RightComponent={
                            <>
                                <Text style={themed([$center])}>
                                    {CurrencyUtils.formatWithDelimiter(0, getCurrencySymbol(currencyId))}
                                </Text>
                                <View style={$buttons}>
                                    <ViewButton
                                        style={$button}
                                        onPress={() => {
                                            navigation.getParent()?.navigate(OverviewPath.Incomes, {
                                                screen: IncomePath.IncomeEdit,
                                                params: { id: incomeId, name: incomeName },
                                            });
                                        }}
                                    />
                                </View>
                            </>
                        }
                        onPress={() => {
                            if (onPress) {
                                onPress?.(incomeId, incomeName);
                            }
                        }}
                    >
                        {incomeName}
                    </ListItem>
                );
            })}
        </>
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
const $buttons: StyleProp<ViewStyle> = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
};
const $button: StyleProp<ViewStyle> = {
    paddingHorizontal: 5,
};
