import React from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import { setDialog, useIsEditMode, useIsSignedIn } from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import { isEdited } from "helpers/utility";

import "./index.scss";

const Controls: React.FC = () => {
    // States
    const [isEditMode, setIsEditMode] = useIsEditMode();
    const [isSignedIn] = useIsSignedIn();

    // Functions
    function exitEditMode(callback?: () => void) {
        if (!callback) callback = () => null;

        if (isEditMode && isEdited) {
            setDialog({
                visible: true,
                title: "Warning",
                content:
                    "Performing this action will disable edit mode. Would you like to save?",
                buttons: [
                    {
                        title: "Save",
                        callbacks: [
                            callback,
                            () => {
                                setIsEditMode(false);
                            },
                        ],
                    },
                    {
                        title: "Don't Save",
                        callbacks: [
                            callback,
                            () => {
                                setIsEditMode(false);
                            },
                        ],
                    },
                    { title: "Cancel" },
                ],
            });
        } else {
            callback();
            setIsEditMode(false);
        }
    }

    // Event listeners
    useEventListener("keydown", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT") {
            if (e.key === "e" && isSignedIn) {
                // Shortcut for edit mode
                if (isEditMode) {
                    exitEditMode();
                } else {
                    setIsEditMode(true);
                }
            }
        }
    });

    return (
        <>
            {isSignedIn ? (
                <>
                    <button
                        className="control-btn control-edit"
                        onClick={() => {
                            if (isEditMode) {
                                exitEditMode();
                            } else {
                                setIsEditMode(true);
                            }
                        }}
                        aria-label="Edit tags"
                        title="Toggle Edit Mode"
                        data-testid="controls-edit-btn"
                    >
                        {isEditMode ? (
                            <MdCancel data-testid="controls-cancel-icon" />
                        ) : (
                            <MdEdit />
                        )}
                    </button>

                    {isEditMode ? (
                        <button
                            className="control-btn control-save"
                            onClick={() => {
                                setIsEditMode(false);
                            }}
                            aria-label="Save edits"
                            title="Save"
                            data-testid="controls-save-btn"
                        >
                            <MdSave />
                        </button>
                    ) : null}
                </>
            ) : null}
        </>
    );
};

export default Controls;
