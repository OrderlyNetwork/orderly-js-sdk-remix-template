import { MetaFunction } from "@remix-run/node";
import { Dashboard, ReferralProvider } from "@orderly.network/affiliate";
import { PageTitleMap, PathEnum } from "@/constant";
import { generatePageTitle } from "@/utils";

export const meta: MetaFunction = () => {
  return [
    { title: generatePageTitle(PageTitleMap[PathEnum.RewardsAffiliate]) },
  ];
};

export default function AffiliatePage() {
  return (
    <ReferralProvider
      becomeAnAffiliateUrl="https://orderly.network/"
      learnAffiliateUrl="https://orderly.network/"
      referralLinkUrl={window?.location?.origin}
      overwrite={{
        shortBrokerName: "Orderly",
        brokerName: "Orderly",
      }}
    >
      <Dashboard.DashboardPage
        classNames={{
          root: "oui-flex oui-justify-center",
          home: "oui-py-6 oui-px-4 lg:oui-px-6 lg:oui-py-12 xl:oui-pl-4 xl:oui-pr-6 oui-w-full",
          dashboard: "oui-py-6 oui-px-4 lg:oui-px-6 xl:oui-pl-3 xl:oui-pr-6",
        }}
      />
    </ReferralProvider>
  );
}
