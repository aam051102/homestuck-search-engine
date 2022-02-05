import React, { useRef } from "react";

import useEventListener from "hooks/useEventListener";

import "./index.scss";

type IProps = {
    src: string;
    width: number;
    height: number;
};

const StaticCanvas: React.FC<IProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const image = new Image();
    image.src = props.src;

    useEventListener(
        "load",
        () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");

            if (ctx) {
                ctx.clearRect(0, 0, props.width, props.height);
                ctx.drawImage(image, 0, 0);
            }
        },
        image
    );

    return (
        <canvas
            width={props.width}
            height={props.height}
            className="static-canvas"
            ref={canvasRef}
        ></canvas>
    );
};

export default StaticCanvas;
