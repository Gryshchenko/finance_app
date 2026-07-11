export interface IEmailContent {
    appName: string;
    // Hidden preheader shown as the preview snippet in the inbox list.
    previewText: string;
    title: string;
    greeting: string;
    intro: string;
    // Big confirmation code shown in a highlighted box (optional — layout works without it too).
    code?: string;
    codeLabel?: string;
    codeHint?: string;
    // Secondary note under the code (e.g. "if you didn't request this...").
    outro?: string;
    signature: string;
    year: number;
}

// Palette kept inline (email clients strip <style>/CSS variables — inline styles are the only safe option).
const COLOR = {
    bg: '#f4f5f7',
    card: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    muted: '#6b7280',
    accent: '#2563eb',
    codeBg: '#f0f5ff',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Renders a responsive, email-client-safe (table + inline styles) confirmation-code email.
 * Provider-agnostic: returns a plain HTML/text string that any transport (AWS SES, SMTP, ...) can send.
 */
export default class EmailLayout {
    public static renderHtml(content: IEmailContent): string {
        const { appName, previewText, title, greeting, intro, code, codeLabel, codeHint, outro, signature, year } = content;

        const codeBlock = code
            ? `
                <tr>
                    <td style="padding: 8px 0 4px 0;">
                        ${
                            codeLabel
                                ? `<p style="margin: 0 0 8px 0; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; color: ${COLOR.muted};">${codeLabel}</p>`
                                : ''
                        }
                        <div style="background: ${COLOR.codeBg}; border: 1px solid ${COLOR.border}; border-radius: 10px; padding: 20px; text-align: center;">
                            <span style="font-family: 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: ${COLOR.accent};">${code}</span>
                        </div>
                    </td>
                </tr>`
            : '';

        const codeHintBlock = codeHint
            ? `
                <tr>
                    <td style="padding: 12px 0 0 0;">
                        <p style="margin: 0; font-size: 14px; line-height: 22px; color: ${COLOR.muted};">${codeHint}</p>
                    </td>
                </tr>`
            : '';

        const outroBlock = outro
            ? `
                <tr>
                    <td style="padding: 20px 0 0 0;">
                        <p style="margin: 0; font-size: 14px; line-height: 22px; color: ${COLOR.muted};">${outro}</p>
                    </td>
                </tr>`
            : '';

        return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background: ${COLOR.bg};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${COLOR.bg};">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px;">
                    <tr>
                        <td style="padding: 0 8px 20px 8px;">
                            <span style="font-family: ${FONT}; font-size: 20px; font-weight: 700; color: ${COLOR.text};">${appName}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: ${COLOR.card}; border: 1px solid ${COLOR.border}; border-radius: 14px; padding: 36px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: ${FONT};">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0 0 16px 0; font-size: 24px; line-height: 32px; font-weight: 700; color: ${COLOR.text};">${title}</h1>
                                        <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 24px; color: ${COLOR.text};">${greeting}</p>
                                        <p style="margin: 0; font-size: 15px; line-height: 24px; color: ${COLOR.text};">${intro}</p>
                                    </td>
                                </tr>
                                ${codeBlock}
                                ${codeHintBlock}
                                ${outroBlock}
                                <tr>
                                    <td style="padding: 28px 0 0 0;">
                                        <p style="margin: 0; font-size: 15px; line-height: 24px; color: ${COLOR.text};">${signature}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 8px 0 8px;">
                            <p style="margin: 0; font-family: ${FONT}; font-size: 12px; line-height: 18px; color: ${COLOR.muted};">${appName} &bull; ${year}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    public static renderText(content: IEmailContent): string {
        const { title, greeting, intro, code, codeHint, outro, signature } = content;
        return [title, '', greeting, intro, code ? `\n    ${code}\n` : '', codeHint ?? '', outro ?? '', '', signature]
            .filter((line) => line !== '')
            .join('\n')
            .trim();
    }
}
