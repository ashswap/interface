import IconNewTab from "assets/svg/new-tab.svg";
import HeadlessModal, {
    HeadlessModalDefaultHeader
} from "components/HeadlessModal";
import { network } from "const/network";
import pools from "const/pool";
import { useWallet } from "context/wallet";
import { toEGLD } from "helper/balance";
import { useScreenSize } from "hooks/useScreenSize";
import styles from "./HistoryModal.module.css";

interface Props {
    open: boolean;
    onClose?: () => void;
}

const HistoryModal = ({ open, onClose }: Props) => {
    const { transactionsHistory } = useWallet();
    const screenSize = useScreenSize();

    const openTransaction = (txHash: string) => {
        window.open(
            network.explorerAddress + "/transactions/" + txHash,
            "_blank"
        );
    };

    return (
        <HeadlessModal
            open={open}
            onClose={() => onClose && onClose()}
            transition={screenSize.sm ? "btt" : "center"}
        >
            <div className="clip-corner-4 clip-corner-tl bg-ash-dark-600 p-4 text-white max-h-[36rem] w-full sm:w-[21.875rem] sm:mt-28 mx-auto fixed bottom-0 sm:static">
                <HeadlessModalDefaultHeader
                    onClose={() => onClose && onClose()}
                />
                <div className="px-6 pt-3">
                    <div className="font-bold text-2xl">History</div>
                    {transactionsHistory
                        .slice(0, 7)
                        .map((d: any, i: number) => {
                            if (!d.action || !d.action.arguments) {
                                return null;
                            }

                            const { functionName } = d.action.arguments;
                            if (functionName !== "exchange") {
                                return null;
                            }

                            const status =
                                d.status === "success" ? "succeed" : "failed";

                            let extraInfo = "";
                            const pool = pools.find(
                                pool => pool.address === d.receiver
                            );

                            // invalid pool
                            if (!pool) {
                                return null;
                            }

                            // not transfer token
                            if (d.action.arguments.transfers.length === 0) {
                                return null;
                            }

                            const swapFromToken =
                                d.action.arguments.transfers[0].token;
                            let tokenFrom = pool.tokens.find(
                                t => t.id === swapFromToken
                            );
                            if (!tokenFrom) {
                                return null;
                            }
                            const swapFromValue =
                                d.action.arguments.transfers[0].value;

                            const swapToValue = d.tokenValue;
                            const swapToToken = d.tokenIdentifier;
                            let tokenTo = pool.tokens.find(
                                t => t.id === swapToToken
                            );
                            if (!tokenTo) {
                                return null;
                            }

                            extraInfo +=
                                toEGLD(tokenFrom, swapFromValue).toFixed(3) +
                                " " +
                                tokenFrom.name +
                                " to " +
                                toEGLD(tokenTo, swapToValue).toFixed(3) +
                                " " +
                                tokenTo.name;

                            return (
                                <div
                                    key={i}
                                    style={{ color: "#00FF75" }}
                                    className="flex flex-row justify-between items-center my-3 text-xs sm:text-sm"
                                >
                                    <div
                                        className="flex flex-row select-none cursor-pointer"
                                        onClick={() =>
                                            openTransaction(d.txHash)
                                        }
                                    >
                                        <div
                                            className={`mt-1.5 ${styles.dot} ${styles.greenDot}`}
                                        ></div>
                                        <div className="mx-4 hover:underline">{`Swap ${status} ${extraInfo}`}</div>
                                    </div>
                                    <div
                                        className="select-none cursor-pointer"
                                        onClick={() =>
                                            openTransaction(d.txHash)
                                        }
                                    >
                                        <IconNewTab />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </HeadlessModal>
    );
};

export default HistoryModal;
