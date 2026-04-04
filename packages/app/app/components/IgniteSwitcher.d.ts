type SwitcherOption = {
    id: string | number;
    label: string;
    value: unknown;
};
type IgniteSwitcherProps = {
    disabled?: boolean;
    options: SwitcherOption[];
    value?: unknown;
    onChange?: (item: SwitcherOption) => void;
    style?: Record<string, unknown>;
};
export default function IgniteSwitcher({
    options,
    value,
    onChange,
    style,
    disabled,
}: IgniteSwitcherProps): import('react').JSX.Element;
export {};
