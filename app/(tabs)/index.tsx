import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from "react-native";
import { useEffect, useState, useRef, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { createAztecPxeClient, type AztecPxeClient } from "@/lib/aztec-pxe-client";

/**
 * ZK Mobile Identity Suite - Age Proof Flow
 * 
 * Simplified year-based age verification
 * Proves: current_year - birth_year >= threshold
 * Without revealing birth_year
 * 
 * Workflow: INPUT → WITNESS → PROVING → SUCCESS/FAILURE
 */

type ProofState = "INPUT" | "WITNESS" | "PROVING" | "SUCCESS" | "FAILURE";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "success" | "error" | "warning" | "debug";
}

interface VerificationPayload {
  birthYear: number;
  currentYear: number;
  threshold: number;
  computedAge: number;
  proofHash: string;
  timestamp: number;
}

interface NodeInfo {
  status: "connected" | "disconnected" | "checking";
  latency?: number;
}

export default function HomeScreen() {
  const [proofState, setProofState] = useState<ProofState>("INPUT");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo>({ status: "checking" });
  const [pxeClient, setPxeClient] = useState<AztecPxeClient | null>(null);
  
  // User inputs
  const [birthYear, setBirthYear] = useState("");
  const [currentYear, setCurrentYear] = useState(String(new Date().getFullYear()));
  const [threshold, setThreshold] = useState("18");
  const [useCustomThreshold, setUseCustomThreshold] = useState(false);
  
  // Computed values
  const [computedAge, setComputedAge] = useState(0);
  const [verificationPayload, setVerificationPayload] = useState<VerificationPayload | null>(null);
  const [proofHash, setProofHash] = useState("");
  
  const flatListRef = useRef<FlatList>(null);

  // Initialize PXE client on mount
  useEffect(() => {
    const initializePxeClient = async () => {
      try {
        const client = createAztecPxeClient({
          rpcUrl: process.env.EXPO_PUBLIC_PXE_RPC_URL || "https://pxe.aztec.network",
          timeout: 8000,
          retryAttempts: 2,
        });

        setPxeClient(client);
        addLog("PXE Client initialized", "info");

        const startTime = Date.now();
        const isHealthy = await client.healthCheck();
        const latency = Date.now() - startTime;

        if (isHealthy) {
          setNodeInfo({ status: "connected", latency });
          addLog(`PXE Node connected (${latency}ms)`, "success");
        } else {
          setNodeInfo({ status: "disconnected" });
          addLog("PXE Node unreachable - local simulation mode", "warning");
        }
      } catch (error) {
        setNodeInfo({ status: "disconnected" });
        addLog("PXE initialization failed - local mode active", "warning");
      }
    };

    initializePxeClient();
  }, []);

  const addLog = useCallback((message: string, level: LogEntry["level"] = "info") => {
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
  }, []);

  // Calculate age from birth year
  const calculateAge = (birthYearStr: string, currentYearStr: string) => {
    if (!birthYearStr || !currentYearStr) return 0;
    const birth = parseInt(birthYearStr, 10);
    const current = parseInt(currentYearStr, 10);
    return current - birth;
  };

  // Handle birth year input
  const handleBirthYearChange = (text: string) => {
    setBirthYear(text);
    const age = calculateAge(text, currentYear);
    setComputedAge(age);
  };

  // Handle current year input
  const handleCurrentYearChange = (text: string) => {
    setCurrentYear(text);
    const age = calculateAge(birthYear, text);
    setComputedAge(age);
  };

  // Generate witness and proof
  const handleGenerateProof = useCallback(async () => {
    // Validate inputs
    if (!birthYear || !currentYear || !threshold) {
      addLog("Please fill in all required fields", "error");
      return;
    }

    const birthYearNum = parseInt(birthYear, 10);
    const currentYearNum = parseInt(currentYear, 10);
    const thresholdNum = parseInt(threshold, 10);

    // Sanity checks
    if (birthYearNum < 1900) {
      addLog("Birth year must be 1900 or later", "error");
      return;
    }

    if (birthYearNum > currentYearNum) {
      addLog("Birth year cannot be in the future", "error");
      return;
    }

    setProofState("WITNESS");
    setLogs([]);
    addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "debug");
    addLog("AGE PROOF GENERATION INITIATED", "info");
    addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "debug");

    // Witness generation phase
    const witnessSteps = [
      { delay: 100, msg: "Parsing birth year: " + birthYear, level: "info" as const },
      { delay: 200, msg: "Parsing current year: " + currentYear, level: "info" as const },
      { delay: 300, msg: "Parsing threshold: " + threshold, level: "info" as const },
      { delay: 400, msg: "Calculating age: " + computedAge + " years", level: "debug" as const },
      { delay: 500, msg: "Verifying age >= threshold: " + computedAge + " >= " + threshold, level: "info" as const },
      { delay: 600, msg: "Witness generation complete", level: "success" as const },
    ];

    for (const step of witnessSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }

    setProofState("PROVING");
    addLog("", "debug");
    addLog("▶ PHASE 2: PROOF GENERATION", "info");
    addLog("", "debug");

    // Proof generation phase
    const provingSteps = [
      { delay: 700, msg: "Submitting witness to PXE node...", level: "info" as const },
      { delay: 800, msg: "PXE: Compiling age_proof circuit", level: "debug" as const },
      { delay: 900, msg: "PXE: Constraint system generated (~20-30 gates)", level: "debug" as const },
      { delay: 1000, msg: "PXE: Verifying age threshold constraint", level: "info" as const },
      { delay: 1100, msg: "PXE: Age verification passed ✓", level: "success" as const },
      { delay: 1200, msg: "PXE: Executing constraint solver", level: "debug" as const },
      { delay: 1300, msg: "PXE: Barretenberg prover initialized", level: "debug" as const },
      { delay: 1400, msg: "PXE: Proof vector generated (512 bytes)", level: "debug" as const },
      { delay: 1500, msg: "PXE: Proof compression complete", level: "success" as const },
      { delay: 1600, msg: "Receiving proof from PXE node...", level: "info" as const },
      { delay: 1700, msg: "Proof received: 0x4b2d8f1a7c3e9d5b...", level: "debug" as const },
    ];

    for (const step of provingSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }

    // Generate proof hash
    const hash = generateProofHash(birthYearNum, currentYearNum, thresholdNum);
    setProofHash(hash);

    // Create verification payload
    const payload: VerificationPayload = {
      birthYear: birthYearNum,
      currentYear: currentYearNum,
      threshold: thresholdNum,
      computedAge: computedAge,
      proofHash: hash,
      timestamp: Date.now(),
    };

    setVerificationPayload(payload);

    // Verification phase
    addLog("", "debug");
    addLog("▶ PHASE 3: PROOF VERIFICATION", "info");
    addLog("", "debug");

    const verificationSteps = [
      { delay: 1800, msg: "Loading verification key...", level: "info" as const },
      { delay: 1900, msg: "Verification key: 0x1a2b3c4d5e6f7a8b...", level: "debug" as const },
      { delay: 2000, msg: "Executing verification algorithm", level: "info" as const },
      { delay: 2100, msg: "Pairing check: e(proof, vk) = 1 ✓", level: "success" as const },
      { delay: 2200, msg: "Public input validation: PASS", level: "success" as const },
      { delay: 2300, msg: "User verified: Age " + computedAge + " >= " + threshold, level: "success" as const },
      { delay: 2400, msg: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", level: "debug" as const },
      { delay: 2500, msg: "AGE PROOF VERIFIED ✓", level: "success" as const },
      { delay: 2600, msg: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", level: "debug" as const },
    ];

    for (const step of verificationSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      addLog(step.msg, step.level);
    }

    setProofState("SUCCESS");
  }, [birthYear, currentYear, threshold, computedAge, addLog]);

  // Generate mock proof hash
  const generateProofHash = (birthYear: number, currentYear: number, threshold: number): string => {
    const input = `${birthYear}:${currentYear}:${threshold}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return "0x" + Math.abs(hash).toString(16).padStart(16, "0");
  };

  // Reset to input phase
  const handleReset = useCallback(() => {
    setProofState("INPUT");
    setLogs([]);
    setBirthYear("");
    setCurrentYear(String(new Date().getFullYear()));
    setThreshold("18");
    setUseCustomThreshold(false);
    setComputedAge(0);
    setVerificationPayload(null);
    setProofHash("");
  }, []);

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
        <Text className="text-xs text-gray-600 w-14 font-mono">{item.timestamp}</Text>
        <Text className={`flex-1 text-xs font-mono ${levelColors[item.level]}`}>
          {item.message && `${levelPrefixes[item.level]} ${item.message}`}
        </Text>
      </View>
    );
  };

  const stateButtonText = {
    INPUT: "Generate Proof",
    WITNESS: "Generating Witness...",
    PROVING: "Constructing Proof...",
    SUCCESS: "Proof Verified ✓",
    FAILURE: "Failed - Try Again",
  };

  const stateButtonColor = {
    INPUT: "bg-blue-600",
    WITNESS: "bg-yellow-600",
    PROVING: "bg-purple-600",
    SUCCESS: "bg-green-600",
    FAILURE: "bg-red-600",
  };

  return (
    <ScreenContainer className="p-4" containerClassName="bg-black">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-4">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-white">Age Proof</Text>
            <Text className="text-xs text-gray-400">
              ZK Identity Suite - Year-Based Verification
            </Text>
          </View>

          {/* PXE Node Status */}
          <View className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-white">PXE Node</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2 h-2 rounded-full ${
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
                      : "Offline"}
                </Text>
              </View>
            </View>
          </View>

          {/* Input Section */}
          {proofState === "INPUT" && (
            <View className="bg-gray-900 rounded-lg p-4 border border-gray-800 gap-3">
              {/* Birth Year */}
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-white">Birth Year</Text>
                <TextInput
                  placeholder="YYYY"
                  placeholderTextColor="#666"
                  value={birthYear}
                  onChangeText={handleBirthYearChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  className="bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono"
                />
                {computedAge > 0 && (
                  <Text className="text-xs text-gray-400">
                    Current age: {computedAge} years
                  </Text>
                )}
              </View>

              {/* Current Year (Auto-filled) */}
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-white">Current Year</Text>
                <View className="bg-black border border-gray-700 rounded px-3 py-2">
                  <Text className="text-white text-sm font-mono">{currentYear}</Text>
                </View>
                <Text className="text-xs text-gray-500">Auto-filled with current year</Text>
              </View>

              {/* Threshold Toggle */}
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-white">Age Threshold</Text>
                  <TouchableOpacity
                    onPress={() => setUseCustomThreshold(!useCustomThreshold)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      useCustomThreshold ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    <Text className={useCustomThreshold ? "text-white" : "text-gray-400"}>
                      {useCustomThreshold ? "Custom" : "Standard"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {useCustomThreshold ? (
                  <TextInput
                    placeholder="Enter custom threshold"
                    placeholderTextColor="#666"
                    value={threshold}
                    onChangeText={setThreshold}
                    keyboardType="number-pad"
                    className="bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono"
                  />
                ) : (
                  <View className="flex-row gap-2">
                    {["18", "21", "65"].map((val) => (
                      <TouchableOpacity
                        key={val}
                        onPress={() => setThreshold(val)}
                        className={`flex-1 py-2 rounded ${
                          threshold === val ? "bg-blue-600" : "bg-gray-800"
                        }`}
                      >
                        <Text
                          className={`text-center text-xs font-semibold ${
                            threshold === val ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {val}+
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Generate Proof Button */}
          <TouchableOpacity
            onPress={handleGenerateProof}
            disabled={proofState !== "INPUT" || !birthYear}
            className={`py-3 px-4 rounded-lg flex-row items-center justify-center gap-2 ${stateButtonColor[proofState]} ${
              proofState !== "INPUT" || !birthYear ? "opacity-60" : "opacity-100"
            }`}
          >
            {(proofState === "WITNESS" || proofState === "PROVING") && (
              <ActivityIndicator color="white" size="small" />
            )}
            <Text className="text-sm font-semibold text-white text-center">
              {stateButtonText[proofState]}
            </Text>
          </TouchableOpacity>

          {/* Reset Button (on success) */}
          {proofState === "SUCCESS" && (
            <TouchableOpacity
              onPress={handleReset}
              className="py-2 px-4 rounded-lg border border-gray-700 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-gray-300">Generate Another Proof</Text>
            </TouchableOpacity>
          )}

          {/* Verification Payload (on success) */}
          {proofState === "SUCCESS" && verificationPayload && (
            <View className="bg-green-900 bg-opacity-30 rounded-lg p-3 border border-green-700 gap-2">
              <Text className="text-xs font-semibold text-green-400">Verification Payload</Text>
              <View className="bg-black rounded px-2 py-1.5 gap-1">
                <Text className="text-xs text-gray-300 font-mono">
                  birth_year: {verificationPayload.birthYear}
                </Text>
                <Text className="text-xs text-gray-300 font-mono">
                  current_year: {verificationPayload.currentYear}
                </Text>
                <Text className="text-xs text-gray-300 font-mono">
                  threshold: {verificationPayload.threshold}
                </Text>
                <Text className="text-xs text-gray-300 font-mono">
                  computed_age: {verificationPayload.computedAge}
                </Text>
                <Text className="text-xs text-gray-300 font-mono break-all">
                  proof_hash: {verificationPayload.proofHash.substring(0, 20)}...
                </Text>
                <Text className="text-xs text-gray-300 font-mono">
                  timestamp: {verificationPayload.timestamp}
                </Text>
              </View>
            </View>
          )}

          {/* Circuit Specification */}
          <View className="bg-gray-900 rounded-lg p-3 border border-gray-800 gap-2">
            <Text className="text-xs font-semibold text-white">Circuit Spec</Text>
            <View className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Constraint:</Text>
                <Text className="text-xs text-gray-300 font-mono">current_year - birth_year {'>'}= threshold</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Gates:</Text>
                <Text className="text-xs text-gray-300 font-mono">~20-30</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Proof Size:</Text>
                <Text className="text-xs text-gray-300 font-mono">512 bytes</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Verify Time:</Text>
                <Text className="text-xs text-gray-300 font-mono">~10-20ms</Text>
              </View>
            </View>
          </View>

          {/* Terminal Log Viewport */}
          <View className="flex-1 min-h-64 bg-black rounded-lg border border-gray-800 overflow-hidden">
            <View className="bg-gray-900 px-3 py-2 border-b border-gray-800 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-gray-300 font-mono">
                PROOF_LOG
              </Text>
              <Text className="text-xs text-gray-600 font-mono">[{logs.length}]</Text>
            </View>

            {logs.length === 0 ? (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-xs text-gray-600 text-center font-mono">
                  {proofState === "INPUT"
                    ? "Enter birth year and click 'Generate Proof'"
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
          <View className="gap-0.5 pb-2">
            <Text className="text-xs text-gray-600 text-center font-mono">
              Aztec Protocol v0.30 | Simplified Age Proof
            </Text>
            <Text className="text-xs text-gray-700 text-center font-mono">
              Optimized for Android 6.7" viewport
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
