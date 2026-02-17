import { IIncome } from 'tenpercent/shared';

import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { IncomeBox } from '@/components/Box/IncomeBox';
import { ItemType } from '@/components/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useCurrency } from '@/context/CurrencyContext';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default function DashboardIncome(props: IDashboardItem) {
    const { getCurrencySymbol } = useCurrency();
    const { setDraggingType } = useDragOverlay();
    const { BoxProps } = props;
    const item = props.item as IIncome;
    return (
        <IncomeBox
            BoxProps={{
                styles: BoxProps?.styles,
            }}
            id={String(item.incomeId)}
            key={item.incomeName}
            title={item.incomeName}
            icon={'tmp'}
            value={CurrencyUtils.formatWithDelimiter(231, getCurrencySymbol(item.currencyId))}
            isDraggable={true}
            onDragStart={() => {
                setDraggingType(ItemType.Income);
            }}
            onDragEnd={() => {
                setDraggingType(undefined);
            }}
        />
    );
}
