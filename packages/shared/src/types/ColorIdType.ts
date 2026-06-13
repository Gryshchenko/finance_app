export enum ColorId {
    Black = 'black',
    Navy = 'navy',
    DarkSlate = 'darkSlate',
    DeepViolet = 'deepViolet',
    Teal = 'teal',
    Green = 'green',
    Pumpkin = 'pumpkin',
    DarkRed = 'darkRed',
    Blue = 'blue',
    Gray = 'gray',
    Purple = 'purple',
    Yellow = 'yellow',
    Orange = 'orange',
    Red = 'red',
    Amber = 'amber',
}

export const VALID_COLOR_IDS: string[] = Object.values(ColorId);

/** Palettes used to assign a default colorId when an entity is created. */
export const DEFAULT_ACCOUNT_COLOR_IDS: ColorId[] = [
    ColorId.Black,
    ColorId.Navy,
    ColorId.DarkSlate,
    ColorId.DeepViolet,
    ColorId.Teal,
    ColorId.Green,
    ColorId.Pumpkin,
    ColorId.DarkRed,
    ColorId.Blue,
    ColorId.Gray,
];

export const DEFAULT_INCOME_COLOR_IDS: ColorId[] = [
    ColorId.Green,
    ColorId.Blue,
    ColorId.Purple,
    ColorId.Yellow,
    ColorId.Orange,
    ColorId.Red,
    ColorId.DarkSlate,
    ColorId.Teal,
    ColorId.DeepViolet,
    ColorId.Amber,
];
