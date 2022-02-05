import React from "react";

import { setDialog } from "helpers/globalState";

import "./index.scss";

type IProps = {
    title: React.ReactNode;
    content: React.ReactNode;
    visible: boolean;
    buttons?: { title?: string; callbacks?: (() => void)[] }[];
};

/**
 * A basic dialog with info
 */
const Dialog: React.FC<IProps> = (props) => {
    function handleCloseBtnClick() {
        setDialog({ visible: false });
    }

    return props.visible ? (
        <div className="dialog-wrapper">
            <div className="dialog-outer">
                <div className="dialog">
                    <p className="dialog-title">{props.title}</p>
                    <p className="dialog-content">{props.content}</p>

                    <div className="dialog-button-wrapper">
                        {props.buttons ? (
                            props.buttons.map((button) => (
                                <button
                                    className="dialog-close"
                                    onClick={async () => {
                                        if (button.callbacks) {
                                            for (
                                                let i = 0;
                                                i < button.callbacks.length;
                                                i++
                                            ) {
                                                await button.callbacks[i]();
                                            }
                                        }

                                        handleCloseBtnClick();
                                    }}
                                    key={button.title}
                                >
                                    {button.title}
                                </button>
                            ))
                        ) : (
                            <button
                                className="dialog-close"
                                onClick={handleCloseBtnClick}
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ) : null;
};

export default Dialog;
