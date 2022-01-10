import React from "react";

import { setDialog } from "helpers/globalState";

import "./index.scss";

/**
 * A basic dialog with info
 * @param {Object} props
 */
const Dialog = (props) => {
    function handleCloseBtnClick() {
        setDialog({ visible: false });
    }

    return (
        props.visible && (
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
        )
    );
};

export default Dialog;
