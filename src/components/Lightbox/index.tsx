import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    MdAdd,
    MdChevronLeft,
    MdChevronRight,
    MdClose,
    MdEdit,
    MdRemove,
    MdSave,
    MdSearch,
} from "react-icons/md";
import { AiFillTags } from "react-icons/ai";
import useEventListener from "hooks/useEventListener";
import Sidebar from "components/Sidebar";
import { IResult, ITagStructure, ITags } from "types";
import "./index.scss";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { compareArr, getCookie } from "helpers/utility";
import Dialog from "components/Dialog";
import { Link } from "react-router-dom";
import {
    isEditingState,
    isSignedInState,
    resultsState,
} from "helpers/globalState";
import { useRecoilValue, useRecoilState } from "recoil";

type IProps = {
    id: number;
    visible?: boolean;
    closeLightbox: () => void;
    loadPrevious: () => void;
    loadNext: () => void;
    tags: ITags;
    tagStructure: ITagStructure[];
    tagQuery: string;
    setTagQuery: (value: string) => void;
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
    tagQuery,
    setTagQuery,
}) => {
    // States
    const isSignedIn = useRecoilValue(isSignedInState);
    const [results, setResults] = useRecoilState(resultsState);
    const result = results[id];
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isEditing, setIsEditing] = useRecoilState(isEditingState);
    const [tagsEditing, setTagsEditing] = useState<Set<number>>(
        new Set(result?.tags)
    );

    const [error, setError] = useState<string | undefined>();
    const [unsavedChangesDialog, setUnsavedChangesDialog] = useState<
        { buttons?: { title?: string; callback?: () => void }[] } | undefined
    >(undefined);

    // Functions
    function tryLoadNext() {
        if (
            isEditing &&
            !compareArr(result?.tags ?? [], Array.from(tagsEditing))
        ) {
            setUnsavedChangesDialog({
                buttons: [
                    {
                        title: "Save & continue",
                        callback: async () => {
                            if (!(await saveEdits())) return;
                            loadNext();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Continue without saving",
                        callback: () => {
                            loadNext();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Cancel",
                        callback: () => {
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                ],
            });
        } else {
            loadNext();
        }
    }

    function tryLoadPrevious() {
        if (
            isEditing &&
            !compareArr(result?.tags ?? [], Array.from(tagsEditing))
        ) {
            setUnsavedChangesDialog({
                buttons: [
                    {
                        title: "Save & continue",
                        callback: async () => {
                            if (!(await saveEdits())) return;
                            loadPrevious();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Continue without saving",
                        callback: () => {
                            loadPrevious();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Cancel",
                        callback: () => {
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                ],
            });
        } else {
            loadPrevious();
        }
    }

    function tryCloseLightbox() {
        if (
            isEditing &&
            !compareArr(result?.tags ?? [], Array.from(tagsEditing))
        ) {
            setUnsavedChangesDialog({
                buttons: [
                    {
                        title: "Save & close",
                        callback: async () => {
                            if (!(await saveEdits())) return;
                            closeLightbox();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Close",
                        callback: () => {
                            closeLightbox();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Cancel",
                        callback: () => {
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                ],
            });
        } else {
            closeLightbox();
        }
    }

    function tryToggleEditing() {
        if (
            isEditing &&
            !compareArr(result?.tags ?? [], Array.from(tagsEditing))
        ) {
            setUnsavedChangesDialog({
                buttons: [
                    {
                        title: "Save & continue",
                        callback: async () => {
                            if (!(await saveEdits())) return;
                            toggleEditing();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Continue without saving",
                        callback: () => {
                            toggleEditing();
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                    {
                        title: "Cancel",
                        callback: () => {
                            setUnsavedChangesDialog(undefined);
                        },
                    },
                ],
            });
        } else {
            toggleEditing();
        }
    }

    /**
     * Toggles outer value defining whether or not sidebar is open.
     * @param val
     */
    function handleSidebarToggle(val: boolean) {
        setIsSidebarOpen(val);
    }

    function toggleEditing() {
        if (isEditing) {
            setTagsEditing(() => new Set(result?.tags));
        } else {
            setIsSidebarOpen(true);
        }

        setIsEditing(!isEditing);
    }

    async function saveEdits() {
        const authToken = getCookie("hsse_token");
        const tagId = result?._id;
        if (!tagId) return;

        return await fetch(`${ENDPOINT}/api/app/1/edit/${tagId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ tags: Array.from(tagsEditing) }),
        })
            .then((e) => e.json())
            .then((data: IResult | { error: string }) => {
                const errData = data as { error: string };
                if (errData.error) {
                    console.error(errData.error);
                    return;
                }

                const tagData = data as IResult;

                setResults((oldState) => {
                    const newState = [...oldState];
                    newState[id] = tagData;
                    return newState;
                });

                return true;
            })
            .catch((e) => {
                console.error(`Failed to update due to error: ${e}`);
                setError(`Failed to update asset. Error: ${e}`);
                return false;
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
        if (result) {
            setTagsEditing(() => new Set(result?.tags));
        }
    }, [result]);

    /// Event listeners
    useEventListener("keydown", (e) => {
        if (
            visible &&
            document.activeElement?.tagName.toLowerCase() !== "input"
        ) {
            if (e.key === "Escape") {
                tryCloseLightbox();
                return;
            } else if (e.key === "ArrowLeft") {
                // Previous asset
                tryLoadPrevious();
                return;
            } else if (e.key === "ArrowRight") {
                // Next asset
                tryLoadNext();
                return;
            }
        }
    });

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

                                            if (!assetHasTag) {
                                                addTagToAsset(tag._id);
                                            } else {
                                                removeTagFromAsset(tag._id);
                                            }
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

                                        if (!assetHasTag) {
                                            addTagToAsset(tag._id);
                                        } else {
                                            removeTagFromAsset(tag._id);
                                        }
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
                    tryCloseLightbox();
                }
            }}
        >
            <>
                <button
                    className={`lightbox-btn-clear lightbox-left`}
                    disabled={id <= 0 ? true : false}
                    onClick={() => {
                        tryLoadPrevious();
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
                        tryLoadNext();
                    }}
                    aria-label="Next asset"
                >
                    <MdChevronRight />
                </button>

                <button
                    className="lightbox-btn-clear lightbox-close"
                    onClick={() => {
                        tryCloseLightbox();
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
                                tryToggleEditing();
                            }}
                        >
                            <MdEdit />
                        </button>

                        <Link
                            to={`${BASE_URL}tags`}
                            className="control-btn control-tags"
                            data-testid="controls-tags-btn"
                        >
                            <AiFillTags />
                        </Link>
                    </div>
                ) : null}

                <Dialog
                    visible={!!unsavedChangesDialog}
                    buttons={unsavedChangesDialog?.buttons}
                    title="Unsaved changes"
                >
                    <p>
                        You have unsaved changes. If you continue this action,
                        you will lose them. Would you like to save?
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
                    {isEditing ? (
                        <>
                            <div className="tag-search-wrapper">
                                <input
                                    type="text"
                                    className="tag-search-input"
                                    value={tagQuery}
                                    placeholder="Find tags"
                                    onChange={(e) =>
                                        setTagQuery(e.target.value)
                                    }
                                />
                                <MdSearch className="tag-search-icon" />
                            </div>
                        </>
                    ) : null}

                    <ul className="sidebar-text focusable">
                        {isEditing ? (
                            <>
                                {tagListElements}

                                <hr />
                            </>
                        ) : null}

                        <li>
                            <details className="tag-details" open>
                                <summary className="tag-title tag-title_summary">
                                    <MdChevronRight className="tag-dropdown-icon" />
                                    <p className="tag-title_text">Used Tags</p>
                                </summary>

                                <ul className="sidebar-text">
                                    {constructUsedTagsElements()}
                                </ul>
                            </details>
                        </li>
                    </ul>
                </Sidebar>
            </>
        </div>
    );
};

export default Lightbox;
