import { Navigate, useLocation } from "@remix-run/react";
import { migratePredictionPath } from "@/navigationPaths";

export default function LegacyPredictionRedirect() {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      to={`${migratePredictionPath(pathname)}${search}${hash}`}
      replace
    />
  );
}
