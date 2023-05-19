import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import {
    checkIsSignedIn,
    compareArr,
    getCookie,
    getUniqueId,
} from "helpers/utility";
import Layout from "components/Layout";
import { ITag, ITags } from "types";
import {
    MdAdd,
    MdChevronRight,
    MdDelete,
    MdEdit,
    MdSave,
    MdMoreVert,
    MdRemove,
} from "react-icons/md";
import "./index.scss";
import Dialog from "components/Dialog";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { isEditingState, isSignedInState } from "helpers/globalState";
import { useRecoilValue, useRecoilState } from "recoil";
import {
    useDrag,
    useDrop,
    useDragLayer,
    DndProvider,
    XYCoord,
} from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";

const TOP_TAG_PARENT_ID = -1;

/*
 * Use react-dnd for file explorer system? Or should I just go straight in for react-dnd-treeview
 * It might be better to make the primary system yourself instead of using two layers and having to deal with react-dnd-treeview's tree system.
 */

type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};

function getItemStyles(currentOffset: XYCoord | null) {
    if (!currentOffset) {
        return {
            display: "none",
        };
    }

    const { x, y } = currentOffset;

    const transform = `translate(${x}px, ${y}px)`;

    return {
        transform,
        WebkitTransform: transform,
    };
}

const CustomDragLayer: React.FC = () => {
    const { itemType, isDragging, item, currentOffset } = useDragLayer(
        (monitor) => ({
            item: monitor.getItem(),
            itemType: monitor.getItemType(),
            //initialOffset: monitor.getInitialSourceClientOffset(),
            currentOffset: monitor.getSourceClientOffset(),
            isDragging: monitor.isDragging(),
        })
    );

    function renderItem() {
        switch (itemType) {
            case "tag":
                return (
                    <div className="dragging-element_tag">{item.tag.name}</div>
                );
            default:
                return null;
        }
    }

    if (!isDragging) {
        return null;
    }

    return (
        <div className="dragging-cover">
            <div
                className="dragging-element"
                style={getItemStyles(currentOffset)}
            >
                {renderItem()}
            </div>
        </div>
    );
};

type IDroppointProps = {
    addChildToTag: (childId: number, oldParentId: number) => void;
    path: number[];
    parentTag: ITag;
};

const Droppoint: React.FC<IDroppointProps> = ({
    addChildToTag,
    path,
    parentTag,
}) => {
    const [dropProps, drop] = useDrop<
        { tag: ITag; path: number[] },
        unknown,
        { isOver: boolean; isMidDrag: boolean }
    >(() => ({
        accept: "tag",
        canDrop: (item) => {
            if (compareArr(path, item.path)) {
                return true;
            }

            if (parentTag.children?.includes(item.tag._id)) {
                return false;
            }

            return !path.includes(item.tag._id);
        },
        drop: (item) => {
            addChildToTag(item.tag._id, item.path[item.path.length - 1]);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            isMidDrag: !!monitor.getItem(),
        }),
    }));

    return (
        <div
            className={`tag-droppoint-top ${
                dropProps.isOver ? "hovered" : ""
            } ${dropProps.isMidDrag ? "visible" : ""}`}
            ref={drop}
        ></div>
    );
};

type IChildTagProps = {
    tag: ITag;
    constructTagElements: (val: number[], path: number[]) => React.ReactNode;
    deleteTag: (id: number) => void;
    renameTag: (id: number) => void;
    createChild: (id: number) => void;
    addChildToTag: (
        newParentId: number,
        childId: number,
        oldParentId: number
    ) => void;
    path: number[];
};

