import { CustomNetworkType } from "@elrondnetwork/dapp-core/types";
import { fallbackNetworkConfigurations } from "@elrondnetwork/dapp-core/constants";
import { ENVIRONMENT } from "./env";
export const gasPrice = 1000000000;
export const version = 1;
export const gasLimit = 600000000;
export const maxGasLimit = 600000000;
export const gasLimitBuffer = 1.2;
export const gasPerDataByte = 1500;
export const shardId = 1;
export const blockTimeMs = 6000;

let defaultDevnet: CustomNetworkType = fallbackNetworkConfigurations.devnet;
// defaultDevnet.apiAddress = "https://api-elrond-devnet.ashswap.io";
defaultDevnet.apiTimeout = "10000";

export const DAPP_CONFIG: CustomNetworkType =
    ENVIRONMENT.NETWORK === "testnet"
        ? fallbackNetworkConfigurations.testnet
        : defaultDevnet;
export const CHAIN_ID = {
    DEVNET: "D",
    TESTNET: "T",
    MAINNET: "1",
} as const;
