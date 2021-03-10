import React, { useEffect, useState } from "react";
import {
    MdCancel,
    MdChevronLeft,
    MdChevronRight,
    MdClose,
    MdEdit,
    MdSave
} from "react-icons/md";

import useEventListener from "./useEventListener";
import "../css/Lightbox.scss";
import Sidebar from "./Sidebar";
import ENDPOINT from "./Endpoint";
import { getCookie } from "./Utility";
import Dialog from "./Dialog";

/**
 * A lightbox to show search results in
 * @param {Object} props
 */
const Lightbox = (props) => {
    // State
    const [isEditMode, setIsEditMode, ] = useState(false);
    const [resultTags, setResultTags, ] = useState([]);
    const [dialog, setDialog, ] = useState({ visible: false, title: "", content: "", });

    // Variables
    const result = props.results[props.id];
    
    // Functions
    function focusElement(el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
    }

    function closeLightbox() {
        setIsEditMode(false);
        props.hideLightbox();
    }

    function showOutdatedSessionDialog() {
        setDialog({ visible: true, title: "Login Session Outdated", content: "Login expired. Please sign back in. You may do this in another tab.", });
    }

    function closeDialog() {
        setDialog({ visible: false, });
    }

    async function saveData() {
        if (!getCookie("hsse_token")) {
            showOutdatedSessionDialog();

            return;
        }

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

                return {};
            } else {
                return e.json();
            }
        }).then((res) => {
            if (res.error) {
                console.error(res.error);
            } else {
                result.tags = tags.slice();
                setResultTags(tags);
                setIsEditMode(false);
            }
        });
    }

    function exitEditMode(callback) {
        if (!callback) callback = () => {};

        if (isEditMode && resultTags !== result.tags) {
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
                        callbacks: [callback, () => { setIsEditMode(false) }, ],
                    },
                    { title: "Cancel", }, 
                ],
            });
        } else {
            callback();
            setIsEditMode(false);
        }
    }

    // Effects
    useEffect(() => {
        if (result) {
            if (result.tags.length > 0) {
                setResultTags(result.tags);
            } else {
                setResultTags(["", ]);
            }
        }
    }, [result, ]);

    // Event listeners
    useEventListener(
        "keydown",
        (e) => {
            if (props.visible) {
                if (!e.target.classList.contains("tag-input")) {
                    if (e.key === "ArrowLeft") {
                        exitEditMode(props.loadPrevious);
                    } else if (e.key === "ArrowRight") {
                        exitEditMode(props.loadNext);
                    } else if (e.key === "e") {
                        if (isEditMode) {
                            exitEditMode();
                        } else {
                            setIsEditMode(true);
                        }
                    }
                } else {
                    if (e.key === "Enter") {
                        const tags = resultTags.slice();
                        const index = parseInt(e.target.getAttribute("data-index")) + 1;
                        tags.splice(index, 0, "");
                        setResultTags(tags);

                        focusElement(document.querySelector(`.tag-input[data-index="${index}"]`));
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();

                        if (e.target.parentNode.previousSibling) {
                            focusElement(e.target.parentNode.previousSibling.children[0]);
                        }
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();

                        if (e.target.parentNode.nextSibling) {
                            focusElement(e.target.parentNode.nextSibling.children[0]);
                        }
                    } else if (e.key === "Backspace") {                        
                        if (e.target.value.length === 0) {
                            e.preventDefault();

                            if (resultTags.length > 1) {
                                const tags = resultTags.slice();
                                const index = parseInt(e.target.getAttribute("data-index"));
                                tags.splice(index, 1);
                                setResultTags(tags);

                                // Not great code, but the only way I could think of to do autofocusing properly
                                focusElement(document.querySelector(`.tag-input[data-index="${index === 0 ? 0 : index - 1}"]`));
                            }
                        }
                    }
                }
            }
        },
        document
    );

    return props.results.length > props.id ? (
        <div
            className={`lightbox${props.visible ? " visible" : ""}`}
            onClick={(e) => {
                if (e.target.classList.contains("lightbox")) {
                    exitEditMode(closeLightbox);
                }
            }}
        >
            <button
                className={`lightbox-btn-clear lightbox-left`}
                disabled={props.id <= 0 ? true : false}
                onClick={() => {
                    exitEditMode(props.loadPrevious);
                }}
                aria-label="Previous asset"
            >
                <MdChevronLeft />
            </button>

            <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
            >
                {result.type === 0 ? (
                    <img
                        src={result.content}
                        alt="Lightbox Panel"
                    />
                ) : null}
                {result.type === 1 ? (
                    <div>
                        <p>Flash not functional.</p>
                    </div>
                ) : null}
            </a>

            <button
                className="lightbox-btn-clear lightbox-right"
                disabled={props.id >= props.results.length - 1 ? true : false}
                onClick={() => {
                    exitEditMode(props.loadNext);
                }}
                aria-label="Next asset"
            >
                <MdChevronRight />
            </button>

            {props.signedIn ? (
                <>
                    <button
                        className="lightbox-btn-clear lightbox-edit"
                        onClick={() => {
                            if (isEditMode) {
                                exitEditMode();
                            } else {
                                setIsEditMode(true);
                            }
                        }}
                        aria-label="Edit tags"
                        title="Edit"
                    >
                        {
                            isEditMode ? <MdCancel /> : <MdEdit />
                        }
                    </button>

                    {
                        isEditMode ?
                            <button
                                className="lightbox-btn-clear lightbox-save"
                                onClick={saveData}
                                aria-label="Save edits"
                                title="Save"
                            >
                                <MdSave />
                            </button> : null
                    }
                </>
            ) : null}

            <button
                className="lightbox-btn-clear lightbox-close"
                onClick={() => {
                    exitEditMode(closeLightbox);
                }}
                aria-label="Close sidebar"
                title="Close"
            >
                <MdClose />
            </button>

            <Sidebar title="Asset Tags">
                {isEditMode && <p>Type and press enter.</p>}

                <ul className="sidebar-text">
                    {resultTags.map((tag, i) => {
                        return <li key={tag + i}>
                            {isEditMode ? (
                                <input className="tag-input" data-index={i} defaultValue={tag} />
                            ) : tag}
                        </li>;
                    })}
                </ul>
            </Sidebar>

            <Dialog {...dialog} closeDialog={closeDialog} />
        </div>
    ) : null;
};

export default Lightbox;
