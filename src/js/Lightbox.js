import React, { useEffect, useState } from "react";
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
    const [resultTags, setResultTags] = useState([]);

    const result = props.results[props.id];

    useEffect(() => {
        if(result) {
            if(result.tags.length > 0) {
                setResultTags(result.tags);
            } else {
                setResultTags([""]);
            }
        }
    }, [result]);

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
                        const tags = resultTags.slice();
                        const index = parseInt(e.target.getAttribute("data-index")) + 1;
                        tags.splice(index, 0, "");
                        setResultTags(tags);

                        focusElement(document.querySelector(`.tag-input[data-index="${index}"]`));
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

                            if(resultTags.length > 1) {
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
                                    const tags = [];

                                    document.querySelectorAll(".tag-input").forEach((tag) => {
                                        tags.push(tag.value);
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
                                        } else {
                                            result.tags = tags.slice();
                                            setResultTags(tags);
                                            setIsEditMode(false);
                                        }
                                    });                                    
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
        </div>
    ) : null;
};

export default Lightbox;
