import React, { useLayoutEffect, useRef } from "react";

import "./index.scss";

type IProps = {
    src: string;
};

const Background: React.FC<IProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        const image = new Image();
        image.src = props.src;

        function renderImage() {
            const ctx = canvasRef.current?.getContext("2d");

            if (canvasRef.current && ctx) {
                // Clear canvas

                ctx.clearRect(
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height
                );

                // Resize canvas
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;

                // Draw image at correct scale to cover entire page
                const heightToRatio =
                    (image.height / image.width) * window.innerWidth;

                if (heightToRatio < window.innerHeight) {
                    ctx.drawImage(
                        image,
                        0,
                        0,
                        (image.width / image.height) * window.innerHeight,
                        window.innerHeight
                    );
                } else {
                    ctx.drawImage(
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
