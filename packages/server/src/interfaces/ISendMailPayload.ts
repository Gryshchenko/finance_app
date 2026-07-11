export interface ISendMailPayload {
    sender: { mail: string; name: string };
    recipients: { mail: string; name: string }[];
    subject: string;
    text: string;
    html?: string;
}
