import React, { createRef, useLayoutEffect } from "react";

import "./index.scss";

const Background = (props) => {
    const canvasRef = createRef();

    useLayoutEffect(() => {
        const image = new Image();
        image.src = props.src;

        function renderImage() {
            if (canvasRef.current) {
                // Clear canvas
                canvasRef.current
                    .getContext("2d")
                    .clearRect(
                        0,
                        0,
                        canvasRef.current.width,
                        canvasRef.current.height
                    );

                // Resize canvas
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;

                // Draw image at correct scale to cover entire page
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

        // Rerender background on resize and load
        image.addEventListener("load", renderImage);
        window.addEventListener("resize", renderImage);

        return () => {
            image.removeEventListener("load", renderImage);
            window.removeEventListener("resize", renderImage);
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
