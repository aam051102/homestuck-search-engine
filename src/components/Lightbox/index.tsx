import React, { useEffect, useMemo, useState } from "react";
import {
    MdAdd,
    MdChevronLeft,
    MdChevronRight,
    MdClose,
    MdEdit,
    MdRemove,
    MdSave,
} from "react-icons/md";
import { useIsSignedIn, useResults } from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import Sidebar from "components/Sidebar";
import { IResult, ITagStructure, ITags } from "types";
import "./index.scss";
import { ITag } from "types";

type IProps = {
    id: number;
    visible?: boolean;
    closeLightbox: () => void;
    loadPrevious: () => void;
    loadNext: () => void;
    tags: ITags;
    tagStructure: ITagStructure[];
};

/**
 * A lightbox to show search results in.
 */
const Lightbox: React.FC<IProps> = ({
    id,
    tags,
    tagStructure,
    visible,
    closeLightbox,
    loadPrevious,
    loadNext,
}) => {
    // States
    const [isSignedIn] = useIsSignedIn();
    const [results] = useResults();

    const [result, setResult] = useState<IResult | undefined>(results[id]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Variables
    const resultTags = result?.tags.map(
        (tag) => tags?.definitions?.[tag] as ITag
    );

    // Functions
    /**
     * Toggles outer value defining whether or not sidebar is open.
     * @param val
     */
    function handleSidebarToggle(val: boolean) {
        setIsSidebarOpen(val);
    }

    function toggleEditing() {
        setIsEditing(!isEditing);
    }

    function saveEdits() {
        setIsEditing(false);
    }

    function addTagToAsset(tagId: number) {
        //TODO
    }

    function removeTagFromAsset(tagId: number) {
        //TODO
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

    /// DOM Construction
    const constructUsedTagsElements = () => {
        const definitions = tags.definitions;
        if (!definitions) return;

        const elements = [];

        for (const tagInfo of resultTags ?? []) {
            elements.push(
                <li
                    className="tag-title"
                    key={tagInfo._id}
                    data-testid="used-tag-item"
                >
                    <p className="tag-title_text">{tagInfo.name}</p>

                    {isEditing ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeTagFromAsset(tagInfo._id);
                            }}
                            type="button"
                            className="tag-remove-btn"
                        >
                            <MdRemove />
                        </button>
                    ) : null}
                </li>
            );
        }

        return elements;
    };

    const constructTagElements = (children: ITagStructure[]) => {
        return children?.map((child) => {
            const tag = tags.definitions?.[child.id];

            if (!tag) return null;

            const assetHasTag = resultTags?.some(
                (resTag) => resTag._id === tag._id
            );

            return (
                <li key={tag._id}>
                    {tag.children?.length ? (
                        <details className="tag-details">
                            <summary className="tag-title tag-title_summary">
                                <MdChevronRight className="tag-dropdown-icon" />
                                <p className="tag-title_text">{tag.name}</p>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        if (!assetHasTag)
                                            addTagToAsset(tag._id);
                                        else removeTagFromAsset(tag._id);
                                    }}
                                    type="button"
                                    className="tag-add-btn"
                                >
                                    {assetHasTag ? <MdRemove /> : <MdAdd />}
                                </button>
                            </summary>

                            <ul className="sidebar-text focusable">
                                {constructTagElements(child.children)}
                            </ul>
                        </details>
                    ) : (
                        <div className="tag-title">
                            <p className="tag-title_text">{tag.name}</p>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    if (!assetHasTag) addTagToAsset(tag._id);
                                    else removeTagFromAsset(tag._id);
                                }}
                                type="button"
                                className="tag-add-btn"
                            >
                                {assetHasTag ? <MdRemove /> : <MdAdd />}
                            </button>
                        </div>
                    )}
                </li>
            );
        });
    };

    const tagListElements = useMemo(
        () => (tags.definitions ? constructTagElements(tagStructure) : null),
        [tags.definitions]
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
                            <div className="no-flash">
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
                        toggleEditing();
                        closeLightbox();
                    }}
                    aria-label="Close sidebar"
                    title="Close"
                >
                    <MdClose />
                </button>

                {isSignedIn ? (
                    <div className="control-btn-area">
                        {isEditing ? (
                            <button
                                type="button"
                                className="control-btn control-save"
                                data-testid="controls-save-btn"
                                onClick={saveEdits}
                            >
                                <MdSave />
                            </button>
                        ) : null}

                        <button
                            type="button"
                            className="control-btn control-edit"
                            data-testid="controls-edit-btn"
                            onClick={toggleEditing}
                        >
                            <MdEdit />
                        </button>
                    </div>
                ) : null}

                <Sidebar
                    title="Asset Tags"
                    onToggle={handleSidebarToggle}
                    isOpen={isSidebarOpen}
                >
                    <ul className="sidebar-text focusable">
                        <li>
                            <details className="tag-details">
                                <summary className="tag-title tag-title_summary">
                                    <MdChevronRight className="tag-dropdown-icon" />
                                    <p className="tag-title_text">Used Tags</p>
                                </summary>

                                <ul className="sidebar-text">
                                    {constructUsedTagsElements()}
                                </ul>
                            </details>
                        </li>

                        {isEditing ? (
                            <>
                                <hr />

                                {tagListElements}
                            </>
                        ) : null}
                    </ul>
                </Sidebar>
            </>
        </div>
    );
};

export default Lightbox;
