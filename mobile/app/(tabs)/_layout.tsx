import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="discover" options={{ title: "Keşfet" }} />
      <Tabs.Screen name="releases" options={{ title: "Yayınlar" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analitik" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
