import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    if (token) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/login");
    }
  };

  return null;
}