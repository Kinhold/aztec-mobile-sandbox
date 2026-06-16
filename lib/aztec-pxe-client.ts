/**
 * Aztec PXE JSON-RPC Client
 *
 * A lean, asynchronous JSON-RPC connector optimized for resource-constrained Android environments.
 * Delegates state synchronization and proof construction to a remote Aztec Private eXecution Environment (PXE)
 * while maintaining full cryptographic privacy boundaries via client-side transaction hashing.
 */

import axios, { AxiosInstance } from "axios";

/**
 * JSON-RPC 2.0 Request structure
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: unknown[];
  id: string | number;
}

/**
 * JSON-RPC 2.0 Response structure
 */
interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

/**
 * Aztec Account abstraction
 */
export interface AztecAccount {
  address: string;
  publicKey: string;
  nonce: number;
}

/**
 * Aztec Transaction structure
 */
export interface AztecTransaction {
  to: string;
  from: string;
  functionName: string;
  args: unknown[];
  nonce: number;
  gasLimit?: number;
  gasPrice?: string;
}

/**
 * Aztec Proof structure
 */
export interface AztecProof {
  circuitName: string;
  proof: string;
  publicInputs: unknown[];
  verificationKey: string;
}

/**
 * Aztec PXE Client Configuration
 */
export interface AztecPxeClientConfig {
  rpcUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * AztecPxeClient: Secure JSON-RPC connector to remote Aztec PXE
 *
 * This client establishes an asynchronous connection to a remote Aztec Private eXecution Environment,
 * enabling resource-constrained Android devices to offload heavy state-proving operations while
 * maintaining cryptographic privacy through client-side transaction hashing.
 */
export class AztecPxeClient {
  private rpcClient: AxiosInstance;
  private requestId: number = 0;
  private config: Required<AztecPxeClientConfig>;

  constructor(config: AztecPxeClientConfig) {
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      rpcUrl: config.rpcUrl,
    };

    this.rpcClient = axios.create({
      baseURL: this.config.rpcUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Generate next request ID
   */
  private generateRequestId(): number {
    return ++this.requestId;
  }

  /**
   * Execute JSON-RPC call with retry logic
   */
  private async executeRpc<T>(
    method: string,
    params: unknown[] = []
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const request: JsonRpcRequest = {
          jsonrpc: "2.0",
          method,
          params,
          id: this.generateRequestId(),
        };

        const response = await this.rpcClient.post<JsonRpcResponse<T>>(
          "/",
          request
        );

        if (response.data.error) {
          throw new Error(
            `RPC Error: ${response.data.error.message} (code: ${response.data.error.code})`
          );
        }

        return response.data.result as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("RPC call failed after retries");
  }

  /**
   * Utility: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get account details from PXE
   */
  async getAccount(address: string): Promise<AztecAccount> {
    return this.executeRpc<AztecAccount>("pxe_getAccount", [address]);
  }

  /**
   * Get account nonce for transaction ordering
   */
  async getAccountNonce(address: string): Promise<number> {
    return this.executeRpc<number>("pxe_getAccountNonce", [address]);
  }

  /**
   * Submit transaction to PXE for processing
   */
  async submitTransaction(tx: AztecTransaction): Promise<string> {
    return this.executeRpc<string>("pxe_submitTransaction", [tx]);
  }

  /**
   * Get transaction status by hash
   */
  async getTransactionStatus(txHash: string): Promise<string> {
    return this.executeRpc<string>("pxe_getTransactionStatus", [txHash]);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<unknown> {
    return this.executeRpc<unknown>("pxe_getTransactionReceipt", [txHash]);
  }

  /**
   * Compile Noir circuit and generate verification key
   */
  async compileCircuit(circuitPath: string): Promise<{
    verificationKey: string;
    abiPath: string;
  }> {
    return this.executeRpc<{
      verificationKey: string;
      abiPath: string;
    }>("pxe_compileCircuit", [circuitPath]);
  }

  /**
   * Generate proof for Noir circuit witness
   */
  async generateProof(
    circuitName: string,
    witness: Record<string, unknown>
  ): Promise<AztecProof> {
    return this.executeRpc<AztecProof>("pxe_generateProof", [
      circuitName,
      witness,
    ]);
  }

  /**
   * Verify proof against verification key
   */
  async verifyProof(proof: AztecProof): Promise<boolean> {
    return this.executeRpc<boolean>("pxe_verifyProof", [proof]);
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    return this.executeRpc<number>("pxe_getBlockHeight", []);
  }

  /**
   * Get block details by height
   */
  async getBlock(blockHeight: number): Promise<unknown> {
    return this.executeRpc<unknown>("pxe_getBlock", [blockHeight]);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx: AztecTransaction): Promise<string> {
    return this.executeRpc<string>("pxe_estimateGas", [tx]);
  }

  /**
   * Health check: verify PXE connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.executeRpc<{ status: string }>(
        "pxe_healthCheck",
        []
      );
      return result.status === "healthy";
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create an AztecPxeClient instance
 */
export function createAztecPxeClient(
  config: AztecPxeClientConfig
): AztecPxeClient {
  return new AztecPxeClient(config);
}
