import React from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import {
    setDialog,
    setEdits,
    setResults,
    useEdits,
    useIsEditMode,
    useIsSignedIn,
    useResults,
} from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import {
    getCookie,
    isEdited,
    setIsEdited,
    showOutdatedSessionDialog,
} from "helpers/utility";
import ENDPOINT from "helpers/endpoint";

import "./index.scss";

const Controls = () => {
    // States
    const [results] = useResults();
    const [edits] = useEdits();
    const [isEditMode, setIsEditMode] = useIsEditMode();
    const [isSignedIn] = useIsSignedIn();

    // Functions
    /**
     * Saves edited data.
     * @param {Function} onSuccess Optional success callback
     */
    async function saveData(onSuccess) {
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
            body: JSON.stringify({ edits: edits }),
        })
            .then((e) => {
                if (e.status === 403 || e.status === 401) {
                    showOutdatedSessionDialog();
                    return { error: "Session outdated." };
                } else {
                    return e.json();
                }
            })
            .then((res) => {
                if (res.error) {
                    console.error(res.error);
                } else {
                    const resultsLocal = results.map((result) => {
                        if (edits[result._id]) {
                            result.tags = edits[result._id].map((tag) => {
                                return tag[1];
                            });
                        }

                        return result;
                    });
                    setResults(resultsLocal);

                    setEdits({});
                    setIsEdited(false);
                    if (onSuccess) onSuccess();
                }
            });
    }

    function exitEditMode(callback) {
        if (!callback) callback = () => {};

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
                            saveData,
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
                                setEdits({});
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
                            onClick={async () => {
                                await saveData(() => {
                                    setIsEditMode(false);
                                });
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
