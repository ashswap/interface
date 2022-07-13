import { atom } from "recoil";
export const addLPSessionIdAtom = atom<string>({
    key: "addLPSessionId",
    default: "",
});
