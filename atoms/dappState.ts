import BigNumber from "bignumber.js";
import { atom } from "recoil";

export const accIsLoggedInState = atom<boolean>({
    key: "dapp_acc_is_logged_in",
    default: false,
});

export const accAddressState = atom<string>({
    key: "dapp_acc_address",
    default: "",
});

export const accBalanceState = atom<BigNumber>({
    key: "dapp_acc_egld_balance",
    default: new BigNumber(0)
})

export const accIsInsufficientEGLDState = atom<boolean>({
    key: "dapp_acc_is_insufficient_egld",
    default: false,
});
