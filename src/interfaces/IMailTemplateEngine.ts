export interface IMailTemplateEngine {
    getConfirmMailTemplate(): string;
    getForgetPasswordTemplate(): string;
}
