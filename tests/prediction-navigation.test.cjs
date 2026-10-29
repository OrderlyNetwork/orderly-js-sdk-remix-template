/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { beforeEach, after, test } = require("node:test");
const ts = require("typescript");
const i18n = require("@orderly.network/i18n");
const types = require("@orderly.network/types");
const sourceRoot = path.join(__dirname, "..", "app");

function loadSource(file, mocks = {}) {
  const absolute = path.isAbsolute(file) ? file : path.join(sourceRoot, file);
  const output = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => {
    if (Object.hasOwn(mocks, name)) {
      const value = mocks[name];
      return Object.hasOwn(value, "default")
        ? { ...value, __esModule: true }
        : value;
    }
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.join(sourceRoot, name.slice(2))
        : path.resolve(path.dirname(absolute), name);
      const resolved = [
        target,
        `${target}.ts`,
        `${target}.tsx`,
        path.join(target, "index.ts"),
        path.join(target, "index.tsx"),
      ].find(
        (candidate) =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (resolved) return loadSource(resolved, mocks);
    }
    return require(name);
  }, exports);
  return exports;
}

const originalWindow = global.window;
const navigations = [];
const opened = [];
const constants = loadSource("constant.ts");
const paths = loadSource("navigationPaths.ts");
const mocks = {
  react: { useCallback: (fn) => fn, useEffect: () => {} },
  "@remix-run/react": {
    useNavigate: () => (href, options) =>
      navigations.push({ href, replace: Boolean(options?.replace) }),
  },
  "@orderly.network/portfolio": {
    PortfolioLeftSidebarPath: {
      FeeTier: "/portfolio/feeTier",
      ApiKey: "/portfolio/apiKey",
    },
  },
  "@/perpSymbolStorage": { getPerpSymbol: () => "PERP_ETH_USDC" },
};
const nav = loadSource("hooks/useNav.ts", mocks).useNav;
beforeEach(() => {
  navigations.length = 0;
  opened.length = 0;
  global.window = {
    location: {
      pathname: "/tc/predict",
      search: "?ref=demo",
      hash: "#account",
    },
    open: (...args) => opened.push(args),
  };
});
after(() => {
  if (originalWindow === undefined) delete global.window;
  else global.window = originalWindow;
});

for (const [legacy, canonical] of [
  ["/prediction", "/predict"],
  ["/prediction/BTC%2F5M%25?x=1#orders", "/predict/BTC%2F5M%25?x=1#orders"],
  ["/zh/prediction/BTC%2F5M%25", "/zh/predict/BTC%2F5M%25"],
  ["/predictionish", "/predictionish"],
  ["/portfolio/prediction", "/portfolio/prediction"],
  ["/predict/BTC", "/predict/BTC"],
]) {
  test(`canonicalizes only the legacy page segment: ${legacy}`, () => {
    assert.equal(paths.migratePredictionPath(legacy), canonical);
  });
}

test("SDK round requests migrate and preserve the current locale, query, hash and replacement", () => {
  nav().onRouteChange(types.predictionRoute("BTC/5M%", { replace: true }));
  assert.deepEqual(navigations, [
    { href: "/tc/predict/BTC%2F5M%25?ref=demo#account", replace: true },
  ]);
});

for (const [href, expected] of [
  ["/prediction?market=btc", "/tc/predict?market=btc#account"],
  ["/prediction#round?details", "/tc/predict?ref=demo#round?details"],
  [
    "/en/prediction/BTC%2F5M%25?network=test#orders",
    "/en/predict/BTC%2F5M%25?network=test#orders",
  ],
  ["/portfolio/feeTier?tab=fees#tier", "/tc/portfolio/fee?tab=fees#tier"],
  ["/portfolio/apiKey", "/tc/portfolio/api-key?ref=demo#account"],
  ["/", "/tc/perp/PERP_ETH_USDC?ref=demo#account"],
  ["/perp/PERP_SOL_USDC", "/tc/perp/PERP_SOL_USDC?ref=demo#account"],
]) {
  test(`navigation preserves independent URL suffixes: ${href}`, () => {
    nav().onRouteChange({ href, name: "test" });
    assert.deepEqual(navigations, [{ href: expected, replace: false }]);
  });
}

test("explicit empty query and hash clear inherited suffixes", () => {
  nav().onRouteChange({ href: "/prediction?#", name: "test" });
  const url = new URL(navigations[0].href, "https://example.com");
  assert.equal(url.pathname, "/tc/predict");
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
});

