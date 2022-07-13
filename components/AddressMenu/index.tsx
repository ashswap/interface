import { logout } from "@elrondnetwork/dapp-core/utils";
import ImgAvatar from "assets/images/avatar.png";
import IconChange from "assets/svg/change.svg";
import ICChevronUp from "assets/svg/chevron-up.svg";
import IconCopy from "assets/svg/copy.svg";
import IconDisconnect from "assets/svg/disconnect.svg";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import { walletIsOpenConnectModalState } from "atoms/walletState";
import Avatar from "components/Avatar";
import BaseModal from "components/BaseModal";
import BasePopover from "components/BasePopover";
import { useConnectWallet } from "hooks/useConnectWallet";
import useMounted from "hooks/useMounted";
import { useScreenSize } from "hooks/useScreenSize";
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from "react";
import { Modifier } from "react-popper";
import { useRecoilValue, useSetRecoilState } from "recoil";
import WalletBalance from "./WalletBalance";
const overlayModifier: Partial<Modifier<unknown, object>> = {
    name: "overlay",
    enabled: true,
    options: {},
    phase: "beforeRead",
    fn: ({ state }) => {
        return {
            ...state,
            rects: {
                ...state.rects,
                reference: {
                    ...state.rects.reference,
                    height: 0,
                },
            },
        };
    },
};
type AddressMenuProp = {
    infoLayout?: boolean;
    dropdownBtn: (
        address: string,
        setMShowMenu: Dispatch<SetStateAction<boolean>>
    ) => JSX.Element;
    connectBtn: (
        connectWallet: (token?: string | undefined) => void
    ) => JSX.Element;
};

function AddressMenu({ infoLayout, dropdownBtn, connectBtn }: AddressMenuProp) {
    const loggedIn = useRecoilValue(accIsLoggedInState);
    const address = useRecoilValue(accAddressState);
    const logoutDapp = logout;
    const [mShowMenu, setMShowMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const mounted = useMounted();
    const { isMobile } = useScreenSize();
    const connectWallet = useConnectWallet();
    const setIsOpenConnectWalletModal = useSetRecoilState(
        walletIsOpenConnectModalState
    );
    useEffect(() => {
        setMShowMenu(false);
        setShowMenu(false);
    }, [isMobile]);
    const copyAddress = useCallback(() => {
        if (!loggedIn) {
            return;
        }
        setMShowMenu(false);
        setShowMenu(false);
        navigator.clipboard.writeText(address);
    }, [loggedIn, address]);
    useEffect(() => {
        if (loggedIn) {
            setShowMenu(false);
            setMShowMenu(false);
        }
    }, [loggedIn]);

    return (
        <div>
            <div>
                {mounted &&
                    (loggedIn ? (
                        <BasePopover
                            options={{
                                strategy: "fixed",
                                placement: "bottom-end",
                                modifiers: [overlayModifier],
                            }}
                            button={({ open }) => (
                                <div>{dropdownBtn(address, setMShowMenu)}</div>
                            )}
                        >
                            {({ close }) => (
                                <div className="bg-stake-dark-400 min-w-[17.5rem] max-w-full px-4 py-6">
                                    <button
                                        className="px-4 w-full h-10 hover:bg-ash-dark-500 flex items-center justify-between text-white font-bold text-xs mb-5"
                                        onClick={() =>
                                            isMobile
                                                ? setMShowMenu(true)
                                                : close()
                                        }
                                    >
                                        <div className="flex items-center mr-2.5">
                                            <Avatar
                                                src={ImgAvatar}
                                                alt="avatar"
                                                className="w-6 h-6"
                                            />
                                            <span className="ml-2.5">
                                                {address.slice(0, 8) +
                                                    "..." +
                                                    address.slice(-8)}
                                            </span>
                                        </div>
                                        <ICChevronUp />
                                    </button>
                                    <WalletBalance />
                                    <div className="mt-5">
                                        <button
                                            className={`w-full py-2 px-4 flex items-center overflow-hidden text-white hover:text-white transition-all font-bold text-xs hover:bg-ash-dark-500`}
                                            onClick={() => {
                                                copyAddress();
                                                close();
                                            }}
                                        >
                                            <IconCopy className="w-5 h-5 text-ash-gray-600 mr-3.5" />
                                            <span>Copy address</span>
                                        </button>
                                        <button
                                            className={`w-full py-2 px-4 flex items-center overflow-hidden text-white hover:text-white transition-all font-bold text-xs hover:bg-ash-dark-500`}
                                            onClick={() => {
                                                setIsOpenConnectWalletModal(
                                                    true
                                                );
                                                close();
                                            }}
                                        >
                                            <IconChange className="w-5 h-5 text-ash-gray-600 mr-3.5" />
                                            <span>Change wallet</span>
                                        </button>
                                        <button
                                            className={`w-full py-2 px-4 flex items-center overflow-hidden text-white hover:text-white transition-all font-bold text-xs hover:bg-ash-dark-500`}
                                            onClick={() => {
                                                logoutDapp();
                                                close();
                                            }}
                                        >
                                            <IconDisconnect className="w-5 h-5 text-ash-gray-600 mr-3.5" />
                                            <span>Disconnect wallet</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </BasePopover>
                    ) : (
                        <>{connectBtn(connectWallet)}</>
                    ))}
            </div>
            {isMobile && (
                <BaseModal
                    isOpen={mShowMenu}
                    onRequestClose={() => setMShowMenu(false)}
                    type="drawer_btt"
                    className="clip-corner-4 clip-corner-tl bg-ash-dark-600 p-4 flex flex-col max-h-full text-white"
                >
                    <div className="flex justify-end">
                        <BaseModal.CloseBtn />
                    </div>
                    <div className="mt-1 px-6 pb-4 overflow-auto">
                        <div className="text-lg font-bold mb-7">
                            Wallet actions
                        </div>
                        <WalletBalance />
                        <div className="text-sm">
                            <button
                                className="bg-bg rounded-lg px-6 h-12 flex items-center w-full mt-4 text-xs"
                                onClick={copyAddress}
                            >
                                <i className="mr-4">
                                    <IconCopy className="h-5 w-5 text-ash-gray-500" />
                                </i>
                                <span>Copy address</span>
                            </button>
                            <button className="bg-bg rounded-lg px-6 h-12 flex items-center w-full mt-4 text-xs">
                                <i className="mr-4">
                                    <IconChange className="h-5 w-5 text-ash-gray-500" />
                                </i>
                                <span>Change wallet</span>
                            </button>
                            <button
                                className="bg-bg rounded-lg px-6 h-12 flex items-center w-full mt-4 text-xs"
                                onClick={() => {
                                    setMShowMenu(false);
                                    logoutDapp();
                                }}
                            >
                                <i className="mr-4">
                                    <IconDisconnect className="h-5 w-5 text-ash-gray-500" />
                                </i>
                                <span>Disconnect wallet</span>
                            </button>
                        </div>
                    </div>
                </BaseModal>
            )}
            {/* <Modal
                isOpen={isOpenWalletConnect}
                onRequestClose={() => setIsOpenWalletConnect(false)}
                useClipCorner={true}
            >
                <div className="p-12">
                    <WalletConnect
                        onLogin={() => setIsOpenWalletConnect(false)}
                    ></WalletConnect>
                </div>
            </Modal> */}
        </div>
    );
}

export default AddressMenu;
