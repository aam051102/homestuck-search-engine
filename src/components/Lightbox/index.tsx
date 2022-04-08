import React, { useEffect, useState } from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import { useResults } from "helpers/globalState";
import useEventListener from "hooks/useEventListener";

import Sidebar from "components/Sidebar";

import "./index.scss";
import { IResult, ITags } from "types";

type IProps = {
    id: number;
    visible?: boolean;
    closeLightbox: () => void;
    loadPrevious: () => void;
    loadNext: () => void;
    tags?: ITags;
};

/**
 * A lightbox to show search results in.
 */
const Lightbox: React.FC<IProps> = ({
    id,
    tags,
    visible,
    closeLightbox,
    loadPrevious,
    loadNext,
}) => {
    // States
    const [results] = useResults();

    const [result, setResult] = useState<IResult | undefined>(results[id]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Variables
    const resultTags = result?.tags.map((tag) => tags?.definitions?.[tag]);

    // Functions
    /**
     * Toggles outer value defining whether or not sidebar is open.
     * @param val
     */
    function handleSidebarToggle(val: boolean) {
        setIsSidebarOpen(val);
    }

    // Effects
    useEffect(() => {
        if (results?.[id]) {
            setResult(results[id]);
        }
    }, [id, results]);

    /// Event listeners
    useEventListener(
        "keydown",
        (e) => {
            if (visible) {
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
            className={`lightbox${visible ? " visible" : ""}`}
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
                    disabled={id <= 0 ? true : false}
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
                    disabled={id >= results.length - 1 ? true : false}
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
                        {resultTags?.map((tag) => {
                            if (!tag) return null;

                            return (
                                <li
                                    key={tag._id}
                                    data-testid="lightbox-tag-item"
                                >
                                    {tag.name}
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
