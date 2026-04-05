import { View, TextInput, Button } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Verify() {
  const { identifier } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const verifyOtp = async () => {
    try {
      const res = await API.post("/auth/verify-otp", {
        identifier,
        otp,
      });

      const { accessToken, refreshToken } = res.data;

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      router.replace("/(tabs)/home");
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />

      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}