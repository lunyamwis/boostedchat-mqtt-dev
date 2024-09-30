import { mailConfig } from "../config/email";
import { appLogger } from "../config/logger";

/**
 * class to send emails
 */
class Mailer {
  /**
   * @constructor
   */
  constructor() {
    // none
  }

  /**
   * @param {string} message the actual message to be sent
   */
  public send = async (message: {
    cc?: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<boolean | Error> => {
    try {
      await new Promise((rsv, rjt) => {
        mailConfig.sendMail(
          {
            text: message.text,
            from: process.env.EMAIL_USER,
            to: JSON.parse(process.env.EMAIL_RECIPIENTS || '""'),
            subject: `${process.env.DOMAIN1} server: ${message.subject}`,
          },
          (error: Error | null) => { // Update the type of the error parameter
            if (error) {
              console.log(error);
              appLogger.error(error.message);
              return rjt(error);
            }
            rsv("Email sent");
            appLogger.info(`Email sent successfully`);
          }
        );
      });

      return true;
    } catch (error) {
      appLogger.error((error as Error).message);
      console.error((error as Error).message);
      throw new Error((error as Error).message);
    }
  };
}

export { Mailer };
