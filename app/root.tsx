import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import { getLocalePathFromPathname } from "@orderly.network/i18n";
import OrderlyProvider from "@/components/orderlyProvider";
import { getDocumentDirection, getDocumentLanguage } from "@/utils/locale";
import "./styles/index.css";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const locale = getLocalePathFromPathname(pathname) ?? "en";

  return (
    <html lang={getDocumentLanguage(locale)} dir={getDocumentDirection(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/images/favicon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        <OrderlyProvider>{children}</OrderlyProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
