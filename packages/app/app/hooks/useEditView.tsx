import { useState } from 'react';
import * as Yup from 'yup';

import { TxKeyPath } from '@/i18n';

type Errors<T> = Partial<Record<keyof T, TxKeyPath>>;

export function useEditView<T extends object>(initialData: T, schema?: Yup.ObjectSchema<any>) {
    const [form, setForm] = useState<Partial<T>>(initialData);
    const [errors, setErrors] = useState<Errors<T>>({});

    const handleChange = <K extends keyof T>(key: K, value: T[K]) => {
        setForm((prev) => ({ ...(prev ?? {}), [key]: value }));
        setErrors((prev) => ({ ...(prev ?? {}), [key]: undefined }));
    };

    const validate = async (): Promise<boolean> => {
        if (!schema) return true;
        try {
            await schema.validate(form, { abortEarly: false });
            setErrors({});
            return true;
        } catch (err: any) {
            const newErrors: Errors<T> = {};
            if (err.inner) {
                err.inner.forEach((e: { path: keyof T; message: TxKeyPath }) => {
                    if (e.path && initialData[e.path] !== undefined) newErrors[e.path] = e.message;
                });
            }
            setErrors(newErrors);
            return false;
        }
    };

    const save = async (cb?: (data: Partial<T>) => Promise<void> | void) => {
        const isValid = await validate();
        if (!isValid) return;
        cb?.(form);
    };

    return {
        form,
        handleChange,
        save,
        errors,
        validate,
        setErrors,
    };
}
