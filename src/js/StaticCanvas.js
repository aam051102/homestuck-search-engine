import React, { createRef } from "react";

import "../css/StaticCanvas.scss";
import useEventListener from "./useEventListener";

const StaticCanvas = (props) => {
    const canvasRef = createRef();

    const image = new Image();
    image.src = props.src;

    useEventListener(
        "load",
        () => {
            if (canvasRef.current) {
                canvasRef.current
                    .getContext("2d")
                    .clearRect(0, 0, props.width, props.height);
                canvasRef.current.getContext("2d").drawImage(image, 0, 0);
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
