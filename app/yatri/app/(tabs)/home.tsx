import { View, Text, Button } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Welcome to Protected Home 🚀</Text>

      <Button title="Logout" onPress={logout} />
    </View>
  );
}