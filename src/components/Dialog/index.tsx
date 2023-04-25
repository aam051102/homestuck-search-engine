import React from "react";

import { setDialog } from "helpers/globalState";

import "./index.scss";

type IProps = {
    title?: React.ReactNode;
    children?: React.ReactNode;
    visible: boolean;
    buttons?: { title?: string; callback?: () => void }[];
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
                    <p className="dialog-content">{props.children}</p>

                    <div className="dialog-button-wrapper">
                        {props.buttons ? (
                            props.buttons.map((button) => (
                                <button
                                    className="dialog-close"
                                    onClick={async () => {
                                        button.callback?.();

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
