import React, { useEffect, useRef } from "react";

import "./index.scss";

type IProps = {
    src: string;
    width: number;
    height: number;
};

const StaticCanvas: React.FC<IProps> = (props) => {
    /// Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /// Effects
    useEffect(() => {
        const image = new Image();

        image.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");

            if (ctx) {
                ctx.clearRect(0, 0, props.width, props.height);
                ctx.drawImage(image, 0, 0);
            }
        };

        image.src = props.src;
    }, [canvasRef, props.width, props.height, props.src]);

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
