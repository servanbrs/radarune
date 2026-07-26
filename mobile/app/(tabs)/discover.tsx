import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { apiRequest } from "@/api/client";

type Candidate = { id: string; title: string; primaryGenre: string };

export default function DiscoverScreen() {
  const query = useQuery({ queryKey: ["discover"], queryFn: () => apiRequest<Candidate[]>("/api/v1/mobile/discover") });

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Keşfet</Text>
      {(query.data ?? []).map((item) => (
        <View key={item.id} style={{ borderWidth: 1, borderRadius: 24, padding: 20, marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>{item.title}</Text>
          <Text>{item.primaryGenre}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
