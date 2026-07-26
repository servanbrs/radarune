import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text } from "react-native";
import { apiRequest } from "@/api/client";

type AnalyticsOverview = { summary: { streams: number; downloads: number; playlistAppearances: number } };

export default function AnalyticsScreen() {
  const query = useQuery({ queryKey: ["analytics"], queryFn: () => apiRequest<AnalyticsOverview>("/api/v1/mobile/analytics/overview") });
  const summary = query.data?.summary;

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Analitik</Text>
      <Text>Stream: {summary?.streams ?? 0}</Text>
      <Text>Download: {summary?.downloads ?? 0}</Text>
      <Text>Playlist: {summary?.playlistAppearances ?? 0}</Text>
    </ScrollView>
  );
}
