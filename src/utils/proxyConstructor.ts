export const proxyConstructor = (country: string, city: string) => {
  // return `http://${Bun.env.PROXY_PASSWORD}:wifi;us;starlink;florida;miami+beach@proxy.soax.com:9000`
  // "http://${Bun.env.PROXY_PASSWORD}:wifi;ke;starlink;nairobi;nairobi@proxy.soax.com:9000"
  // return `http://${Bun.env.PROXY_PASSWORD}:wifi;us;starlink;florida;miami+beach@proxy.soax.com:9005`
  return `socks5://${process.env.PROXY_PASSWORD}:wifi;us;starlink;florida;miami+beach@proxy.soax.com:9004`
};
