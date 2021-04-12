import React, { useEffect, useState } from "react";
import {
    MdChevronLeft,
    MdChevronRight,
    MdClose
} from "react-icons/md";

import Sidebar from "./Sidebar";
import useEventListener from "../useEventListener";
import { useEdits, setEdits, useIsEditMode, useResults } from "../globalState";

import "../../css/Lightbox.scss";
import { focusElement, setIsEdited } from "../utility";

/**
 * Global counter for tag 
 */
let tagKeyCounter = 0;

/**
 * A lightbox to show search results in
 * @param {Object} props
 */
const Lightbox = (props) => {
    // States
    const [isEditMode, ] = useIsEditMode();
    const [results, ] = useResults();
    const [edits, ] = useEdits();

    const [resultTags, setResultTags, ] = useState([]);
    const [focused, setFocused, ] = useState(- 1);

    // Variables
    const result = results[props.id];
    
    // Functions
    /**
     * Closes lightbox
     */
    function closeLightbox() {
        props.hideLightbox();
    }

    /**
     * Loads previous asset
     */
    function loadPrevious() {
        setFocused(- 1);
        props.loadPrevious();
    }

    /**
     * Loads next asset
     */
    function loadNext() {
        setFocused(- 1);
        props.loadNext();
    }

    /**
     * Saves tag changes to global state
     * @param {Event} event 
     */
    function rememberLocalData() {
        const activeElement = document.activeElement;
        const resultId = result._id;
        
        setEdits((editsThis) => {
            const editsLocal = Object.assign({}, editsThis);
        
            if (!editsLocal[resultId]) {
                editsLocal[resultId] = resultTags;
            } else {
                editsLocal[resultId][parseInt(activeElement.getAttribute("data-index"))][1] = activeElement.value;
            }
            
            setIsEdited(true);
            return editsLocal;
        });
    }

    // Effects
    useEffect(() => {
        if (result && result.tags.length > 0) {
            if (edits[result._id] && edits[result._id].length > 0) {
                // Use edits, if made
                setResultTags(edits[result._id]);
            } else {
                // Otherwise, use results
                setResultTags(result.tags.map((tag) => [tagKeyCounter++, tag, ]));
            }
        } else {
            // If neither is loaded, use blank line
            setResultTags([[0, "", ], ]);
        }
    }, [result, edits, props.id, isEditMode, ]);

    // Event listeners
    useEventListener("keyup", (e) => {
        if (props.visible && e.target.classList.contains("tag-input")) {
            if (e.target.value.length === 0) {
                e.target.classList.add("empty");
            } else {
                e.target.classList.remove("empty");
            }

            rememberLocalData();
        }
    }, document);

    useEventListener(
        "keydown",
        (e) => {
            if (props.visible) {
                if (!e.target.classList.contains("tag-input")) {
                    if (e.key === "ArrowLeft") {
                        // Previous asset
                        loadPrevious();
                    } else if (e.key === "ArrowRight") {
                        // Next asset
                        loadNext();
                    }
                } else if (isEditMode) {
                    if (e.key === "Enter") {
                        // Add tag
                        const resultId = result._id;

                        setEdits((editsThis) => {
                            const index = parseInt(e.target.getAttribute("data-index")) + 1;
                            const editsLocal = Object.assign({}, editsThis);

                            if (!editsLocal[resultId]) {
                                editsLocal[resultId] = resultTags;
                            }

                            editsLocal[resultId].splice(index, 0, [tagKeyCounter++, "", ]);
                            
                            setFocused(index);

                            setIsEdited(true);
                            return editsLocal;
                        });
                    } else if (e.key === "ArrowUp") {
                        // Move up
                        e.preventDefault();

                        if (e.target.parentNode.previousSibling) {
                            focusElement(e.target.parentNode.previousSibling.children[0]);
                        }
                    } else if (e.key === "ArrowDown") {
                        // Move down
                        e.preventDefault();

                        if (e.target.parentNode.nextSibling) {
                            focusElement(e.target.parentNode.nextSibling.children[0]);
                        }
                    } else if (e.key === "Backspace") {     
                        if (e.target.value.length === 0) {
                            e.preventDefault();
                            
                            if (resultTags.length > 1) {
                                const index = parseInt(e.target.getAttribute("data-index"));
                                
                                // Remove tag
                                const resultId = result._id;
                                setEdits((editsThis) => {
                                    const editsLocal = Object.assign({}, editsThis);       
                                    editsLocal[resultId].splice(index, 1);
                                    setIsEdited(true);
                                    return editsLocal;
                                });

                                focusElement(document.querySelector(`.tag-input[data-index="${index === 0 ?
                                    0 :
                                    index - 1}"]`));
                            }
                        }
                    } else if (e.key === "Delete") {     
                        const index = parseInt(e.target.getAttribute("data-index"));

                        if (resultTags.length > index + 1) {
                            const target = document.querySelector(`.tag-input[data-index="${index + 1}"]`);

                            if (target.value.length === 0) {
                                e.preventDefault();
                                                                
                                // Remove tag
                                const resultId = result._id;
                                setEdits((editsThis) => {
                                    const editsLocal = Object.assign({}, editsThis);       
                                    editsLocal[resultId].splice(index + 1, 1);
                                    setIsEdited(true);
                                    return editsLocal;
                                });
                            }
                        }
                    }
                }
            }
        },
        document
    );

    return results.length > props.id ? (
        <div
            className={`lightbox${props.visible ?
                " visible" : 
                ""}`}
            onClick={(e) => {
                if (e.target.classList.contains("lightbox")) {
                    closeLightbox();
                }
            }}
        >
            <button
                className={`lightbox-btn-clear lightbox-left`}
                disabled={props.id <= 0 ? 
                    true : 
                    false}
                onClick={() => {
                    loadPrevious();
                }}
                aria-label="Previous asset"
            >
                <MdChevronLeft />
            </button>

            <a
                href={`https://homestuck.com/story/${result.page}`}
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
                disabled={props.id >= results.length - 1 ?
                    true :
                    false}
                onClick={() => {
                    loadNext();
                }}
                aria-label="Next asset"
            >
                <MdChevronRight />
            </button>

            <button
                className="lightbox-btn-clear lightbox-close"
                onClick={() => {
                    closeLightbox();
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
                        return (
                            <li className="sidebar-text-input" key={tag[0] || i}>
                                {isEditMode ? (
                                    <input className={`tag-input${tag[1].length === 0 ? 
                                        " empty" :
                                        ""}`} data-index={i} defaultValue={tag[1]} autoFocus={focused === i} />
                                ) : tag[1]}
                            </li>
                        );
                    })}
                </ul>
            </Sidebar>
        </div>
    ) : null;
};

export default Lightbox;
