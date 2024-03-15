export interface ISendMailPayload {
    sender: { mail: string; name: string };
    recipients: Array<{ mail: string; name: string }>;
    subject: string;
    html?: string;
    text: string;
    template?: string;
    tags: Record<string, unknown>;
}
