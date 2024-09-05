import { cleanEnv, email, json, num, str, url } from "envalid";

export const validateEnv = () => {
  const envs = {
    PROXY_USERNAME: str(),
    PROXY_PASSWORD: str(),
    API_URL: url(),
    AMQP_HOST: str(),
    CLIENT_ORG: str(),
    EMAIL_USER: email(),
    EMAIL_PASSWORD: str(),
    SMTP_HOST: str(),
    SMTP_PORT: num(),
    REDIS_HOST: str(),
    REDIS_PORT: str(),
    EMAIL_RECIPIENTS: json<string[]>(),
  };
  cleanEnv(process.env, envs);
};
