import { Text, View } from "react-native";
import { useSessionStore } from "@/state/session";

export default function ProfileScreen() {
  const user = useSessionStore((state) => state.user);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Profil</Text>
      <Text>{user?.name ?? "Oturum yüklenmedi"}</Text>
    </View>
  );
}
