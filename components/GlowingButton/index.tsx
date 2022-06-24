import BaseButton, { BaseButtonProps } from "components/BaseButton";
import React, { useMemo } from "react";
import { twMerge } from "tailwind-merge";

const pinkWrapperClassName =
    "hover:colored-drop-shadow-sm hover:colored-drop-shadow-pink-600/75";
const cyanWrapperClassName =
    "hover:colored-drop-shadow-sm hover:colored-drop-shadow-ash-light-blue-500/75";
const yellowWrapperClassName =
    "hover:colored-drop-shadow-sm hover:colored-drop-shadow-yellow-700/75";
const THEME = {
    pink: pinkWrapperClassName,
    cyan: cyanWrapperClassName,
    yellow: yellowWrapperClassName
};
export type GlowingButtonProps = BaseButtonProps & {
    wrapperClassName?: string
};
function GlowingButton({ ...props }: GlowingButtonProps) {
    const wrapperClassName = useMemo(() => {
        const baseClassName = "relative transition-all active:colored-drop-shadow-none";
        const themeClassName = props.theme ? THEME[props.theme] : "";
        const modifierClassName = props.disabled
            ? "hover:colored-drop-shadow-none hover:colored-drop-shadow-transparent"
            : "";
        return twMerge(
            baseClassName,
            themeClassName,
            modifierClassName,
            props.wrapperClassName
        );
    }, [props.theme, props.wrapperClassName, props.disabled]);
    return <span className={wrapperClassName}>
        <BaseButton {...props}/>
    </span>;
}

export default GlowingButton;
