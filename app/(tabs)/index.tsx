import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useRef, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { createAztecPxeClient } from "@/lib/aztec-pxe-client";

/**
 * UX-only proof flow simulation. This screen does not generate or verify a proof.
 */

type ProofState = "IDLE" | "WITNESS_GEN" | "PROVING" | "SUCCESS" | "ERROR";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "success" | "error" | "warning" | "debug";
}

interface NodeInfo {
  status: "connected" | "disconnected" | "checking" | "not_configured";
  latency?: number;
}

export default function HomeScreen() {
  const [proofState, setProofState] = useState<ProofState>("IDLE");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo>({ status: "checking" });
  const flatListRef = useRef<FlatList>(null);

  const addLog = useCallback(
    (message: string, level: LogEntry["level"] = "info") => {
      const newLog: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        message,
        level,
      };

      setLogs((prev) => [...prev, newLog]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    },
    [],
  );

  // This optional probe uses an experimental adapter contract. A successful
  // response is connectivity evidence, not proof-generation compatibility.
  useEffect(() => {
    const initializePxeClient = async () => {
      const rpcUrl = process.env.EXPO_PUBLIC_PXE_RPC_URL;
      if (!rpcUrl) {
        setNodeInfo({ status: "not_configured" });
        addLog(
          "No PXE adapter configured; simulation is available offline",
          "warning",
        );
        return;
      }

      try {
        const client = createAztecPxeClient({
          rpcUrl,
          timeout: 8000,
          retryAttempts: 2,
        });

        addLog("Experimental PXE adapter initialized", "info");

        const startTime = Date.now();
        const isHealthy = await client.healthCheck();
        const latency = Date.now() - startTime;

        if (isHealthy) {
          setNodeInfo({
            status: "connected",
            latency,
          });
          addLog(
            `Adapter health probe answered (${latency}ms); compatibility is unverified`,
            "success",
          );
        } else {
          setNodeInfo({ status: "disconnected" });
          addLog("PXE adapter health probe did not succeed", "warning");
        }
      } catch {
        setNodeInfo({ status: "disconnected" });
        addLog(
          "PXE adapter initialization failed; simulation remains offline",
          "warning",
        );
      }
    };

    initializePxeClient();
  }, [addLog]);

  // Simulates UI state transitions only. Deliberately does not call generateProof.
  const handleGenerateProof = useCallback(async () => {
    if (proofState !== "IDLE") return;

    setProofState("WITNESS_GEN");
    setLogs([]);
    addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "debug");
    addLog(
      "SIMULATION STARTED — NO CRYPTOGRAPHIC PROOF WILL BE CREATED",
      "warning",
    );
    addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "debug");

    // Witness generation phase
    const witnessSteps = [
      {
        delay: 250,
        msg: "[SIMULATED] Load a private input",
        level: "info" as const,
      },
      {
        delay: 250,
        msg: "[SIMULATED] Map inputs to circuit fields",
        level: "info" as const,
      },
      {
        delay: 250,
        msg: "[SIMULATED] Construct a witness",
        level: "success" as const,
      },
    ];

    for (const step of witnessSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }

    // Transition to proving phase
    setProofState("PROVING");
    addLog("", "debug");
    addLog("▶ SIMULATED PHASE 2: PROOF CONSTRUCTION", "info");
    addLog("", "debug");

    // Proving phase
    const provingSteps = [
      {
        delay: 250,
        msg: "[SIMULATED] Send a witness to a proving service",
        level: "info" as const,
      },
      {
        delay: 250,
        msg: "[SIMULATED] Execute circuit constraints",
        level: "debug" as const,
      },
      {
        delay: 250,
        msg: "[SIMULATED] Receive an illustrative proof result",
        level: "success" as const,
      },
    ];

    for (const step of provingSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }

    addLog("", "debug");
    addLog("▶ SIMULATED PHASE 3: VERIFICATION", "info");
    addLog("", "debug");

    // Verification phase
    const verificationSteps = [
      {
        delay: 250,
        msg: "[SIMULATED] Load a verification key",
        level: "info" as const,
      },
      {
        delay: 250,
        msg: "[SIMULATED] Evaluate a verification result",
        level: "success" as const,
      },
      {
        delay: 250,
        msg: "SIMULATION COMPLETE — RESULT IS NOT A PROOF",
        level: "warning" as const,
      },
    ];

    for (const step of verificationSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }
    setProofState("SUCCESS");
  }, [proofState, addLog]);

  // Reset to idle state
  const handleReset = useCallback(() => {
    setProofState("IDLE");
    setLogs([]);
  }, []);

  // Render log entry with color coding
  const renderLogEntry = ({ item }: { item: LogEntry }) => {
    const levelColors = {
      info: "text-blue-400",
      success: "text-green-400",
      error: "text-red-400",
      warning: "text-yellow-400",
      debug: "text-gray-500",
    };

    const levelPrefixes = {
      info: "[INFO]",
      success: "[✓]",
      error: "[✗]",
      warning: "[!]",
      debug: "[-]",
    };

    return (
      <View className="flex-row gap-2 px-3 py-0.5">
        <Text className="text-xs text-gray-600 w-16 font-mono">
          {item.timestamp}
        </Text>
        <Text className={`flex-1 text-xs font-mono ${levelColors[item.level]}`}>
          {item.message && `${levelPrefixes[item.level]} ${item.message}`}
        </Text>
      </View>
    );
  };

  const stateButtonText = {
    IDLE: "Run Proof Flow Simulation",
    WITNESS_GEN: "Simulating Witness Construction...",
    PROVING: "Simulating Remote Proving...",
    SUCCESS: "Simulation Complete (No Proof Generated)",
    ERROR: "Error - Try Again",
  };

  const stateButtonColor = {
    IDLE: "bg-blue-600",
    WITNESS_GEN: "bg-yellow-600",
    PROVING: "bg-purple-600",
    SUCCESS: "bg-green-600",
    ERROR: "bg-red-600",
  };

  return (
    <ScreenContainer className="p-4" containerClassName="bg-black">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-white">
              Kinhold Proof UX Sandbox
            </Text>
            <Text className="text-sm text-gray-400">
              UI simulation for evaluating a future mobile proving flow
            </Text>
            <Text className="text-xs text-yellow-400">
              This prototype does not generate or verify cryptographic proofs.
            </Text>
          </View>

          {/* PXE Node Status */}
          <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-white">
                Experimental PXE Adapter
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${
                    nodeInfo.status === "connected"
                      ? "bg-green-500"
                      : nodeInfo.status === "checking"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                <Text className="text-xs text-gray-400 font-mono">
                  {nodeInfo.status === "connected"
                    ? `Connected (${nodeInfo.latency}ms)`
                    : nodeInfo.status === "checking"
                      ? "Checking..."
                      : nodeInfo.status === "not_configured"
                        ? "Not configured"
                        : "Disconnected"}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-500">
              {nodeInfo.status === "connected"
                ? "Health method responded; Aztec compatibility and proving are not verified"
                : "The proof-flow simulation does not require a PXE endpoint"}
            </Text>
          </View>

          {/* Proof Generation Button */}
          <TouchableOpacity
            onPress={handleGenerateProof}
            disabled={proofState !== "IDLE"}
            className={`py-4 px-6 rounded-lg flex-row items-center justify-center gap-3 ${stateButtonColor[proofState]} ${
              proofState !== "IDLE" ? "opacity-80" : "opacity-100"
            }`}
          >
            {proofState === "WITNESS_GEN" || proofState === "PROVING" ? (
              <ActivityIndicator color="white" size="small" />
            ) : null}
            <Text className="text-base font-semibold text-white text-center">
              {stateButtonText[proofState]}
            </Text>
          </TouchableOpacity>

          {proofState === "SUCCESS" && (
            <TouchableOpacity
              onPress={handleReset}
              className="py-3 px-6 rounded-lg border border-gray-700 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-gray-300">
                Run Simulation Again
              </Text>
            </TouchableOpacity>
          )}

          {/* Circuit sketch status */}
          <View className="bg-gray-900 rounded-lg p-4 border border-gray-800 gap-3">
            <Text className="text-sm font-semibold text-white">
              Circuit Sketch Status
            </Text>
            <Text className="text-xs text-yellow-400">
              Not compiled, measured, or exercised by this app.
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Source intent:</Text>
                <Text className="text-xs text-gray-300 font-mono">
                  Identity commitment
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Noir validation:</Text>
                <Text className="text-xs text-gray-300 font-mono">Not run</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Proof API:</Text>
                <Text className="text-xs text-gray-300 font-mono">
                  Not wired
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Result:</Text>
                <Text className="text-xs text-gray-300 font-mono">
                  Simulation only
                </Text>
              </View>
            </View>
          </View>

          {/* Terminal Log Viewport */}
          <View className="flex-1 min-h-80 bg-black rounded-lg border border-gray-800 overflow-hidden">
            <View className="bg-gray-900 px-3 py-2 border-b border-gray-800 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-gray-300 font-mono">
                PROOF_FLOW_SIMULATION_LOG
              </Text>
              <Text className="text-xs text-gray-600 font-mono">
                [{logs.length}]
              </Text>
            </View>

            {logs.length === 0 ? (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-xs text-gray-600 text-center font-mono">
                  {proofState === "IDLE"
                    ? "Run the simulation to preview UI state transitions"
                    : "Processing..."}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={logs}
                renderItem={renderLogEntry}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

          {/* Footer */}
          <View className="gap-1 pb-4">
            <Text className="text-xs text-gray-600 text-center font-mono">
              Kinhold mobile sandbox | exploratory prototype
            </Text>
            <Text className="text-xs text-gray-700 text-center font-mono">
              No Aztec SDK is installed; no real proof path is wired
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
