export type SenderPreset = {
  label: string;
  host: string;
  port: number;
  secure: boolean;
};

export const SENDER_PRESETS: SenderPreset[] = [
  { label: 'Google', host: 'smtp.gmail.com', port: 465, secure: true },
  { label: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, secure: false },
  { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  { label: 'iCloud', host: 'smtp.mail.me.com', port: 587, secure: false },
];
