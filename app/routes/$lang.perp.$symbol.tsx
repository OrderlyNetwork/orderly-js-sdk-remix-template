import { useEffect } from "react";
import { MetaFunction } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/hooks/useOrderlyConfig";
import { setPerpSymbol } from "@/perpSymbolStorage";
import { formatSymbol, generatePageTitle } from "@/utils";

export const meta: MetaFunction = ({ params }) => {
  return [{ title: generatePageTitle(formatSymbol(params.symbol!)) }];
};

export default function PerpPage() {
  const config = useOrderlyConfig();
  const { symbol } = useParams();

  useEffect(() => {
    if (symbol) setPerpSymbol(symbol);
  }, [symbol]);

  if (!symbol) return null;

  return (
    <TradingPage
      symbol={symbol}
      tradingViewConfig={config.tradingPage.tradingViewConfig}
      sharePnLConfig={config.tradingPage.sharePnLConfig}
    />
  );
}
