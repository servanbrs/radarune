import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { apiRequest } from "@/api/client";

type Dashboard = {
  cards: Record<string, number | string>;
};

export default function DashboardScreen() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => apiRequest<Dashboard>("/api/v1/mobile/dashboard") });

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => void query.refetch()} />} style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Ana Sayfa</Text>
      <View style={{ gap: 12, marginTop: 20 }}>
        {Object.entries(query.data?.cards ?? {}).map(([key, value]) => (
          <View key={key} style={{ borderWidth: 1, borderRadius: 18, padding: 16 }}>
            <Text style={{ color: "#667085" }}>{key}</Text>
            <Text style={{ fontSize: 24, fontWeight: "700" }}>{String(value)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
