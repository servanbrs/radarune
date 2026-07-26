import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { apiRequest } from "@/api/client";

type ReleaseListItem = { id: string; title: string; status: string };

export default function ReleasesScreen() {
  const query = useQuery({ queryKey: ["releases"], queryFn: () => apiRequest<ReleaseListItem[]>("/api/v1/mobile/releases") });

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Yayınlar</Text>
      {(query.data ?? []).map((release) => (
        <View key={release.id} style={{ borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>{release.title}</Text>
          <Text>{release.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
