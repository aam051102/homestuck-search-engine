import React, { createRef, useLayoutEffect } from "react";

import "../css/Background.scss";

const Background = (props) => {
    const canvasRef = createRef();

    useLayoutEffect(() => {
        const image = new Image();
        image.src = props.src;

        function rerender() {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                canvasRef.current
                    .getContext("2d")
                    .clearRect(0, 0, window.innerWidth, window.innerHeight);

                let heightToRatio =
                    (image.height / image.width) * window.innerWidth;
                if (heightToRatio < window.innerHeight) {
                    canvasRef.current
                        .getContext("2d")
                        .drawImage(
                            image,
                            0,
                            0,
                            (image.width / image.height) * window.innerHeight,
                            window.innerHeight
                        );
                } else {
                    canvasRef.current
                        .getContext("2d")
                        .drawImage(
                            image,
                            0,
                            0,
                            window.innerWidth,
                            heightToRatio
                        );
                }
            }
        }

        let ev = image.addEventListener("load", rerender);
        let ev2 = window.addEventListener("resize", rerender);

        return () => {
            image.removeEventListener("load", ev);
            window.removeEventListener("resize", ev2);
        };
    }, [canvasRef, props]);

    return (
        <div className="background">
            <canvas
                width={window.innerWidth}
                height={window.innerHeight}
                ref={canvasRef}
            ></canvas>
        </div>
    );
};

export default Background;
