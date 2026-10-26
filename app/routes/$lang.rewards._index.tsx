import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { PathEnum } from "@/constant";

export const loader = ({ params, request }: LoaderFunctionArgs) => {
  const { search } = new URL(request.url);
  return redirect(`/${params.lang}${PathEnum.RewardsAffiliate}${search}`);
};
