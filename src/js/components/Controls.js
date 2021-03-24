import React from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import "../../css/Controls.scss";
import { setDialog, useIsEditMode, useIsSignedIn } from "../globalState";
import useEventListener from "../useEventListener";
import { getCookie } from "../utility";

const Controls = () => {
    // Variables
    let editsMade = false;

    // States
    const [isEditMode, setIsEditMode, ] = useIsEditMode();
    const [isSignedIn, ] = useIsSignedIn();

    // Functions
    function showOutdatedSessionDialog() {
        setDialog({ visible: true, title: "Login Session Outdated", content: "Login expired. Please sign back in. You may do this in another tab.", });
    }

    async function saveData() {
        if (!getCookie("hsse_token")) {
            showOutdatedSessionDialog();
            return;
        }

        // TODO: Move individual edits to global editing system.
        /*
        const tags = [];

        document.querySelectorAll(".tag-input").forEach((tag) => {
            tags.push(tag.value);
        });
        
        return await fetch(`${ENDPOINT}/api/app/1/edit/${result._id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie("hsse_token")}`,
            },
            body: JSON.stringify({ tags: tags, }),
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
                result.tags = tags.slice();
                setResultTags(tags);
            }
        });
        */
    }

    function exitEditMode(callback) {
        if (!callback) callback = () => {};

        if (isEditMode && editsMade/*&& resultTags !== result.tags*/) {
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
            setIsEditMode(false);
        }
    }

    // Event listeners
    useEventListener(
        "keydown",
        (e) => {
            if (e.target.tagName !== "INPUT") {
                if (e.key === "e") {
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