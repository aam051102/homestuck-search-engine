import React, { createRef, useLayoutEffect } from "react";

import "../css/StaticCanvas.scss";

const StaticCanvas = (props) => {
    const canvasRef = createRef();

    useLayoutEffect(() => {
        const image = new Image();
        image.src = props.src;

        let ev = image.addEventListener("load", () => {
            if (canvasRef.current) {
                canvasRef.current
                    .getContext("2d")
                    .clearRect(0, 0, props.width, props.height);
                canvasRef.current.getContext("2d").drawImage(image, 0, 0);
            }
        });

        return () => {
            image.removeEventListener("load", ev);
        };
    }, [canvasRef, props]);

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
