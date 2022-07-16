import React from "react";
import ImgMetalCardBg from "assets/images/metal-card-bg.png";

function MetalCard({
    children,
    gemImg,
}: {
    children: any;
    gemImg: StaticImageData;
}) {
    return (
        <div
            className="clip-corner-tr-[0.875rem] clip-corner-bevel relative mx-auto p-[1px] w-full"
            style={{
                backgroundImage:
                    "linear-gradient(to bottom, #5E6480 9.65%, #171A26 91.8%)",
            }}
        >
            <div
                className="absolute clip-corner-tr-[0.875rem] clip-corner-bevel inset-[1px] z-[-1]"
                style={{
                    backgroundImage:
                        "linear-gradient(180deg, #31314E 0%, #1F2131 100%)",
                }}
            ></div>
            <div
                className="absolute inset-[1px] bg-no-repeat z-[-1]"
                style={{
                    backgroundImage: `url(${ImgMetalCardBg.src})`,
                    backgroundSize: "54px",
                    backgroundPosition: "calc(100% - 40px) 70px",
                }}
            ></div>
            <div
                className="absolute inset-[1px] bg-no-repeat z-[-1]"
                style={{
                    backgroundImage: `url(${gemImg.src})`,
                    backgroundSize: "64px",
                    backgroundPosition: "calc(100% - 25px) 32px",
                }}
            ></div>
            <div className="absolute z-[-1] top-[-116px] w-[205px] h-[205px] rounded-full bg-[#6E7395] blur-[150px] left-1/2 -translate-x-1/2"></div>
            <div className="text-white border border-transparent">
                {children}
            </div>
        </div>
    );
}

export default MetalCard;
