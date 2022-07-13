import moment from "moment";
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useGetNetworkConfig,
    useGetSignedTransactions,
    useGetTransactionDisplayInfo,
} from "@elrondnetwork/dapp-core/hooks";
import {
    AccountInfoSliceNetworkType,
    SignedTransactionType,
    TransactionBatchStatusesEnum,
    TransactionServerStatusesEnum,
} from "@elrondnetwork/dapp-core/types";
import {
    getIsTransactionPending,
    getIsTransactionSuccessful,
    getIsTransactionTimedOut,
    isServerTransactionPending,
} from "@elrondnetwork/dapp-core/utils";
import { Transition } from "@headlessui/react";
import ICCheck from "assets/svg/check.svg";
import ICChevronLeft from "assets/svg/chevron-left.svg";
import ICChevronRight from "assets/svg/chevron-right.svg";
import IClose from "assets/svg/close.svg";
import ICCopy from "assets/svg/copy.svg";
import ICHourGlass from "assets/svg/hourglass.svg";
import ICNewTabRound from "assets/svg/new-tab-round.svg";
import CopyBtn from "components/CopyBtn";
const averageTxDurationMs = 6000;
const crossShardRounds = 5;
interface TransactionToastPropsType {
    title?: string;
    toastId: string;
    className?: string;
    errorMessage?: string;
    withTxNonce?: boolean;
    successMessage?: string;
    endTimeProgress?: number;
    processingMessage?: string;
    startTimeProgress?: number;
    shouldRenderDefaultCss?: boolean;
    transactions: SignedTransactionType[];
    status: TransactionBatchStatusesEnum;
    lifetimeAfterSuccess?: number;
    collapsed?: boolean;
    onClose?: (toastId: string) => void;
    onCollapsedChange?: (val: boolean) => void;
}

const StatusIconMap: Record<
    TransactionServerStatusesEnum | "timedOut",
    JSX.Element
