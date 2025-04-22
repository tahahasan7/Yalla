import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Add proper authentication check here
  const isAuthenticated = true; // Replace with actual auth check

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)/goals" />;
}
