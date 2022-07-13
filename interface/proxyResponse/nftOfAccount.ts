import { IMetaESDT } from "interface/tokens";
import { NFTType } from "interface/tokens/type";

export type NFTOfAccountResponse = {
    identifier: string;
    collection: string;
    timestamp?: number;
    attributes: string;
    nonce: number;
    type: NFTType;
    name: string;
    creator: string;
    royalties?: number;
    uris?: string[];
    url?: string;
    media?: {
        url: string;
        originalUrl: string;
        thumbnailUrl: string;
        fileType: string;
        fileSize: number;
    }[];
    isWhitelistedStorage: boolean;
    thumbnailUrl?: string;
    tags?: string[];
    metadata?: {
        description: string;
        fileType: string;
        fileUri: string;
        fileName: string;
    };
    owner?: string;
    balance?: string;
    supply?: string;
    decimals?: number;
    assets?: {
        website: string;
        description: string;
        status: string;
        pngUrl: string;
        svgUrl: string;
        lockedAccounts: string[];
        extraTokens: string[];
    };
    ticker: string;
    scamInfo?: {
        type: string;
        info: string;
    };
    score?: number;
    rank?: number;
    isNsfw?: boolean;
    price?: number;
    valueUsd?: number;
}

export type MetaESDTResponse = Required<Pick<NFTOfAccountResponse, keyof IMetaESDT>>;
export function isMetaESDTResponse(res: NFTOfAccountResponse): res is MetaESDTResponse {
    return res.type === "MetaESDT";
}
