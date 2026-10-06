import type { BrowserContext } from "@playwright/test";

const AD_HOSTS = [
  "googlesyndication.com",
  "doubleclick.net",
  "googleadservices.com",
  "googletagservices.com",
  "adservice.google.com",
  "fundingchoicesmessages.google.com",
  "2mdn.net",
  "amazon-adsystem.com",
  "adnxs.com",
  "criteo.com",
  "criteo.net",
  "pubmatic.com",
  "rubiconproject.com",
  "openx.net",
  "casalemedia.com",
  "adsrvr.org",
  "moatads.com",
  "taboola.com",
  "outbrain.com",
];

export async function blockAds(context: BrowserContext): Promise<void> {
  await context.route(
    (url) => AD_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)),
    (route) => route.abort(),
  );
}