test("external URLs bypass internal mapping", () => {
  nav().onRouteChange({
    href: "https://example.com/prediction?x=1#orders",
    target: "_blank",
    name: "external",
  });
  assert.deepEqual(opened, [
    [
      "https://example.com/prediction?x=1#orders",
      "_blank",
      "noopener,noreferrer",
    ],
  ]);
  assert.equal(navigations.length, 0);
});

test("canonical route and title match the reference host", () => {
  assert.equal(constants.PathEnum.Prediction, "/predict");
  assert.equal(
    constants.PageTitleMap[constants.PathEnum.Prediction],
    "Predict",
  );
});

const server = loadSource("entry.server.tsx").default;
for (const [entry, canonical] of [
  ["/prediction", "/zh/predict"],
  ["/predict", "/zh/predict"],
  ["/prediction/BTC%2F5M%25", "/zh/predict/BTC%2F5M%25"],
  ["/predict/BTC%2F5M%25", "/zh/predict/BTC%2F5M%25"],
  ["/tc/prediction/BTC%2F5M%25", "/tc/predict/BTC%2F5M%25"],
]) {
  test(`server entry canonicalizes the legacy path and locale together: ${entry}`, async () => {
    const request = new Request(`https://example.com${entry}?network=test`, {
      headers: { cookie: `${i18n.i18nCookieKey}=zh` },
    });
    const response = await server(request, 200, new Headers(), {}, {});
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      `https://example.com${canonical}?network=test`,
    );
  });
}

test("legacy client route replaces without losing encoded pathname or hash", () => {
  const page = loadSource("routes/$lang.prediction.($symbol).tsx", {
    "@remix-run/react": {
      useLocation: () => ({
        pathname: "/zh/prediction/BTC%2F5M%25",
        search: "?network=test",
        hash: "#orders?details",
      }),
      Navigate: () => null,
    },
  }).default;
  const result = page();
  assert.equal(
    result.props.to,
    "/zh/predict/BTC%2F5M%25?network=test#orders?details",
  );
  assert.equal(result.props.replace, true);
});

test("canonical page retains the exact contract and existing disabled-feature fallback", () => {
  let enabled = true;
  const effects = [];
  const page = loadSource("routes/$lang.predict.($symbol).tsx", {
    ...mocks,
    react: { useEffect: (fn) => effects.push(fn) },
    "@remix-run/react": { useParams: () => ({ symbol: "BTC/5M%" }) },
    "@orderly.network/prediction": { PredictionPage: () => null },
    "@orderly.network/react-app": { useFeatureEnabled: () => enabled },
    "@/components/baseLayout": { BaseLayout: () => null },
    "@/hooks/useNav": { useNav: nav },
  });
  assert.equal(page.default().props.children.props.symbol, "BTC/5M%");
  effects.splice(0).forEach((fn) => fn());
  assert.equal(navigations.length, 0);
  assert.equal(page.meta()[0].title, "Predict | Orderly");
  enabled = false;
  assert.equal(page.default(), null);
  effects.splice(0).forEach((fn) => fn());
  assert.deepEqual(navigations, [
    { href: "/tc/perp/PERP_ETH_USDC?ref=demo#account", replace: true },
  ]);
});

for (const [href, destination] of [
  ["/announcement", "/announcement"],
  ["/announcement?page=2", "/announcement?page=2"],
  ["/announcement?category=listing", "/announcement?category=listing"],
  [
    "/announcement/release%20notes?is_official=true#details",
    "/announcement/release%20notes?is_official=true#details",
  ],
  [
    "/announcement/123?is_official=false",
    "/announcement/123?is_official=false",
  ],
  ["/announcement#section?details", "/announcement#section?details"],
]) {
  test(`announcement navigation replaces stale filters and suffixes: ${href}`, () => {
    global.window.location.search =
      "?category=campaign&source=platform&page=5&is_official=true";
    nav().onRouteChange({
      href,
      name: "announcement",
      scope: "announcement",
      replace: true,
    });
    assert.deepEqual(navigations, [
      { href: `/tc${destination}`, replace: true },
    ]);
  });
}

test("announcement navigation preserves an explicit destination locale", () => {
  nav().onRouteChange({
    href: "/en/announcement/123?is_official=true",
    name: "announcement",
    scope: "announcement",
  });
  assert.equal(navigations[0].href, "/en/announcement/123?is_official=true");
});

