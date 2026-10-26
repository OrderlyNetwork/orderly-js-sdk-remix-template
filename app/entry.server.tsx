/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */
import { renderToPipeableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable, redirect } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { parse } from "cookie";
import { isbot } from "isbot";
import { PassThrough } from "node:stream";
import {
  i18nCookieKey,
  LocaleEnum,
  parseI18nLang,
  getLocalePathFromPathname,
  removeLangPrefix,
} from "@orderly.network/i18n";
import { PathEnum } from "./constant";
import { DEFAULT_SYMBOL } from "./storage";

// Get the locale from cookie
async function getLocaleFromCookie(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = parse(cookieHeader || "");
  const cookieLang = cookie[i18nCookieKey] || LocaleEnum.en;
  return parseI18nLang(cookieLang);
}

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext,
) {
  /* custom logic start */
  const url = new URL(request.url);
  const pathname = url.pathname;
  const localePath = getLocalePathFromPathname(pathname);

  const pathWithoutLang = removeLangPrefix(pathname);

  if (pathWithoutLang === PathEnum.Perp) {
    const locale = localePath ?? (await getLocaleFromCookie(request));
    url.pathname = `/${locale}${PathEnum.Perp}/${DEFAULT_SYMBOL}`;
    return redirect(url.toString());
  }

  // If the pathname has a locale path, return
  if (!localePath) {
    let newPathname = pathname;

    const cookieLocale = await getLocaleFromCookie(request);
    const localePaths = Object.values(PathEnum);

    if (pathname === "/") {
      newPathname = `/${cookieLocale}${PathEnum.Perp}/${DEFAULT_SYMBOL}`;
    } else if (localePaths.includes(pathname as PathEnum)) {
      newPathname = `/${cookieLocale}${pathname}`;
    } else if (pathname.startsWith(PathEnum.Perp)) {
      newPathname = `/${cookieLocale}${PathEnum.Perp}/${DEFAULT_SYMBOL}`;
    }

    if (newPathname !== pathname) {
      console.log(`redirect: ${pathname} ==> ${newPathname}`);
      url.pathname = newPathname;
      return redirect(url.toString());
    }
  }
  /** custom logic end */

  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
