import {
    useGetLoginInfo,
    useSignTransactions,
} from "@elrondnetwork/dapp-core/hooks";
import { LoginMethodsEnum } from "@elrondnetwork/dapp-core/types";
import { Transition } from "@headlessui/react";
import React, { Fragment, useMemo } from "react";
// listen for the txs to be signed in queue, if the queue is not empty prompt the modal for user
function SignTxsModal() {
    // ! useSignTransactions auto invoke provider for signing hence just use the hook only in once place globlally
    const { hasTransactions } = useSignTransactions();
    const { loginMethod } = useGetLoginInfo();

    // if(!hasTransactions){
    //     return null;
    // }
    const loginMethodName = useMemo(() => {
        switch (loginMethod) {
            case LoginMethodsEnum.extension:
                return "Maiar Wallet Extension";
            case LoginMethodsEnum.walletconnect:
            case LoginMethodsEnum.wallet:
                return "Maiar App";
            default:
                return "Wallet";
        }
    }, [loginMethod]);
    return (
        <>
            <Transition
                show={hasTransactions}
                as={Fragment}
                enter="transition duration-300 ease"
                enterFrom="translate-x-full opacity-0"
                enterTo="translate-x-0 opacity-100"
                leave="transition duration-200 ease"
                leaveFrom="translate-x-0 opacity-100"
                leaveTo="translate-x-full opacity-0"
            >
                <div className="clip-corner-4 clip-corner-br bg-clip-border p-[1px] w-full sm:w-[350px] backdrop-blur-[30px]">
                    <div className="clip-corner-4 clip-corner-br p-4 bg-ash-dark-600/80 backdrop-blur-[30px]">
                        <div className="text-sm sm:text-lg font-bold py-4 px-6">
                            Please confirm your transaction on{" "}
                            <span className="text-ash-blue-500">
                                {loginMethodName}
                            </span>
                        </div>
                    </div>
                </div>
            </Transition>
        </>
    );
}

export default SignTxsModal;
