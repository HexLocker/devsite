import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { cache } from "react";
import { Archivo, DM_Sans } from "next/font/google";
import { DeviceProvider } from "@/lib/device/DeviceContext";
import { DEVICE_COOKIE, type DeviceType } from "@/lib/device/detectDevice";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import "@/app/globals.css";

export const revalidate = 5;

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const getSettings = cache(async () => {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["site_name", "seo_title", "seo_description", "og_image", "favicon", "ga_id", "tagline", "primary_color"] } },
    });
    return Object.fromEntries(rows.map((r) => [r.key, String(r.value ?? "").replace(/^"|"$/g, "")]));
  } catch {
    return {} as Record<string, string>;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const siteName = s.site_name || "DevSite";
  const description = s.seo_description || s.tagline || "Portfolio, blog e negozio online.";
  return {
    title: {
      template: `%s | ${siteName}`,
      default: s.seo_title || siteName,
    },
    description,
    openGraph: {
      locale: "it_IT",
      type: "website",
      ...(s.og_image ? { images: [{ url: s.og_image }] } : {}),
    },
    ...(s.favicon ? { icons: { icon: s.favicon } } : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const s = await getSettings();
  const gaId = s.ga_id || "";
  const primaryColor = s.primary_color || "";

  const cookieStore = await cookies();
  const rawDevice = cookieStore.get(DEVICE_COOKIE)?.value;
  const initialDevice: DeviceType =
    rawDevice === "phone" || rawDevice === "pc" ? rawDevice : "pc";

  return (
    <html lang={locale} className={`${archivo.variable} ${dmSans.variable}`}>
      <head>
        {primaryColor && (
          <style>{`:root { --color-accent: ${primaryColor}; --color-accent-hover: ${primaryColor}; }`}</style>
        )}
      </head>
      <body>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        <NextIntlClientProvider messages={messages} locale={locale}>
          <DeviceProvider initialDevice={initialDevice}>{children}</DeviceProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
