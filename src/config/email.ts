// @ts-ignore
import * as nodemailer from "nodemailer";

export interface CustomTransportOptions extends nodemailer.TransportOptions {
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
}

// export const mailConfig: CustomTransportOptions = {
//     host: process.env.SMTP_HOST ?? '',
//     port: Number(process.env.SMTP_PORT),
//     auth: {
//         user: process.env.EMAIL_USER ?? '',
//         pass: process.env.EMAIL_PASSWORD ?? '',
//     },
// };

export const mailConfig = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.EMAIL_USER ?? '',
        pass: process.env.EMAIL_PASSWORD ?? '',
    },
});
