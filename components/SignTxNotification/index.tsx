import { useGetNotification } from "@elrondnetwork/dapp-core/hooks";
import { NotificationTypesEnum } from "@elrondnetwork/dapp-core/types";
import { Transition } from "@headlessui/react";
import ICClose from "assets/svg/close.svg";
import React, { Fragment, useEffect, useMemo } from "react";
import { useDebounce } from "use-debounce";

function SignTxNotification() {
    const { notification: rawNoti, clearNotification } = useGetNotification();
    const show = useMemo(
        () => !!rawNoti && rawNoti.type !== NotificationTypesEnum.success,
        [rawNoti]
    );
    const [notification] = useDebounce(rawNoti, show ? 0 : 300);
    useEffect(() => {
        clearNotification();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <Transition
            show={show}
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
                    <div className="flex">
                        <div className="py-4 pl-6 pr-4">
                            <div
                                className={`font-bold mb-2 ${
                                    notification?.type ===
                                    NotificationTypesEnum.warning
                                        ? "text-yellow-500"
                                        : "text-pink-600"
                                }`}
                            >
                                {notification?.title}
                            </div>
                            <div className="text-xs">
                                {notification?.description}
                            </div>
                        </div>
                        <div>
                            <button
                                className="w-10 h-10 flex items-center justify-center text-white bg-ash-dark-600 hover:bg-ash-dark-400"
                                onClick={() => clearNotification()}
                            >
                                <ICClose />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    );
}

export default SignTxNotification;
