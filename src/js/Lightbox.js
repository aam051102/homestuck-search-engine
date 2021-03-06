import React, { useState } from "react";
import {
    MdCancel,
    MdChevronLeft,
    MdChevronRight,
    MdClose,
    MdEdit,
    MdSave,
} from "react-icons/md";

import useEventListener from "./useEventListener";
import "../css/Lightbox.scss";
import Sidebar from "./Sidebar";
import ENDPOINT from "./Endpoint";
import { getCookie } from "./Utility";

/**
 * A lightbox to show search results in
 * @param {Object} props
 */
const Lightbox = (props) => {
    const [isEditMode, setIsEditMode] = useState(false);

    const result = props.results[props.id];

    const focusElement = (el) => {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
    };

    // Shortcut listener
    useEventListener(
        "keydown",
        (e) => {
            if (props.visible) {
                if(!e.target.classList.contains("tag-input")) {
                    if (e.key === "ArrowLeft") {
                        props.loadPrevious();
                    } else if (e.key === "ArrowRight") {
                        props.loadNext();
                    }
                } else {
                    if(e.key === "Enter") {
                        // TODO: Perform tag separation
                        const list = e.target.parentNode.parentNode;

                        const inputWrapper_el = document.createElement("li");
                        const input_el = document.createElement("input");
                        input_el.className = "tag-input";
                        
                        inputWrapper_el.appendChild(input_el);

                        if(e.target.parentNode.nextSibling) {
                            list.insertBefore(inputWrapper_el, e.target.parentNode.nextSibling);
                        } else {
                            list.appendChild(inputWrapper_el);
                        }

                        input_el.focus();
                    } else if(e.key === "ArrowUp") {
                        e.preventDefault();

                        if(e.target.parentNode.previousSibling) {
                            focusElement(e.target.parentNode.previousSibling.children[0]);
                        }
                    } else if(e.key === "ArrowDown") {
                        e.preventDefault();

                        if(e.target.parentNode.nextSibling) {
                            focusElement(e.target.parentNode.nextSibling.children[0]);
                        }
                    } else if(e.key === "Backspace") {                        
                        if(e.target.value.length === 0) {
                            e.preventDefault();
                            
                            if(e.target.parentNode.previousSibling) {
                                focusElement(e.target.parentNode.previousSibling.children[0]);
                            } else if(e.target.parentNode.nextSibling) {
                                focusElement(e.target.parentNode.nextSibling.children[0]);
                            }

                            e.target.parentNode.remove();
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
                    props.hideLightbox();
                }
            }}
        >
            <button
                className={`lightbox-btn-clear lightbox-left`}
                disabled={props.id <= 0 ? true : false}
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
                disabled={props.id >= props.results.length - 1 ? true : false}
                onClick={() => {
                    props.loadNext();
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
                            setIsEditMode(!isEditMode);
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
                                onClick={() => {
                                    // TOOD: Save edits
                                    const tags = [];

                                    document.querySelectorAll(".tag-input").forEach((field) => {
                                        tags.push(field.value);
                                    });

                                    fetch(`${ENDPOINT}/api/app/1/edit/${result._id}`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${getCookie("hsse_token")}`,
                                        },
                                        body: JSON.stringify({ tags: tags }),
                                    }).then(e => {
                                        if(e.status === 403 || e.status === 401) {
                                            // TODO: Alert user of outdated session
                                            return {};
                                        } else {
                                            return e.json();
                                        }
                                    }).then((res) => {
                                        if(res.error) {
                                            console.error(res.error);
                                        }
                                    });

                                    setIsEditMode(false);
                                }}
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
                onClick={props.hideLightbox}
                aria-label="Close sidebar"
                title="Close"
            >
                <MdClose />
            </button>

            <Sidebar title="Asset Tags">
                {isEditMode ? (
                    <ul className="sidebar-text">
                        {result.tags.map((tag, i) => {
                            return (
                                <li key={i}>
                                    <input className="tag-input" defaultValue={tag} />
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <ul className="sidebar-text">
                        {result.tags.map((tag, i) => {
                            return <li key={i}>{tag}</li>;
                        })}
                    </ul>
                )}
            </Sidebar>
        </div>
    ) : null;
};

export default Lightbox;
