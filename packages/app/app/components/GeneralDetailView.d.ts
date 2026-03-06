interface GeneralDetailViewProps {
    children: React.ReactNode;
    isView: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
    onDelete?: () => void;
}
export declare const GeneralDetailView: React.FC<GeneralDetailViewProps>;
export {};
