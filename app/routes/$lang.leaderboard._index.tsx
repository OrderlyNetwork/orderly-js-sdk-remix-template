import { MetaFunction } from "@remix-run/node";
import { GeneralLeaderboardWidget } from "@orderly.network/trading-leaderboard";
import { PageTitleMap, PathEnum } from "@/constant";
import { generatePageTitle } from "@/utils";

export const meta: MetaFunction = () => {
  return [{ title: generatePageTitle(PageTitleMap[PathEnum.Leaderboard]) }];
};

export default function LeaderboardPage() {
  return (
    <div className="oui-py-6 oui-px-4 lg:oui-px-6 xl:oui-pl-4 lx:oui-pr-6">
      <GeneralLeaderboardWidget />
    </div>
  );
}
