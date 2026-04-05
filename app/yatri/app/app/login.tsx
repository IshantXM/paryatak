import { View, TextInput, Button, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { API } from "../utils/api";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const router = useRouter();

  const sendOtp = async () => {
    try {
      await API.post("/auth/send-otp", { identifier });

      router.push({
        pathname: "/verify",
        params: { identifier },
      });
    } catch (err) {
      alert("Error sending OTP");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter Phone or Email</Text>

      <TextInput
        placeholder="Enter phone/email"
        value={identifier}
        onChangeText={setIdentifier}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />

      <Button title="Send OTP" onPress={sendOtp} />
    </View>
  );
}