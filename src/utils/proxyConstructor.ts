export const constructProxyUrl = (account: any) => {
  const country = account.country?.toLowerCase() || 'us';
  const zip = account.zip || process.env.SMART_PROXY_US_DEFAULT_ZIP;
  const username = process.env.SMART_PROXY_USERNAME;
  const password = process.env.SMART_PROXY_PASSWORD;
  const fallbackUrl = process.env.SMART_PROXY_URL as string;

  if (country === 'us' && zip) {
    return `http://user-${username}-country-us-zip-${zip}:${password}@${country}.smartproxy.com:10001`;
  }
  return `http://user-${username}:${password}@${country}.smartproxy.com:45001` || fallbackUrl;
}