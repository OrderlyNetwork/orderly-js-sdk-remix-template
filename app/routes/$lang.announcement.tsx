import type { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { BaseLayout } from "@/components/baseLayout";
import { PageTitleMap, PathEnum } from "@/constant";
import { useAnnouncementLayout } from "@/hooks/useAnnouncementLayout";
import { generatePageTitle } from "@/utils";

export const meta: MetaFunction = () => [
  { title: generatePageTitle(PageTitleMap[PathEnum.Announcement]) },
];

export default function AnnouncementLayout() {
  const layoutProps = useAnnouncementLayout();
  return (
    <BaseLayout initialMenu={PathEnum.Announcement} {...layoutProps}>
      <Outlet />
    </BaseLayout>
  );
}
