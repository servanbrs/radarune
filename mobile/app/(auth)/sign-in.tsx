import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSessionStore } from "@/state/session";

export default function SignInScreen() {
  const signIn = useSessionStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>Radarune</Text>
      <Text>E-posta</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={{ borderWidth: 1, padding: 12 }} value={email} />
      <Text>Parola</Text>
      <TextInput onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 12 }} value={password} />
      {error ? <Text style={{ color: "#b42318" }}>{error}</Text> : null}
      <Pressable
        onPress={() => signIn({ email, password }).catch((caught) => setError(caught instanceof Error ? caught.message : "Giriş başarısız oldu."))}
        style={{ backgroundColor: "#101820", padding: 14, borderRadius: 16 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>Giriş yap</Text>
      </Pressable>
    </View>
  );
}
