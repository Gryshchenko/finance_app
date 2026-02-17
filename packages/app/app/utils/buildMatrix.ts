type Matrix<T> = T[][];

interface BuildMatrixParams<T> {
    containerWidth: number;
    itemWidth: number;
    gap?: number;
    padding?: number;
    minColumns?: number;
    maxColumns?: number;
    items: T[];
}

export interface IBuildMatrixPayload {
    calculatedGap: number;
}

export function buildMatrix<T>({
    containerWidth,
    itemWidth,
    gap = 0,
    padding = 0,
    minColumns = 1,
    maxColumns = Infinity,
    items,
}: BuildMatrixParams<T>): { matrix: Matrix<T>; payload: IBuildMatrixPayload } {
    if (containerWidth <= 0 || itemWidth <= 0 || items.length === 0)
        return {
            matrix: [],
            payload: { calculatedGap: 0 },
        };

    const availableWidth = containerWidth - padding * 2;
    const totalItemWidth = itemWidth + gap;

    const rawColumns = Math.floor((availableWidth + gap) / totalItemWidth);

    const columns = Math.max(minColumns, Math.min(rawColumns, maxColumns));
    const totalItemsWidth = columns * itemWidth;

    const calculatedGap = (containerWidth - totalItemsWidth) / (columns - 1);

    const matrix: Matrix<T> = [];

    for (let i = 0; i < items.length; i += columns) {
        matrix.push(items.slice(i, i + columns));
    }

    return {
        matrix,
        payload: { calculatedGap },
    };
}
