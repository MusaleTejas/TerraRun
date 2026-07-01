import { Redirect } from "expo-router";

import { useSessionStore } from "@/store";

export default function IndexRoute() {
  const status = useSessionStore((state) => state.status);

  return <Redirect href={status === "signedIn" ? "/map" : "/login"} />;
}
