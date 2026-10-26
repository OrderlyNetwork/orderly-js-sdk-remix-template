import { MetaFunction } from "@remix-run/node";
import { OrdersModule } from "@orderly.network/portfolio";
import { Box } from "@orderly.network/ui";
import { PageTitleMap, PathEnum } from "@/constant";
import { useOrderlyConfig } from "@/hooks/useOrderlyConfig";
import { generatePageTitle } from "@/utils";

export const meta: MetaFunction = () => {
  return [{ title: generatePageTitle(PageTitleMap[PathEnum.Orders]) }];
};

export default function OrdersPage() {
  const config = useOrderlyConfig();

  return (
    <Box
      p={6}
      pb={0}
      intensity={900}
      r="xl"
      width="100%"
      style={{
        minHeight: 379,
        maxHeight: 2560,
        overflow: "hidden",
        // Make the table scroll instead of the page scroll
        height: "calc(100vh - 48px - 29px - 48px)",
      }}
    >
      <OrdersModule.OrdersPage
        sharePnLConfig={config.tradingPage.sharePnLConfig}
      />
    </Box>
  );
}