const ChildTag: React.FC<IChildTagProps> = ({
    tag,
    constructTagElements,
    deleteTag,
    renameTag,
    createChild,
    addChildToTag,
    path,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isEditing = useRecoilValue(isEditingState);

    const [, drag, preview] = useDrag(() => ({
        type: "tag",
        item: { tag, path },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [dropProps, drop] = useDrop<
        { tag: ITag; path: number[] },
        unknown,
        { isOver: boolean }
    >(() => ({
        accept: "tag",
        canDrop: (item) => {
            if (path.includes(item.tag._id)) {
                return false;
            }

            if (compareArr(path, item.path)) {
                if (tag.children?.includes(item.tag._id)) {
                    return false;
                }

                return tag._id !== item.tag._id;
            }

            if (item.path[item.path.length - 1] === path[path.length - 1]) {
                return false;
            }

            if (tag.children?.includes(item.tag._id)) {
                const parentPath = [...item.path];
                parentPath.pop();

                if (compareArr(path, parentPath)) {
                    return true;
                    //return item.path[item.path.length - 1] !== tag._id;
                }

                return false;
            }

            return tag._id !== item.tag._id;
        },
        drop: (item) => {
            addChildToTag(
                tag._id,
                item.tag._id,
                item.path[item.path.length - 1]
            );
        },
        hover: (item, monitor) => {
            if (!isOpen && monitor.canDrop()) {
                setIsOpen(true);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const tagButtons = isEditing ? (
        <div className="tag-buttons">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    deleteTag(tag._id);
                }}
                type="button"
                className="tag-btn tag-delete-btn"
            >
                <MdDelete />
            </button>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    renameTag(tag._id);
                }}
                type="button"
                className="tag-btn tag-edit-btn"
            >
                <MdEdit />
            </button>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    createChild(tag._id);
                }}
                type="button"
                className="tag-btn tag-add-btn"
            >
                <MdAdd />
            </button>

            <div ref={drag} className="tag-btn tag-drag-btn">
                <MdMoreVert />
            </div>
        </div>
    ) : null;

    return (
        <div className="tag-container">
            {tag.children?.length ? (
                <>
                    <div
                        ref={drop}
                        className={`tag-wrapper tag-details ${
                            isOpen ? "open" : ""
                        } ${dropProps.isOver ? "hovered" : ""}`}
                    >
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="tag-title tag-title_summary"
                        >
                            <MdChevronRight className="tag-dropdown-icon" />
                            <p className="tag-title_text">{tag.name}</p>
                        </button>

                        {tagButtons}
                    </div>
                </>
            ) : (
                <div
                    className={`tag-wrapper tag-title ${
                        dropProps.isOver ? "hovered" : ""
                    }`}
                    ref={drop}
                >
                    <p className="tag-title_text">{tag.name}</p>

                    {tagButtons}
                </div>
            )}

            {isOpen && tag.children ? (
                <ul className="sidebar-text focusable">
                    {constructTagElements(tag.children, [...path, tag._id])}
                </ul>
            ) : null}
        </div>
    );
};

type IEditTagDialogForm = {
    name: string;
    synonyms: { id: string; value: string }[];
};

const editTagDialogFormDefaultValues: Nullable<IEditTagDialogForm> = {
    name: null,
    synonyms: [],
};

type IEditTagDialogProps = {
    isOpen: boolean;
    mode?: "create" | "edit";
    setIsOpen: (val: boolean) => void;
    defaultValues?: Partial<Nullable<IEditTagDialogForm>>;
    onSubmit: (data: IEditTagDialogForm) => boolean | Promise<boolean>;
};

const EditTagDialog: React.FC<IEditTagDialogProps> = ({
    isOpen,
    defaultValues,
    onSubmit,
    setIsOpen,
    mode,
}) => {
    const { handleSubmit, control, reset, watch } = useForm<
        Nullable<IEditTagDialogForm>
    >({
        defaultValues: { ...editTagDialogFormDefaultValues, ...defaultValues },
    });

    useEffect(() => {
        reset({ ...editTagDialogFormDefaultValues, ...defaultValues });
    }, [isOpen, reset, defaultValues]);

    const submitCallback = handleSubmit(async (data) => {
        await onSubmit(data as IEditTagDialogForm);
        setIsOpen(false);
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "synonyms",
    });
    const watchSynonyms = watch("synonyms");
    const controlledSynonyms = fields.map((field, index) => {
        return {
            ...field,
            ...watchSynonyms?.[index],
        };
    });

    return (
        <Dialog
            visible={isOpen}
            title={mode === "create" ? "Create tag" : "Edit tag"}
            buttons={[
                {
                    title: mode === "create" ? "Create" : "Save",
                    callback: () => {
                        submitCallback();
                    },
                },
                {
                    title: "Cancel",
                    callback: () => {
                        setIsOpen(false);
                    },
                },
            ]}
        >
            <form id="editTag" onSubmit={submitCallback} noValidate>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <div>
                            <label
                                className="input-label"
                                htmlFor={`editTag.${field.name}`}
                            >
                                Name:
                            </label>
                            <input
                                className="input-field_text"
                                type="text"
                                id={`editTag.${field.name}`}
                                name={field.name}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                            />
                        </div>
                    )}
                    rules={{ required: true }}
                />

                <div className="input-group">
                    <label className="input-label">Synonyms:</label>

                    <div className="input-synonym-group">
                        {controlledSynonyms.map((item, i) => (
                            <Controller
                                key={item.id}
                                name={`synonyms.${i}`}
                                control={control}
                                render={({ field }) => {
                                    if (!field.value) return <></>;

                                    return (
                                        <div className="input-synonym">
                                            <input
                                                className="input-field_text"
                                                type="text"
                                                id={`editTag.${field.name}`}
                                                name={field.name}
                                                value={field.value.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange({
                                                        id: field.value.id,
                                                        value: e.target.value,
                                                    })
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={() => remove(i)}
                                                className="input-btn input-btn--square"
                                            >
                                                <MdRemove />
                                            </button>
                                        </div>
                                    );
                                }}
                                rules={{ required: true }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    className="input-btn input-group_primary-btn input-btn--square"
                    onClick={() => append({ id: getUniqueId(), value: "" })}
                >
                    <MdAdd />
                </button>

                <p className="edit-dialog_note">
                    Note: A tag should have at least one synonym, which should
                    be the same as its name.
                </p>
            </form>
        </Dialog>
    );
};

function Tags() {
    const [isSignedIn, setIsSignedIn] = useRecoilState(isSignedInState);
    const [isEditing, setIsEditing] = useRecoilState(isEditingState);
    const navigate = useNavigate();

    // Dialogs
    const [savingDialog, setSavingDialog] = useState<
        { buttons?: { title?: string; callback?: () => void }[] } | undefined
    >(undefined);

    const [toggleEditingDialog, setToggleEditingDialog] = useState<
        { buttons?: { title?: string; callback?: () => void }[] } | undefined
    >(undefined);

    const [deleteTagDialog, setDeleteTagDialog] = useState<{
        visible: boolean;
        data?: { id: number; parentId?: number };
    }>({ visible: false });

    const [editTagDialog, setEditTagDialog] = useState<{
        visible: boolean;
        defaultValues?: Partial<Nullable<IEditTagDialogForm>>;
        data?: { id: number; mode: "create" | "edit" };
    }>({ visible: false });

    // Tags
    const [tags, setTags] = useState<ITags>({
        synonyms: undefined,
        definitions: undefined,
    });
    const [tagStructure, setTagStructure] = useState(tags);
    const [editActions, setEditActions] = useState<
        (
            | {
                  type: "create";
                  data: {
                      id: number;
                      parentId: number;
                      name: string;
                      synonyms: string[];
                  };
              }
            | {
                  type: "edit";
                  data: {
                      id: number;
                      name: string;
                      synonyms: string[];
                  };
              }
            | {
                  type: "move";
                  data: {
                      childId: number;
                      newParentId: number;
                      oldParentId?: number;
                      placeBeforeTagId?: number;
                  };
              }
            | {
                  type: "delete";
                  data: {
                      id: number;
                      parentId: number;
                      keepChildren?: boolean;
                  };
              }
        )[]
    >([]);
    const [isLoadingTags, setIsLoadingTags] = useState(true);

    useEffect(() => {
        (async () => {
            const thisIsSignedIn = isSignedIn || (await checkIsSignedIn());

            if (thisIsSignedIn !== isSignedIn) {
                setIsSignedIn(thisIsSignedIn);
            }

            if (!thisIsSignedIn) {
                navigate(`${BASE_URL}login`);
            }
        })();
    }, [isSignedIn, navigate, setIsSignedIn]);

    // Tag structure
    useEffect(() => {
        setEditActions([]);
        setTagStructure(tags);
    }, [tags]);

    const fetchTags = useCallback(async () => {
        setIsLoadingTags(true);

        // Get signed in state
        checkIsSignedIn().then((data) => {
            setIsSignedIn(data);
        });

        // Get tags
        await fetch(`${ENDPOINT}/api/app/1/tags?include=synonyms`)
            .then((e) => e.json())
            .then((data) => {
                setTags(data);
            })
            .catch((e) => {
                console.error(`Failed to fetch due to error: ${e}`);
            });

        setIsLoadingTags(false);
    }, [setIsSignedIn]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const addChildToTag = useCallback(
        (
            newParentId: number,
            childId: number,
            oldParentId?: number,
            placeBeforeTagId?: number
        ) => {
            setTagStructure((oldState) => {
                const newState = {
                    definitions: { ...oldState.definitions },
                    synonyms: oldState.synonyms,
                };

                // Remove from old parent
                if (oldParentId) {
                    newState.definitions[oldParentId] = {
                        ...newState.definitions[oldParentId],
                    };

                    const oldParent = newState.definitions[oldParentId];

                    const childIndex =
                        oldParent.children?.findIndex(
                            (child) => child === childId
                        ) ?? -1;
                    if (childIndex === -1) {
                        console.error(
                            `Tag ${childId} not found in ${oldParentId}`
                        );
                        return oldState;
                    }

                    oldParent.children = [...(oldParent.children ?? [])];
                    oldParent.children.splice(childIndex, 1);
                }

                // Add to new parent
                newState.definitions[newParentId] = {
                    ...newState.definitions[newParentId],
                };

                const newParent = newState.definitions[newParentId];
                newParent.children = [...(newParent.children ?? [])];

                if (placeBeforeTagId !== undefined) {
                    const placeBeforeTagIndex =
                        newParent.children?.findIndex(
                            (child) => child === placeBeforeTagId
                        ) ?? -1;
                    newParent.children.splice(placeBeforeTagIndex, 0, childId);
                } else {
                    newParent.children.push(childId);
                }

                return newState;
            });

            setEditActions((oldEditActions) => {
                const newEditActions = [...oldEditActions];

                newEditActions.push({
                    type: "move",
                    data: {
                        childId,
                        oldParentId,
                        newParentId,
                        placeBeforeTagId,
                    },
                });

                return newEditActions;
            });
        },
        []
    );

    const constructTagElements = useCallback(
        (children: number[], path: number[]) => {
            const definitions = tagStructure.definitions;
            if (!definitions) return null;

            const parentId = path[path.length - 1];

            return (
                <>
                    {children?.map((child) => {
                        const tag = definitions[child];
                        if (!tag) return null;
                        return (
                            <li key={tag._id}>
                                {isEditing ? (
                                    <Droppoint
                                        path={path}
                                        parentTag={definitions[parentId]}
                                        addChildToTag={(
                                            childId,
                                            oldParentId
                                        ) => {
                                            addChildToTag(
                                                parentId,
                                                childId,
                                                oldParentId,
                                                tag._id
                                            );
                                        }}
                                    />
                                ) : null}

                                <ChildTag
                                    path={path}
                                    constructTagElements={constructTagElements}
                                    deleteTag={(id) => {
                                        setDeleteTagDialog({
                                            data: { id, parentId },
                                            visible: true,
                                        });
                                    }}
                                    renameTag={(id) => {
                                        setEditTagDialog({
                                            data: { id, mode: "edit" },
                                            visible: true,
                                            defaultValues: {
                                                name: tag.name,
                                                synonyms:
                                                    tag.synonyms?.map(
                                                        (synonym, i) => ({
                                                            id: i.toString(),
                                                            value: synonym,
                                                        })
                                                    ) ?? [],
                                            },
                                        });
                                    }}
                                    createChild={(id) => {
                                        setEditTagDialog({
                                            data: { id, mode: "create" },
                                            visible: true,
                                            defaultValues: { name: null },
                                        });
                                    }}
                                    addChildToTag={addChildToTag}
                                    tag={tag}
                                />
                            </li>
                        );
                    })}
                </>
            );
        },
        [tagStructure.definitions, isEditing, addChildToTag]
    );

    const tagListElements = useMemo(() => {
        const definitions = tagStructure.definitions;
        if (!definitions) return [];

        return constructTagElements(
            definitions[TOP_TAG_PARENT_ID].children ?? [],
            [TOP_TAG_PARENT_ID]
        );
    }, [tagStructure, constructTagElements]);

    /// Controls
    async function saveEdits() {
        const authToken = getCookie("hsse_token");

        await fetch(`${ENDPOINT}/api/app/1/tags`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ actions: editActions }),
        });

        await fetchTags();

        return true;
    }

    function hasUnsavedChanges() {
        return editActions.length !== 0;
    }

    /**
     * Delets a tag
     * @param id ID of tag to delete
     * @param parentId ID of parent tag. TOP_TAG_PARENT_ID for no parent.
     * @param keepChildren Whether or not to move the children of the tag up to the parent tag
     */
    function deleteTag(id: number, parentId: number, keepChildren: boolean) {
        setTagStructure((oldState) => {
            const newState = {
                definitions: { ...oldState.definitions },
                synonyms: oldState.synonyms,
            };

            newState.definitions[parentId] = {
                ...newState.definitions?.[parentId],
            };
            const parent = newState.definitions[parentId];

            const childIndex =
                parent.children?.findIndex((child) => child === id) ?? -1;
            if (childIndex !== -1) {
                parent.children = [...(parent.children ?? [])];
                parent.children?.splice(
                    childIndex,
                    1,
                    ...(keepChildren
                        ? newState.definitions?.[id as number].children ?? []
                        : [])
                );
            }

            return newState;
        });

        setEditActions((oldEditActions) => {
            const newEditActions = [...oldEditActions];

            newEditActions.push({
                type: "delete",
                data: {
                    id,
                    parentId,
                    keepChildren,
                },
            });

            return newEditActions;
        });
    }

    function trySaveEdits() {
        setSavingDialog({
            buttons: [
                {
                    title: "Save",
                    callback: async () => {
                        if (!(await saveEdits())) return;
                        setSavingDialog(undefined);
                    },
                },
                {
                    title: "Cancel",
                    callback: () => {
                        setSavingDialog(undefined);
                    },
                },
            ],
        });
    }

    async function tryToggleEditing() {
        if (isEditing && hasUnsavedChanges()) {
            setToggleEditingDialog({
                buttons: [
                    {
                        title: "Save & continue",
                        callback: async () => {
                            if (!(await saveEdits())) return;
                            setIsEditing(!isEditing);
                            setToggleEditingDialog(undefined);
                        },
                    },
                    {
                        title: "Continue without saving",
                        callback: () => {
                            setIsEditing(!isEditing);
                            setToggleEditingDialog(undefined);
                        },
                    },
                    {
                        title: "Cancel",
                        callback: () => {
                            setToggleEditingDialog(undefined);
                        },
                    },
                ],
            });
        } else {
            setIsEditing(!isEditing);
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <Layout
                className="tags-page"
                title="Homestuck Search Engine | Tags"
            >
                <h1>Tag Hierarchy</h1>
                <div className="tags-wrapper">
                    {isLoadingTags ? (
                        <>
                            <p>Loading tags...</p>
                        </>
                    ) : null}

                    <ul
                        className="sidebar-text focusable"
                        style={isLoadingTags ? { display: "none" } : undefined}
                    >
                        {tagListElements}
                    </ul>
                </div>
                <div className="controls-wrapper">
                    <div></div>
                    <div>
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className="control-btn control-save"
                                    data-testid="controls-save-btn"
                                    onClick={() => {
                                        setEditTagDialog({
                                            visible: true,
                                            data: {
                                                mode: "create",
                                                id: TOP_TAG_PARENT_ID,
                                            },
                                            defaultValues: { name: null },
                                        });
                                    }}
                                >
                                    <MdAdd />
                                </button>

                                <button
                                    type="button"
                                    className="control-btn control-save"
                                    data-testid="controls-save-btn"
                                    onClick={() => {
                                        trySaveEdits();
                                    }}
                                >
                                    <MdSave />
                                </button>
                            </>
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
                    </div>
                </div>

                <CustomDragLayer />

                <Dialog
                    visible={!!savingDialog}
                    buttons={savingDialog?.buttons}
                    title="Are you sure?"
                >
                    <p>
                        Your changes will take effect immediately after saving.
                        This action is irreversible.
                    </p>
                </Dialog>

                <Dialog
                    visible={!!toggleEditingDialog}
                    buttons={toggleEditingDialog?.buttons}
                    title="Unsaved changes"
                >
                    <p>
                        You have unsaved changes. If you do not save, you will
                        lose them.
                    </p>
                    <p>
                        WARNING: If you save, your changes will take effect
                        immediately. This action is irreversible.
                    </p>
                </Dialog>

                <Dialog
                    visible={deleteTagDialog.visible}
                    buttons={[
                        {
                            title: "Delete all",
                            callback: () => {
                                deleteTag(
                                    deleteTagDialog.data?.id as number,
                                    deleteTagDialog.data?.parentId ??
                                        TOP_TAG_PARENT_ID,
                                    false
                                );

                                setDeleteTagDialog({ visible: false });
                            },
                        },
                        {
                            title: "Delete and move children up",
                            callback: () => {
                                deleteTag(
                                    deleteTagDialog.data?.id as number,
                                    deleteTagDialog.data?.parentId ??
                                        TOP_TAG_PARENT_ID,
                                    true
                                );
                                setDeleteTagDialog({ visible: false });
                            },
                        },
                        {
                            title: "Cancel",
                            callback: () => {
                                setDeleteTagDialog({ visible: false });
                            },
                        },
                    ]}
                    title="Are you sure?"
                >
                    <p>
                        You are about to delete this tag and any children it may
                        have. Alternatively, you may want to delete only this
                        tag and move its children up to its current position.
                    </p>
                </Dialog>

                <EditTagDialog
                    isOpen={!!editTagDialog?.visible}
                    defaultValues={editTagDialog?.defaultValues}
                    mode={editTagDialog.data?.mode}
                    onSubmit={(data) => {
                        const editTagDialogData = { ...editTagDialog?.data };
                        /**
                         * Only used if mode = "create"
                         */
                        const newId = new Date().getTime();

                        setTagStructure((oldState) => {
                            const newState = {
                                definitions: { ...oldState.definitions },
                                synonyms: oldState.synonyms,
                            };

                            if (editTagDialogData.mode === "create") {
                                newState.definitions[newId] = {
                                    _id: newId,
                                    name: data.name,
                                    children: [],
                                    synonyms: data.synonyms.map(
                                        (synonym) => synonym.value
                                    ),
                                };

                                newState.definitions[
                                    editTagDialogData.id as number
                                ] = {
                                    ...newState.definitions[
                                        editTagDialogData.id as number
                                    ],
                                };

                                newState.definitions[
                                    editTagDialogData.id as number
                                ].children = [
                                    ...(newState.definitions[
                                        editTagDialogData.id as number
                                    ].children ?? []),
                                    newId,
                                ];
                            } else {
                                newState.definitions[
                                    editTagDialogData.id as number
                                ] = {
                                    _id: editTagDialogData.id as number,
                                    children:
                                        newState.definitions[
                                            editTagDialogData.id as number
                                        ].children,
                                    name: data.name,
                                    synonyms: data.synonyms.map(
                                        (synonym) => synonym.value
                                    ),
                                };
                            }

                            return newState;
                        });

                        setEditActions((oldEditActions) => {
                            const newEditActions = [...oldEditActions];

                            if (editTagDialogData.mode === "create") {
                                newEditActions.push({
                                    type: "create",
                                    data: {
                                        id: newId,
                                        parentId:
                                            editTagDialogData.id as number,
                                        name: data.name,
                                        synonyms: data.synonyms.map(
                                            (synonym) => synonym.value
                                        ),
                                    },
                                });
                            } else {
                                newEditActions.push({
                                    type: "edit",
                                    data: {
                                        id: editTagDialogData.id as number,
                                        name: data.name,
                                        synonyms: data.synonyms.map(
                                            (synonym) => synonym.value
                                        ),
                                    },
                                });
                            }

                            return newEditActions;
                        });

                        return true;
                    }}
                    setIsOpen={() => setEditTagDialog({ visible: false })}
                />
            </Layout>
        </DndProvider>
    );
}

export default Tags;
