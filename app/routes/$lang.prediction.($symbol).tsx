import { useEffect } from "react";
import { MetaFunction } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { PredictionPage } from "@orderly.network/prediction";
import { useFeatureEnabled } from "@orderly.network/react-app";
import { perpRoute } from "@orderly.network/types";
import { BaseLayout } from "@/components/baseLayout";
import { PageTitleMap, PathEnum } from "@/constant";
import { useNav } from "@/hooks/useNav";
import { getPerpSymbol } from "@/perpSymbolStorage";
import { generatePageTitle } from "@/utils";

export const meta: MetaFunction = () => {
  return [{ title: generatePageTitle(PageTitleMap[PathEnum.Prediction]) }];
};

export default function PredictionRoute() {
  const { symbol } = useParams();
  const enabled = useFeatureEnabled("prediction");
  const { onRouteChange } = useNav();

  useEffect(() => {
    if (!enabled) onRouteChange(perpRoute(getPerpSymbol(), { replace: true }));
  }, [enabled, onRouteChange]);

  return enabled ? (
    <BaseLayout>
      <PredictionPage symbol={symbol} />
    </BaseLayout>
  ) : null;
}
