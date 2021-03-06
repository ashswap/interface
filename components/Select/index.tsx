import DownIcon from "assets/svg/down.svg";
import { ReactElement } from "react";
import Select, {
    components,
    IndicatorsContainerProps,
    OptionsOrGroups,
    PropsValue,
    SingleValue,
    StylesConfig,
    Theme
} from "react-select";
import styles from "./Select.module.css";

interface Props {
    value?: PropsValue<MyOptionType>;
    onChange?: (v?: SingleValue<MyOptionType>) => void;
    children?: any;
    options: OptionsOrGroups<any, any>;
    prefix?: ReactElement | string;
}

type MyOptionType = {
    label: string;
    value: string;
};
type IsMulti = false;

const selectStyles: StylesConfig<MyOptionType, IsMulti> = {
    menu: (provided, state) => ({
        ...provided,
        backgroundColor: "#0D0B15",
        margin: 0,
        width: 250
    }),

    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? "#FF005C" : "#fff",
        backgroundColor: state.isFocused ? "transparent" : "transparent",
        borderLeft: state.isSelected ? "3px solid #FF005C" : "none",
        margin: "11px 0",
        padding: "0 23px",
        fontWeight: 700
    }),

    control: provided => ({
        ...provided,
        width: 250,
        backgroundColor: "#12101D",
        border: "none",
        boxShadow: "none",
        borderRadius: 0
    }),

    singleValue: (provided, state) => {
        const opacity = state.isDisabled ? 0.5 : 1;
        const transition = "opacity 300ms";

        return {
            ...provided,
            color: "#fff",
            fontSize: "0.875rem"
        };
    },

    valueContainer: (provided, state) => {
        return {
            ...provided,
            padding: "15px 28px"
        };
    }
};

const MySelect = ({ prefix, options, onChange, value }: Props) => {
    return (
        <div className={styles.container}>
            <Select
                defaultValue={options[0]}
                options={options}
                styles={selectStyles}
                theme={(theme: Theme) => ({
                    ...theme,
                    colors: {
                        ...theme.colors,
                        primary50: "transparent"
                    }
                })}
                components={{
                    SingleValue: ({ children, ...props }) => {
                        return (
                            <components.SingleValue {...props}>
                                {
                                    <>
                                        {prefix && (
                                            <span className="text-text-input-3 text-sm">
                                                {prefix}{" "}
                                            </span>
                                        )}
                                        {children}
                                    </>
                                }
                            </components.SingleValue>
                        );
                    },
                    IndicatorSeparator: () => null,
                    IndicatorsContainer: (
                        props: IndicatorsContainerProps<MyOptionType, false>
                    ) => (
                        <div style={{ paddingRight: 28 }}>
                            <components.IndicatorsContainer {...props}>
                                {<DownIcon />}
                            </components.IndicatorsContainer>
                        </div>
                    )
                }}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default MySelect;
