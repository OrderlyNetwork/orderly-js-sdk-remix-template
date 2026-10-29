import { useParams } from "@remix-run/react";
import { AnnouncementCenterPage } from "@orderly.network/ui-notification";

export default function AnnouncementDetailPage() {
  const { slug } = useParams();
  return <AnnouncementCenterPage slug={slug} />;
}
