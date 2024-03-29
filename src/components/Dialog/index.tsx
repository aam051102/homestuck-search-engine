import React from "react";

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
    return props.visible ? (
        <div className="dialog-wrapper">
            <div className="dialog-outer">
                <div className="dialog">
                    <p className="dialog-title">{props.title}</p>
                    <div className="dialog-content">{props.children}</div>

                    {props.buttons?.length ? (
                        <div className="dialog-button-wrapper">
                            {props.buttons.map((button) => (
                                <button
                                    key={button.title}
                                    className="dialog-btn"
                                    onClick={async () => {
                                        button.callback?.();
                                    }}
                                >
                                    {button.title}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    ) : null;
};

export default Dialog;
