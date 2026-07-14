import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (params.error) {
        setStatus("error");
        setErrorMessage("The OAuth provider rejected the request.");
        return;
      }

      if (!params.code || !params.state) {
        setStatus("error");
        setErrorMessage("The OAuth callback is missing required parameters.");
        return;
      }

      try {
        const result = await Api.exchangeOAuthCode(params.code, params.state);
        if (!result.sessionToken) {
          throw new Error("No session token received");
        }

        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }

        setStatus("success");
        router.replace("/(tabs)");
      } catch (error) {
        console.error("[OAuth] Callback failed", error);
        setStatus("error");
        setErrorMessage("Failed to complete authentication.");
      }
    };

    void handleCallback();
  }, [params.code, params.error, params.state, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="text-base text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <Text className="text-base text-center text-foreground">
            Authentication successful.
          </Text>
        )}
        {status === "error" && (
          <>
            <Text className="text-xl font-bold text-error">
              Authentication failed
            </Text>
            <Text className="text-base text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
