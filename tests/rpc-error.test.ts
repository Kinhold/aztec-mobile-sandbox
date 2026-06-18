import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { createAztecPxeClient, AztecPxeClient, AztecRpcError } from "../lib/aztec-pxe-client";

vi.mock("axios");

describe("AztecPxeClient Error Handling", () => {
  let client: AztecPxeClient;
  const mockAxios = axios as any;
  let mockPost: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPost = vi.fn();
    mockAxios.create.mockReturnValue({
      post: mockPost,
    });
    
    client = createAztecPxeClient({
      rpcUrl: "http://localhost:8080",
      retryAttempts: 1,
    });
  });

  it("should throw AztecRpcError for JSON-RPC error responses", async () => {
    const rpcError = {
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32600,
        message: "Invalid Request",
        data: "Some extra info",
      },
    };

    mockPost.mockResolvedValue({ data: rpcError });

    try {
      await client.getBlockHeight();
      expect.fail("Should have thrown AztecRpcError");
    } catch (error) {
      expect(error).toBeInstanceOf(AztecRpcError);
      expect((error as AztecRpcError).code).toBe(-32600);
      expect((error as AztecRpcError).message).toBe("Invalid Request");
      expect((error as AztecRpcError).data).toBe("Some extra info");
    }
  });

  it("should throw error for malformed JSON-RPC responses (missing result and error)", async () => {
    const malformedResponse = {
      jsonrpc: "2.0",
      id: 1,
    };

    mockPost.mockResolvedValue({ data: malformedResponse });

    await expect(client.getBlockHeight()).rejects.toThrow(
      "Invalid JSON-RPC response: missing result"
    );
  });

  it("should wrap network errors with status code", async () => {
    const axiosError = new Error("Internal Server Error");
    (axiosError as any).isAxiosError = true;
    (axiosError as any).response = { status: 500 };
    
    mockPost.mockRejectedValue(axiosError);
    mockAxios.isAxiosError.mockReturnValue(true);

    await expect(client.getBlockHeight()).rejects.toThrow(
      "Network Error: Internal Server Error (Status: 500)"
    );
  });
});
