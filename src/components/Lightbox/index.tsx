import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import ENDPOINT from "helpers/endpoint";
import { getCookie } from "helpers/utility";
import Dialog from "components/Dialog";

function compareArr<T>(a: T[], b: T[]) {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (!b.includes(a[i])) {
            return false;
        }
    }

    return true;
}

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
    const [tagsEditing, setTagsEditing] = useState<Set<number>>(
        new Set(result?.tags)
    );

    const [error, setError] = useState<string | undefined>();
    const [showHasUnsavedChangesDialog, setShowHasUnsavedChangesDialog] =
        useState<boolean>(false);
    const [
        showHasUnsavedChangesCloseDialog,
        setShowHasUnsavedChangesCloseDialog,
    ] = useState<boolean>(false);

    // Functions
    /**
     * Toggles outer value defining whether or not sidebar is open.
     * @param val
     */
    function handleSidebarToggle(val: boolean) {
        setIsSidebarOpen(val);
    }

    function toggleEditing() {
        if (isEditing) {
            setTagsEditing(new Set(result?.tags));
        }

        setIsEditing(!isEditing);
    }

    async function saveEdits() {
        const authToken = getCookie("hsse_token");

        await fetch(`${ENDPOINT}/api/app/1/edit/${result?._id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ tags: Array.from(tagsEditing) }),
        })
            .then((e) => e.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                toggleEditing();
            })
            .catch((e) => {
                console.error(`Failed to update due to error: ${e}`);
                setError("Failed to update asset");
            });
    }

    function addTagToAsset(tagId: number) {
        setTagsEditing((lastState) => {
            const newState = new Set(lastState);
            newState.add(tagId);
            return newState;
        });
    }

    function removeTagFromAsset(tagId: number) {
        setTagsEditing((lastState) => {
            const newState = new Set(lastState);
            newState.delete(tagId);
            return newState;
        });
    }

    // Effects
    useEffect(() => {
        if (results?.[id]) {
            setResult(results[id]);
            setTagsEditing(new Set(results[id]?.tags));
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

        const elements: React.ReactNode[] = [];

        tagsEditing.forEach((tagId) => {
            const tagInfo = definitions[tagId];

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
        });

        return elements;
    };

    const constructTagElements = useCallback(
        (children: ITagStructure[]) => {
            return children?.map((child) => {
                const tag = tags.definitions?.[child.id];

                if (!tag) return null;

                const assetHasTag = tagsEditing?.has(tag._id);

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

                                        if (!assetHasTag)
                                            addTagToAsset(tag._id);
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
        },
        [tagsEditing, tags.definitions]
    );

    const tagListElements = useMemo(
        () => (tags.definitions ? constructTagElements(tagStructure) : null),
        [tags.definitions, tagStructure, constructTagElements]
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
                        if (
                            isEditing &&
                            !compareArr(
                                result?.tags ?? [],
                                Array.from(tagsEditing)
                            )
                        ) {
                            setShowHasUnsavedChangesCloseDialog(true);
                        } else {
                            toggleEditing();
                            closeLightbox();
                        }
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
                            onClick={() => {
                                if (
                                    isEditing &&
                                    !compareArr(
                                        result?.tags ?? [],
                                        Array.from(tagsEditing)
                                    )
                                ) {
                                    setShowHasUnsavedChangesDialog(true);
                                } else {
                                    toggleEditing();
                                }
                            }}
                        >
                            <MdEdit />
                        </button>
                    </div>
                ) : null}

                <Dialog
                    visible={showHasUnsavedChangesCloseDialog}
                    title="Unsaved changes"
                    buttons={[
                        {
                            title: "Save & close",
                            callback: () => {
                                saveEdits();
                                closeLightbox();
                                setShowHasUnsavedChangesCloseDialog(false);
                            },
                        },
                        {
                            title: "Close",
                            callback: () => {
                                toggleEditing();
                                closeLightbox();
                                setShowHasUnsavedChangesCloseDialog(false);
                            },
                        },
                        {
                            title: "Cancel",
                            callback: () => {
                                setShowHasUnsavedChangesCloseDialog(false);
                            },
                        },
                    ]}
                >
                    <p>
                        You have unsaved changes. If you close the asset now,
                        you will lose them. Would you like to save?
                    </p>
                </Dialog>

                <Dialog
                    visible={showHasUnsavedChangesDialog}
                    title="Unsaved changes"
                    buttons={[
                        {
                            title: "Save & stop editing",
                            callback: () => {
                                saveEdits();
                                setShowHasUnsavedChangesDialog(false);
                            },
                        },
                        {
                            title: "Stop editing",
                            callback: () => {
                                toggleEditing();
                                setShowHasUnsavedChangesDialog(false);
                            },
                        },
                        {
                            title: "Cancel",
                            callback: () => {
                                setShowHasUnsavedChangesDialog(false);
                            },
                        },
                    ]}
                >
                    <p>
                        You have unsaved changes. If you stop editing now, you
                        will lose them. Would you like to save?
                    </p>
                </Dialog>

                <Dialog
                    visible={!!error}
                    title="Error"
                    buttons={[
                        {
                            title: "Ok",
                            callback: () => {
                                setError(undefined);
                            },
                        },
                    ]}
                >
                    <p>{error}</p>
                </Dialog>

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
