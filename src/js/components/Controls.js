import React from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import { setDialog, setEdits, useEdits, useIsEditMode, useIsSignedIn } from "../globalState";
import useEventListener from "../useEventListener";

import "../../css/Controls.scss";
import { getCookie, showOutdatedSessionDialog } from "../utility";
import ENDPOINT from "../endpoint";

const Controls = () => {
    // States
    const [edits, ] = useEdits();
    const [isEditMode, setIsEditMode, ] = useIsEditMode();
    const [isSignedIn, ] = useIsSignedIn();

    // Functions
    /**
     * Saves edited data.
     * @param {Record<string, Array<string>>} edits Object where keys are ids and values are string arrays of tags
     */
    async function saveData() {
        if (!getCookie("hsse_token")) {
            showOutdatedSessionDialog();
            return;
        }

        await fetch(`${ENDPOINT}/api/app/1/edit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie("hsse_token")}`,
            },
            body: JSON.stringify({ edits: edits, }),
        }).then(e => {
            if (e.status === 403 || e.status === 401) {
                showOutdatedSessionDialog();
                return { error: "Session outdated.", };
            } else {
                return e.json();
            }
        }).then((res) => {
            if (res.error) {
                console.error(res.error);
            } else {
                setEdits({});
            }
        });
    }

    function exitEditMode(callback) {
        if (!callback) callback = () => {};

        if (isEditMode && Object.keys(edits).length > 0) {
            setDialog({
                visible: true,
                title: "Warning",
                content: "Performing this action will disable edit mode. Would you like to save?",
                buttons: [
                    {
                        title: "Save",
                        callbacks: [saveData, callback, () => { setIsEditMode(false) }, ],
                    },
                    {
                        title: "Don't Save",
                        callbacks: [callback, () => { setEdits({}); setIsEditMode(false) }, ],
                    },
                    { title: "Cancel", }, 
                ],
            });
        } else {
            callback();
            setIsEditMode(false);
        }
    }

    // Event listeners
    useEventListener(
        "keydown",
        (e) => {
            if (e.target.tagName !== "INPUT") {
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
                                onClick={async () => {
                                    await saveData();
                                    exitEditMode();
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