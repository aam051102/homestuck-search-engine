import React, { useEffect, useState } from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import { useResults } from "helpers/globalState";
import useEventListener from "hooks/useEventListener";

import Sidebar from "components/Sidebar";

import "./index.scss";

type IProps = {
    id: number;
    visible?: boolean;
    hideLightbox: () => void;
    loadPrevious: () => void;
    loadNext: () => void;
};

/**
 * A lightbox to show search results in.
 */
const Lightbox: React.FC<IProps> = (props) => {
    // States
    const [results] = useResults();

    const [resultTags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Variables
    const [result, setResult] = useState(results[props.id]);

    // Functions
    /**
     * Toggles outer value defining whether or not sidebar is open.
     * @param val
     */
    function handleSidebarToggle(val: boolean) {
        setIsSidebarOpen(val);
    }

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
        props.loadPrevious();
    }

    /**
     * Loads next asset
     */
    function loadNext() {
        props.loadNext();
    }

    // Effects
    useEffect(() => {
        if (results?.[props.id]) {
            setResult(results[props.id]);
        }
    }, [props.id, results]);

    /// Event listeners
    useEventListener(
        "keydown",
        (e) => {
            if (props.visible) {
                if (e.key === "Escape") {
                    closeLightbox();
                    return;
                }

                if (e.key === "ArrowLeft") {
                    // Previous asset
                    loadPrevious();
                } else if (e.key === "ArrowRight") {
                    // Next asset
                    loadNext();
                }
            }
        },
        document
    );

    return (
        <div
            className={`lightbox${props.visible ? " visible" : ""}`}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains("lightbox")) {
                    closeLightbox();
                }
            }}
        >
            <>
                <button
                    className={`lightbox-btn-clear lightbox-left`}
                    disabled={props.id <= 0 ? true : false}
                    onClick={() => {
                        loadPrevious();
                    }}
                    aria-label="Previous asset"
                >
                    <MdChevronLeft />
                </button>

                {result ? (
                    <a
                        href={`https://homestuck.com/story/${
                            result ? result.page : ""
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {result.type === 0 ? (
                            <img src={result.content} alt="Lightbox Panel" />
                        ) : null}
                        {result.type === 1 ? (
                            <div>
                                <p>Flash not functional.</p>
                            </div>
                        ) : null}
                    </a>
                ) : null}

                <button
                    className="lightbox-btn-clear lightbox-right"
                    disabled={props.id >= results.length - 1 ? true : false}
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

                <Sidebar
                    title="Asset Tags"
                    onToggle={handleSidebarToggle}
                    isOpen={isSidebarOpen}
                >
                    <ul className="sidebar-text">
                        {resultTags.map((tag, i) => {
                            return (
                                <li
                                    key={tag[0] || i}
                                    data-testid="lightbox-tag-item"
                                >
                                    {tag[1]}
                                </li>
                            );
                        })}
                    </ul>
                </Sidebar>
            </>
        </div>
    );
};

export default Lightbox;
