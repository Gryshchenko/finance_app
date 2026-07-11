import { getConfig } from 'src/config/config';
import Parameter from 'src/services/translations/Parameter';
import Translations from 'src/services/translations/Translations';
import { TranslationKey } from 'src/types/TranslationKey';

import EmailLayout, { IEmailContent } from './EmailLayout';

export interface IRenderedMail {
    subject: string;
    html: string;
    text: string;
}

// Which flow a "resend code" email belongs to — selects the right wording.
export enum ResendCodeContext {
    REGISTRATION = 'registration',
    EMAIL_CHANGE = 'emailChange',
    PASSWORD_CHANGE = 'passwordChange',
}

export interface IMailTemplateService {
    registrationConfirmation(code: number, expiresInMinutes: number): IRenderedMail;
    registrationCode(code: number, expiresInMinutes: number): IRenderedMail;
    resendCode(context: ResendCodeContext, code: number, expiresInMinutes: number): IRenderedMail;
    emailChangeConfirmation(code: number, expiresInMinutes: number): IRenderedMail;
    passwordChangeConfirmation(code: number, expiresInMinutes: number): IRenderedMail;
    forgotPasswordCode(code: number, expiresInMinutes: number): IRenderedMail;
}

function resendIntroKey(context: ResendCodeContext): TranslationKey {
    switch (context) {
        case ResendCodeContext.EMAIL_CHANGE:
            return TranslationKey.RESEND_EMAIL_CHANGE_TEXT;
        case ResendCodeContext.PASSWORD_CHANGE:
            return TranslationKey.RESEND_PASSWORD_CHANGE_TEXT;
        case ResendCodeContext.REGISTRATION:
        default:
            return TranslationKey.RESEND_REGISTRATION_TEXT;
    }
}

export default class MailTemplateService implements IMailTemplateService {
    public registrationConfirmation(code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.REG_CONFIRM_SUBJECT,
            titleKey: TranslationKey.REG_CONFIRM_TITLE,
            introKey: TranslationKey.REG_CONFIRM_TEXT,
            code,
            expiresInMinutes,
        });
    }

    public registrationCode(code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.REG_CODE_SUBJECT,
            titleKey: TranslationKey.REG_CODE_TITLE,
            introKey: TranslationKey.REG_CODE_TEXT,
            code,
            expiresInMinutes,
        });
    }

    public resendCode(context: ResendCodeContext, code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.RESEND_CODE_SUBJECT,
            titleKey: TranslationKey.RESEND_CODE_TITLE,
            introKey: resendIntroKey(context),
            code,
            expiresInMinutes,
        });
    }

    public emailChangeConfirmation(code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.EMAIL_CHANGE_SUBJECT,
            titleKey: TranslationKey.EMAIL_CHANGE_TITLE,
            introKey: TranslationKey.EMAIL_CHANGE_TEXT,
            code,
            expiresInMinutes,
        });
    }

    public passwordChangeConfirmation(code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.PASSWORD_CHANGE_SUBJECT,
            titleKey: TranslationKey.PASSWORD_CHANGE_TITLE,
            introKey: TranslationKey.PASSWORD_CHANGE_TEXT,
            code,
            expiresInMinutes,
        });
    }

    public forgotPasswordCode(code: number, expiresInMinutes: number): IRenderedMail {
        return this.buildCodeEmail({
            subjectKey: TranslationKey.FORGOT_PASSWORD_SUBJECT,
            titleKey: TranslationKey.FORGOT_PASSWORD_TITLE,
            introKey: TranslationKey.FORGOT_PASSWORD_TEXT,
            code,
            expiresInMinutes,
        });
    }

    private buildCodeEmail(params: {
        subjectKey: TranslationKey;
        titleKey: TranslationKey;
        introKey: TranslationKey;
        code: number;
        expiresInMinutes: number;
    }): IRenderedMail {
        const appName = String(getConfig().appName);
        const appNameParam = Parameter.Of('appName', appName);

        const subject = Translations.text(params.subjectKey, appNameParam);
        const title = Translations.text(params.titleKey, appNameParam);

        const content: IEmailContent = {
            appName,
            previewText: subject,
            title,
            greeting: Translations.text(TranslationKey.EMAIL_GREETING),
            intro: Translations.text(params.introKey, appNameParam),
            code: String(params.code),
            codeLabel: Translations.text(TranslationKey.EMAIL_CODE_LABEL),
            codeHint: Translations.text(TranslationKey.EMAIL_CODE_HINT, Parameter.Of('minutes', params.expiresInMinutes)),
            outro: Translations.text(TranslationKey.EMAIL_IGNORE_NOTICE),
            signature: Translations.text(TranslationKey.EMAIL_SIGNATURE, appNameParam),
            year: new Date().getFullYear(),
        };

        return {
            subject,
            html: EmailLayout.renderHtml(content),
            text: EmailLayout.renderText(content),
        };
    }
}
