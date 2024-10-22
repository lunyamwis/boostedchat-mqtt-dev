export const proxyConstructor = (country: string, city: string) => {
  return `http://${Bun.env.PROXY_PASSWORD}:wifi;${country};starlink;${city};${city}@proxy.soax.com:9000`
  // "http://Sql8t2uRG3XRvQrO:wifi;ke;starlink;nairobi;nairobi@proxy.soax.com:9000"
};
