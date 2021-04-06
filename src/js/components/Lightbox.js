import React, { useEffect, useState } from "react";
import {
    MdChevronLeft,
    MdChevronRight,
    MdClose
} from "react-icons/md";

import Sidebar from "./Sidebar";
import useEventListener from "../useEventListener";
import { useEdits, setEdits, useIsEditMode } from "../globalState";

import "../../css/Lightbox.scss";

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
    const [edits, ] = useEdits();

    const [resultTags, setResultTags, ] = useState([]);
    const [ignoreKeyUp, setIgnoreKeyUp, ] = useState(false);
    //const [tagKeys, setTagKeys, ] = useState([]);

    // Variables
    const result = props.results[props.id];
    
    // Functions
    /**
     * Focuses on an element
     * @param {HTMLElement} el 
     */
    function focusElement(el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
    }

    /**
     * Closes lightbox
     */
    function closeLightbox() {
        props.hideLightbox();
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
                const tags = [];

                document.querySelectorAll(".tag-input").forEach((tag) => {
                    tags.push([tagKeyCounter++, tag.value, ]);
                });
            } else {
                editsLocal[resultId][parseInt(activeElement.getAttribute("data-index"))][1] = activeElement.value;
            }

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
                //setTagKeys(result.tags.map(() => tagKeyCounter++)); // Initial key values
            }
        } else {
            // If neither is loaded, use blank line
            setResultTags([[0, "", ], ]);
        }
    }, [result, edits, props.id, isEditMode, ]);

    // Event listeners
    useEventListener("keyup", (e) => {
        if (e.target.classList.contains("tag-input")) {
            if (e.target.value.length === 0) {
                e.target.classList.add("empty");
            } else {
                e.target.classList.remove("empty");
            }

            /*if (ignoreKeyUp) {
                console.log("Ignored key up");
                setIgnoreKeyUp(false);
                return;
            }
            console.log("PERFORMED key up");*/

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
                        props.loadPrevious();
                    } else if (e.key === "ArrowRight") {
                        // Next asset
                        props.loadNext();
                    }
                } else if (isEditMode) {
                    if (e.key === "Enter") {
                        //setIgnoreKeyUp(true);

                        // Add tag
                        const resultId = result._id;

                        setEdits((editsThis) => {
                            const index = parseInt(e.target.getAttribute("data-index")) + 1;
                            const editsLocal = Object.assign({}, editsThis);

                            if (!editsLocal[resultId]) {
                                const tags = [];
            
                                document.querySelectorAll(".tag-input").forEach((tag) => {
                                    tags.push([tagKeyCounter++, tag.value, ]);
                                });

                                editsLocal[resultId] = tags;
                            }

                            editsLocal[resultId].splice(index, 0, [tagKeyCounter++, "", ]);

                            // Figure out how to focus now
                            //focusElement(document.querySelector(`.tag-input[data-index="${index}"]`));
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
                                //setIgnoreKeyUp(true);
                                const index = parseInt(e.target.getAttribute("data-index"));
                                
                                // Remove tag
                                const resultId = result._id;
                                setEdits((editsThis) => {
                                    const editsLocal = Object.assign({}, editsThis);       
                                    editsLocal[resultId].splice(index, 1);
                                    return editsLocal;
                                });

                                focusElement(document.querySelector(`.tag-input[data-index="${index === 0 ?
                                    0 :
                                    index - 1}"]`));
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
                    props.loadPrevious();
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
                disabled={props.id >= props.results.length - 1 ?
                    true :
                    false}
                onClick={() => {
                    props.loadNext();
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
                    {console.log("___________________________________________")}
                    {resultTags.map((tag, i) => {
                        //console.log(i, tag);
                        return (
                            <li className="sidebar-text-input" key={tag[0] || i}>
                                {isEditMode ? (
                                    <input className={`tag-input${tag[1].length === 0 ? 
                                        " empty" :
                                        ""}`} data-index={i} defaultValue={tag[1]} />
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
