import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { checkIsSignedIn, getCookie } from "helpers/utility";
import Layout from "components/Layout";
import { ITag, ITags } from "types";
import {
    MdAdd,
    MdChevronRight,
    MdDelete,
    MdEdit,
    MdSave,
    MdMoreVert,
} from "react-icons/md";
import "./index.scss";
import Dialog from "components/Dialog";
import { useForm, Controller } from "react-hook-form";
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

type IChildTagProps = {
    tag: ITag;
    constructTagElements: (
        val: number[],
        parentId?: number
    ) => (JSX.Element | null)[] | undefined;
    deleteTag: (id: number) => void;
    renameTag: (id: number) => void;
    addChildToTag: (id: number) => void;
};

const ChildTag: React.FC<IChildTagProps> = ({
    tag,
    constructTagElements,
    deleteTag,
    renameTag,
    addChildToTag,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isEditing = useRecoilValue(isEditingState);

    const [, drag, preview] = useDrag(() => ({
        type: "tag",
        item: { tag },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

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

                    addChildToTag(tag._id);
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
        <li>
            {tag.children?.length ? (
                <>
                    <div
                        className={`tag-wrapper tag-details ${
                            isOpen ? "open" : ""
                        }`}
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
                <div className="tag-wrapper tag-title">
                    <p className="tag-title_text">{tag.name}</p>

                    {tagButtons}
                </div>
            )}

            {isOpen && tag.children ? (
                <ul className="sidebar-text focusable">
                    {constructTagElements(tag.children, tag._id)}
                </ul>
            ) : null}
        </li>
    );
};

type IEditTagDialogForm = {
    name: string;
};

const editTagDialogFormDefaultValues = { name: null };

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
    const { handleSubmit, control, reset } = useForm<
        Nullable<IEditTagDialogForm>
    >({
        defaultValues: { ...editTagDialogFormDefaultValues, ...defaultValues },
    });

    useEffect(() => {
        reset({ ...editTagDialogFormDefaultValues, ...defaultValues });
    }, [isOpen, reset, isOpen]);

    const submitCallback = handleSubmit(async (data) => {
        await onSubmit(data as IEditTagDialogForm);
        setIsOpen(false);
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
                  data: { id: number; parentId: number; name: string };
              }
            | {
                  type: "edit";
                  data: { id: number; name: string };
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
                navigate(BASE_URL);
            }
        })();
    }, [isSignedIn]);

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
        await fetch(`${ENDPOINT}/api/app/1/tags`)
            .then((e) => e.json())
            .then((data) => {
                setTags(data);
            })
            .catch((e) => {
                console.error(`Failed to fetch due to error: ${e}`);
            });

        setIsLoadingTags(false);
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const constructTagElements = useCallback(
        (children: number[], parentId?: number) => {
            if (!tagStructure.definitions) return;

            return children?.map((child) => {
                const tag = tagStructure.definitions?.[child];
                if (!tag) return null;
                return (
                    <ChildTag
                        constructTagElements={constructTagElements}
                        deleteTag={(id) =>
                            setDeleteTagDialog({
                                data: { id, parentId },
                                visible: true,
                            })
                        }
                        renameTag={(id) =>
                            setEditTagDialog({
                                data: { id, mode: "edit" },
                                visible: true,
                                defaultValues: { name: tag.name },
                            })
                        }
                        addChildToTag={(id) =>
                            setEditTagDialog({
                                data: { id, mode: "create" },
                                visible: true,
                                defaultValues: { name: null },
                            })
                        }
                        key={tag._id}
                        tag={tag}
                    />
                );
            });
        },
        [tagStructure.definitions]
    );

    const tagListElements = useMemo(() => {
        const definitions = tagStructure.definitions;
        if (!definitions) return [];

        return constructTagElements(definitions[-1].children ?? []);
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
     * @param parentId ID of parent tag. -1 for no parent.
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

            const childIndex = parent.children?.findIndex(
                (child) => child === id
            );
            if (childIndex !== undefined) {
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
                                            data: { mode: "create", id: -1 },
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
                        Deleting a tag will result in it being deleted on all
                        assets. THIS IS IRREVERSIBLE.
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
                        immediately. Deleting a tag will result in it being
                        deleted on all assets. THIS IS IRREVERSIBLE.
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
                                    deleteTagDialog.data?.parentId ?? -1,
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
                                    deleteTagDialog.data?.parentId ?? -1,
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
                    <p>
                        Be careful when deleting tags, as the removal of a tag
                        will also result in its removal from all assets. This
                        takes place upon saving.
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
                                    ...newState.definitions[
                                        editTagDialogData.id as number
                                    ],
                                };

                                newState.definitions[
                                    editTagDialogData.id as number
                                ].name = data.name;
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
                                    },
                                });
                            } else {
                                newEditActions.push({
                                    type: "edit",
                                    data: {
                                        id: editTagDialogData.id as number,
                                        name: data.name,
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