test("announcement external links bypass the host router", () => {
  nav().onRouteChange({
    href: "https://example.com/article?is_official=true#details",
    name: "announcement",
    scope: "announcement",
    target: "_blank",
  });
  assert.equal(navigations.length, 0);
  assert.deepEqual(opened, [
    [
      "https://example.com/article?is_official=true#details",
      "_blank",
      "noopener,noreferrer",
    ],
  ]);
});

test("Remix announcement list and detail forward only the slug", () => {
  const sdk = { AnnouncementCenterPage: () => null };
  const List = loadSource("routes/$lang.announcement._index.tsx", {
    "@orderly.network/ui-notification": sdk,
  }).default;
  assert.equal(List().props.slug, undefined);
  for (const slug of ["123", "release-notes", "中文公告"]) {
    const Detail = loadSource("routes/$lang.announcement.$slug.tsx", {
      "@orderly.network/ui-notification": sdk,
      "@remix-run/react": { useParams: () => ({ slug }) },
    }).default;
    assert.deepEqual(Detail().props, { slug });
  }
});

function loadAnnouncementLayout({ slug, mobile = true } = {}) {
  const Box = () => null;
  return loadSource("hooks/useAnnouncementLayout.tsx", {
    "@remix-run/react": {
      useParams: () => ({ slug }),
      useLocation: () => global.window.location,
      useSearchParams: () => new URLSearchParams(global.window.location.search),
    },
    "@orderly.network/i18n": {
      useTranslation: () => ({
        t: (key) => key,
      }),
    },
    "@orderly.network/react-app": {
      useAppContext: () => ({ onRouteChange: nav().onRouteChange }),
    },
    "@orderly.network/ui": {
      Flex: Box,
      Text: Box,
      ChevronLeftIcon: Box,
      useScreen: () => ({ isMobile: mobile }),
    },
    "../constant": constants,
  }).useAnnouncementLayout();
}

test("mobile announcement back button uses logical start and the CSS RTL variant", () => {
  const { topBar, classNames } = loadAnnouncementLayout({
    slug: "123",
  });
  const button = topBar.props.children[0];
  assert.equal(button.props["aria-label"], undefined);
  assert.equal(button.props.title, undefined);
  assert.ok(button.props.className.includes("oui-start-4"));
  assert.equal(button.props.children.props.className, "rtl:oui-rotate-180");
  assert.equal(button.props.children.props.style, undefined);
  assert.ok(classNames.content.includes("oui-announcement-center"));
});

test("desktop announcements keep the SDK header without the mobile return bar", () => {
  const props = loadAnnouncementLayout({ mobile: false });
  assert.equal(props.topBar, undefined);
  assert.equal(props.classNames.content, undefined);
});

for (const slug of ["release-notes", "123"]) {
  test(`mobile detail ${slug} returns to list, retaining context and removing article source/hash`, () => {
    global.window.location.search =
      "?brokerId=demo&networkId=testnet&category=listing&source=official&page=2&is_official=true&feature=one&feature=two";
    const props = loadAnnouncementLayout({ slug });
    props.topBar.props.children[0].props.onClick();
    assert.deepEqual(navigations, [
      {
        href: "/tc/announcement?brokerId=demo&networkId=testnet&category=listing&source=official&page=2&feature=one&feature=two",
        replace: false,
      },
    ]);
  });
}

test("mobile list returns to the remembered Perps symbol and removes announcement filters", () => {
  global.window.location.search =
    "?brokerId=demo&networkId=testnet&category=listing&source=community&page=2&is_official=false&feature=one&feature=two";
  const props = loadAnnouncementLayout();
  const button = props.topBar.props.children[0];
  assert.equal(button.props["aria-label"], undefined);
  assert.equal(button.props.title, undefined);
  button.props.onClick();
  assert.deepEqual(navigations, [
    {
      href: "/tc/perp/PERP_ETH_USDC?brokerId=demo&networkId=testnet&feature=one&feature=two",
      replace: false,
    },
  ]);
});

test("mobile returns without context clear inherited query and hash", () => {
  global.window.location.search = "?is_official=true";
  loadAnnouncementLayout({
    slug: "123",
  }).topBar.props.children[0].props.onClick();
  assert.equal(navigations[0].href, "/tc/announcement");
  global.window.location.search =
    "?category=listing&source=official&page=2&is_official=true";
  loadAnnouncementLayout().topBar.props.children[0].props.onClick();
  assert.equal(navigations[1].href, "/tc/perp/PERP_ETH_USDC");
});
