import { useMemo } from "react";
import { Outlet } from "@remix-run/react";
import {
  PortfolioLayoutWidget,
  PortfolioLeftSidebarPath,
} from "@orderly.network/portfolio";
import { PathEnum } from "@/constant";
import { useNav } from "@/hooks/useNav";
import { usePathWithoutLang } from "@/hooks/usePathWithoutLang";
import { useScaffoldConfig } from "@/hooks/useScaffoldConfig";

export default function PortfolioLayout() {
  const config = useScaffoldConfig();
  const path = usePathWithoutLang();

  const { onRouteChange } = useNav();

  const currentPath = useMemo(() => {
    if (path.endsWith(PathEnum.FeeTier))
      return PortfolioLeftSidebarPath.FeeTier;

    if (path.endsWith(PathEnum.ApiKey)) return PortfolioLeftSidebarPath.ApiKey;

    return path;
  }, [path]);

  return (
    <PortfolioLayoutWidget
      footerProps={config.footerProps}
      bottomNavProps={config.bottomNavProps}
      mainNavProps={{
        ...config.mainNavProps,
        initialMenu: PathEnum.Portfolio,
      }}
      routerAdapter={{
        onRouteChange,
      }}
      leftSideProps={{
        current: currentPath,
      }}
    >
      <Outlet />
    </PortfolioLayoutWidget>
  );
}
