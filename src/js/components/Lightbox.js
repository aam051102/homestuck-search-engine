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
 * A lightbox to show search results in
 * @param {Object} props
 */
const Lightbox = (props) => {
    // States
    const [isEditMode, ] = useIsEditMode();
    const [edits, ] = useEdits();

    const [resultTags, setResultTags, ] = useState([]);

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
        rememberLocalData();
        props.hideLightbox();
    }

    /**
     * Saves tag changes to global state
     * @param {Event} event 
     */
    function rememberLocalData() {
        const editsLocal = Object.assign({}, edits);
        
        const tags = [];

        document.querySelectorAll(".tag-input").forEach((tag) => {
            tags.push(tag.value);
        });

        editsLocal[props.id] = tags;
    
        setEdits(editsLocal);
    }

    // Effects
    useEffect(() => {
        if (edits[props.id] && edits[props.id].length > 0) {
            // Use edits, if made
            setResultTags(edits[props.id]);
        } else if (result && result.tags.length > 0) {
            // Otherwise, use results
            setResultTags(result.tags);
        } else {
            // If neither is loaded, use blank line
            setResultTags(["", ]);
        }
    }, [result, edits, props.id, ]);

    // Event listeners
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
                        // Add tag
                        const tags = resultTags.slice();
                        const index = parseInt(e.target.getAttribute("data-index")) + 1;
                        tags.splice(index, 0, "");
                        setResultTags(tags);

                        focusElement(document.querySelector(`.tag-input[data-index="${index}"]`));
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
                        // Remove tag                   
                        if (e.target.value.length === 0) {
                            e.preventDefault();

                            if (resultTags.length > 1) {
                                const tags = resultTags.slice();
                                const index = parseInt(e.target.getAttribute("data-index"));
                                tags.splice(index, 1);
                                setResultTags(tags);

                                // Not great code, but the only way I could think of to do autofocusing properly
                                focusElement(document.querySelector(`.tag-input[data-index="${index === 0 ?
                                    0 :
                                    index - 1}"]`));
                            }
                        } else if (e.target.selectionStart + e.target.selectionEnd === e.target.value.length || e.target.value.length === 1) {
                            e.target.classList.add("empty");
                        }
                    } else if (e.key === "Delete") {
                        if (e.target.selectionStart + e.target.selectionEnd === e.target.value.length || e.target.value.length === 1) {
                            e.target.classList.add("empty");
                        }
                    } else {
                        if ((e.key.length === 1 || (e.key.ctrl && e.key === "v")) && e.target.classList.contains("empty")) {
                            e.target.classList.remove("empty");
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
                    {resultTags.map((tag, i) => {
                        return (
                            <li className="sidebar-text-input" key={tag + i}>
                                {isEditMode ? (
                                    <input className={`tag-input${tag.length === 0 ? 
                                        " empty" :
                                        ""}`} data-index={i} defaultValue={tag} />
                                ) : tag}
                            </li>
                        );
                    })}
                </ul>
            </Sidebar>
        </div>
    ) : null;
};

export default Lightbox;