> = {
    pending: (
        <div className="w-4 h-4 rounded-full border-2 border-ash-purple-500 border-t-transparent animate-spin"></div>
    ),
    success: <ICCheck className="w-4 h-4 text-stake-green-500" />,
    fail: <IClose className="w-4 h-4 text-ash-purple-500" />,
    invalid: <IClose className="w-4 h-4 text-ash-purple-500" />,
    executed: <></>,
    timedOut: <IClose className="w-4 h-4 text-ash-purple-500" />,
};
const TxRecord = ({
    tx,
    collapse = false,
}: {
    tx: SignedTransactionType;
    collapse?: boolean;
}) => {
    const { hash, status } = tx;
    const network: AccountInfoSliceNetworkType = useGetNetworkConfig().network;
    const iconEl = useMemo(() => {
        return StatusIconMap[status];
    }, [status]);
    return (
        <>
            <div className="flex items-center text-stake-gray-500">
                <div>{iconEl}</div>
                {!collapse && (
                    <>
                        <div className="ml-2 mr-4 leading-tight text-xs sm:text-sm w-28 sm:w-32">
                            {hash.slice(0, 6)} ... {hash.slice(-6)}
                        </div>
                        <CopyBtn text={hash}>
                            <ICCopy className="w-5 h-5" />
                        </CopyBtn>
                        {!isServerTransactionPending(status) && (
                            <a
                                href={`${network.explorerAddress}/transactions/${hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2"
                            >
                                <ICNewTabRound className="w-5 h-5 text-stake-gray-500" />
                            </a>
                        )}
                    </>
                )}
            </div>
        </>
    );
};
export const TxToast = ({
    toastId,
    shouldRenderDefaultCss = true,
    className = "transaction-toast",
    withTxNonce = false,
    transactions,
    status,
    onClose,
    startTimeProgress,
    endTimeProgress,
    lifetimeAfterSuccess,
    collapsed,
    onCollapsedChange,
}: TransactionToastPropsType) => {
    const ref = useRef(null);
    const [shouldRender, setShouldRender] = useState(true);
    const transactionDisplayInfo = useGetTransactionDisplayInfo(toastId);
    const network: AccountInfoSliceNetworkType = useGetNetworkConfig().network;
    const { signedTransactions } = useGetSignedTransactions();

    // const accountShard = useGetAccountShard();

    const {
        errorMessage = "Transaction failed",
        timedOutMessage = "Transaction timed out",
        successMessage = "Transaction successful",
        processingMessage = "Processing transaction",
        transactionDuration = 10000,
    } = transactionDisplayInfo;

    // const isSameShard = useMemo(
    //     () =>
    //         transactions!.reduce(
    //             (
    //                 prevTxIsSameShard: boolean,
    //                 { receiver, data }: SignedTransactionType
    //             ) => {
    //                 const receiverAddress = getAddressFromDataField({
    //                     receiver,
    //                     data,
    //                 });
    //                 if (receiverAddress == null) {
    //                     return prevTxIsSameShard;
    //                 }
    //                 return (
    //                     prevTxIsSameShard &&
    //                     isCrossShardTransaction({
    //                         receiverAddress,
    //                         senderShard: accountShard,
    //                     })
    //                 );
    //             },
    //             true
    //         ),
    //     [transactions, accountShard]
    // );

    // const shardAdjustedDuration = isSameShard
    //     ? averageTxDurationMs
    //     : crossShardRounds * averageTxDurationMs;

    // const transactionDuration =
    //     transactionDisplayInfo?.transactionDuration|| shardAdjustedDuration;

    const [startTime, endTime] = useMemo(() => {
        const startTime = startTimeProgress || moment().unix();
        const endTime =
            endTimeProgress ||
            moment().add(Number(transactionDuration), "milliseconds").unix();
        return [startTime, endTime];
    }, []);

    const progress = { startTime, endTime };

    const isPending = useMemo(() => getIsTransactionPending(status), [status]);
    const isTimedOut = useMemo(
        () => getIsTransactionTimedOut(status),
        [status]
    );
    const isSuccess = useMemo(
        () => getIsTransactionSuccessful(status),
        [status]
    );
    const done = useMemo(
        () => !isPending || isTimedOut,
        [isPending, isTimedOut]
    );

    const handleDeleteToast = useCallback(() => {
        setShouldRender(false);
        onClose?.(toastId);
    }, [onClose, toastId]);
    const expireTS = useMemo(() => {
        if (done) return moment().add(lifetimeAfterSuccess, "s").unix();
        return false;
    }, [done, lifetimeAfterSuccess]);

    useEffect(() => {
        let timeout: any;
        if (expireTS && typeof expireTS === "number") {
            const timeLeft = (expireTS - moment().unix()) * 1000;
            timeout = setTimeout(() => {
                handleDeleteToast();
            }, Math.max(timeLeft, 0));
        }
        return () => timeout && clearTimeout(timeout);
    }, [handleDeleteToast, lifetimeAfterSuccess, expireTS]);

    const title = useMemo(() => {
        const map = {
            signed: processingMessage,
            sent: processingMessage,
            pending: processingMessage,
            success: successMessage,
            completed: successMessage,
            cancelled: errorMessage,
            fail: errorMessage,
            timedOut: timedOutMessage,
        };
        return map[status!];
    }, [
        processingMessage,
        successMessage,
        errorMessage,
        timedOutMessage,
        status,
    ]);
    const processed = useMemo(() => {
        return (
            transactions.filter((tx) => !isServerTransactionPending(tx.status))
                .length +
            " / " +
            transactions.length
        );
    }, [transactions]);

    return (
        // <div>
        //     <ToastProgress
        //         key={toastId}
        //         id={toastId}
        //         progress={progress}
        //         done={done}
        //         expiresIn={lifetimeAfterSuccess}
        //     >
        //         <div>{transactions[0].hash}</div>
        //     </ToastProgress>
        // </div>
        <Transition
            show={shouldRender && transactions != null}
            as={Fragment}
            enter="transition duration-300 ease"
            enterFrom="translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transition duration-200 ease"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-full opacity-0"
        >
            <div
                className={`clip-corner-4 clip-corner-br bg-clip-border p-[1px] backdrop-blur-[30px] transition-all overflow-hidden ${
                    collapsed ? "w-auto" : "w-[calc(100vw-3rem)] sm:w-[480px]"
                }`}
            >
                <div className="clip-corner-4 clip-corner-br p-4 bg-ash-dark-600/80 backdrop-blur-[30px]">
                    <div className="flex justify-between">
                        {!collapsed && (
                            <div className="flex items-center space-x-4 sm:space-x-10 sm:mr-5 sm:py-4 overflow-hidden">
                                <div className="px-4 sm:px-5">
                                    <ICHourGlass className="w-8 sm:w-16 h-auto text-stake-gray-500" />
                                </div>
                                <div>
                                    <div className="text-white text-sm sm:text-lg font-bold mb-2 sm:mb-4">
                                        {title}
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-stake-gray-500 mb-6 sm:mb-8">
                                        {processed} transactions processed
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        {transactions.map((tx) => {
                                            return (
                                                <TxRecord
                                                    key={tx.hash}
                                                    tx={tx}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <button
                                className="w-10 h-10 bg-ash-dark-600 hover:bg-ash-dark-400 flex items-center justify-center text-white mb-5"
                                onClick={() => onCollapsedChange?.(!collapsed)}
                            >
                                {collapsed ? (
                                    <ICChevronLeft className="w-2.5 h-2.5" />
                                ) : (
                                    <ICChevronRight className="w-2.5 h-2.5" />
                                )}
                            </button>
                            {/* {done && (
                                <button
                                    className="w-10 h-10 bg-ash-dark-600 hover:bg-ash-dark-400 flex items-center justify-center text-white mb-5"
                                    onClick={() => setShouldRender(false)}
                                >
                                    <IClose className="w-2.5 h-2.5" />
                                </button>
                            )} */}
                            {collapsed && (
                                <>
                                    <div className="text-sm font-bold text-stake-gray-500 mb-4">
                                        {processed}
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        {transactions.map((tx) => {
                                            return (
                                                <TxRecord
                                                    key={tx.hash}
                                                    tx={tx}
                                                    collapse
                                                />
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    );
};

export default TxToast;
