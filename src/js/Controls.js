import React from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import "../css/Controls.scss";
import { setDialog, useDialog } from "./useDialog";
import { useIsEditMode } from "./useIsEditMode";
import { useIsSignedIn } from "./useIsSignedIn";

const Controls = (props) => {
    const [isEditMode, setIsEditMode, ] = useIsEditMode();
    const [isSignedIn, ] = useIsSignedIn();
    const [dialog, ] = useDialog();

    function saveData() {

    }

    function exitEditMode(callback) {
        if (!callback) callback = () => {};

        if (isEditMode /*&& resultTags !== result.tags*/) {
            setDialog({
                visible: true,
                title: "Warning",
                content: "Performing this action will disable edit mode. Would you like to save?",
                buttons: [
                    {
                        title: "Save",
                        callbacks: [saveData, callback, ],
                    },
                    {
                        title: "Don't Save",
                        callbacks: [callback, ],
                    },
                    { title: "Cancel", }, 
                ],
            });
        } else {
            callback();
        }
    }

    return (
        <>
            {isSignedIn ? (
                <>
                    <button
                        className="control-btn control-edit"
                        onClick={() => {
                            if (isEditMode) {
                                exitEditMode(props.exit);
                            } else {
                                setIsEditMode(true);
                            }
                        }}
                        aria-label="Edit tags"
                        title="Edit"
                    >
                        {
                            isEditMode ? 
                                <MdCancel /> :
                                <MdEdit />
                        }
                    </button>

                    {
                        isEditMode ? (
                            <button
                                className="control-btn control-save"
                                onClick={() => {
                                    if (props.save) props.save();
                                }}
                                aria-label="Save edits"
                                title="Save"
                            >
                                <MdSave />
                            </button>
                        ) : null
                    }
                </>
            ) : null}
        </>
    );
};

export default Controls;