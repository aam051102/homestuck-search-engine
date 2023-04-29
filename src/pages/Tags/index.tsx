import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { checkIsSignedIn } from "helpers/utility";
import {
    setIsEditing,
    setIsSignedIn,
    useIsEditing,
    useIsSignedIn,
} from "helpers/globalState";
import Layout from "components/Layout";
import { ITag, ITags } from "types";
import {
    MdAdd,
    MdChevronRight,
    MdDelete,
    MdEdit,
    MdMoreVert,
    MdSave,
} from "react-icons/md";
import "./index.scss";
import Dialog from "components/Dialog";
import { useForm, Controller } from "react-hook-form";

type Nullable<T> = {
    [K in keyof T]: T[K] | null;
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
    const [isEditing] = useIsEditing();

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

            <div className="tag-btn tag-drag-btn">
                <MdMoreVert />
            </div>
        </div>
    ) : null;

    return (
        <li>
            {tag.children?.length ? (
                <>
                    <div className={`tag-details ${isOpen ? "open" : ""}`}>
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

                    {isOpen ? (
                        <ul className="sidebar-text focusable">
                            {constructTagElements(tag.children, tag._id)}
                        </ul>
                    ) : null}
                </>
            ) : (
                <div className="tag-title">
                    <p className="tag-title_text">{tag.name}</p>

                    {tagButtons}
                </div>
            )}
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
    const [isSignedIn] = useIsSignedIn();
    const navigate = useNavigate();
    const [isEditing] = useIsEditing();

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
    const [tags, setTags] = useState<ITags>({
        synonyms: undefined,
        definitions: undefined,
    });
    const [tagStructure, setTagStructure] = useState(tags);

    useEffect(() => {
        setTagStructure(tags);
    }, [tags]);

    useEffect(() => {
        let ignore = false;

        // Get signed in state
        // Replace once new React feature is implemented. This async function is necessary for now.
        async function fetchData() {
            return await checkIsSignedIn();
        }
        fetchData().then((data) => {
            if (!ignore) {
                setIsSignedIn(data);
            }
        });

        // Get tags
        fetch(`${ENDPOINT}/api/app/1/tags`)
            .then((e) => e.json())
            .then((data) => {
                if (!ignore) {
                    setTags(data);
                }
            })
            .catch((e) => {
                console.error(`Failed to fetch due to error: ${e}`);
            });

        return () => {
            ignore = true;
        };
    }, []);

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

        // Find top-level tags
        const topTags: Record<number, ITag> = {};
        const childrenTags: Record<string, boolean> = {};

        Object.keys(definitions).forEach((tag) => {
            const parsedTag = parseInt(tag);

            if (!childrenTags[parsedTag]) {
                topTags[parsedTag] = definitions[parsedTag];
            }

            definitions[parsedTag].children?.forEach((child) => {
                delete topTags[child];

                childrenTags[child] = true;
            });
        });

        return constructTagElements(
            Object.keys(topTags).map((p) => parseInt(p))
        );
    }, [tagStructure, constructTagElements]);

    // Controls
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
        data?: { id?: number; mode: "create" | "edit" };
    }>({ visible: false });

    async function saveEdits() {
        // TODO
        return true;
    }

    function hasUnsavedChanges() {
        // TODO
        return true;
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

            if (parentId !== -1) {
                newState.definitions[parentId] = {
                    ...newState.definitions?.[parentId],
                };
                const parent = newState.definitions[parentId];

                const childIndex = parent.children?.findIndex(
                    (child) => child === id
                );
                if (childIndex !== undefined) {
                    parent.children = [...(parent.children ?? [])];
                    parent.children?.splice(childIndex, 1);

                    if (keepChildren) {
                        parent.children?.push(
                            ...(newState.definitions?.[id as number].children ??
                                [])
                        );
                    }
                }
            } else {
                if (keepChildren) {
                    const children = newState.definitions[id].children ?? [];

                    for (let i = 0; i < children.length; i++) {
                        delete newState.definitions[children[i]];
                    }
                }

                delete newState.definitions[id];
            }

            // TODO: Figure out whether or not to delete definition.
            /*delete newState.definitions?.[
                deleteTagDialog.data?.id as number
            ];*/

            return newState;
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
        <Layout className="tags-page" title="Homestuck Search Engine | Tags">
            <h1>Tag Hierarchy</h1>
            <div className="tags-wrapper">
                <ul className="sidebar-text focusable">{tagListElements}</ul>
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
                                        data: { mode: "create" },
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
                    You have unsaved changes. If you do not save, you will lose
                    them.
                </p>
                <p>
                    WARNING: If you save, your changes will take effect
                    immediately. Deleting a tag will result in it being deleted
                    on all assets. THIS IS IRREVERSIBLE.
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
                    have. Alternatively, you may want to delete only this tag
                    and move its children up to its current position.
                </p>
                <p>
                    Be careful when deleting tags, as the removal of a tag will
                    also result in its removal from all assets. This takes place
                    upon saving.
                </p>
            </Dialog>

            <EditTagDialog
                isOpen={!!editTagDialog?.visible}
                defaultValues={editTagDialog?.defaultValues}
                mode={editTagDialog.data?.mode}
                onSubmit={(data) => {
                    const editTagDialogData = { ...editTagDialog?.data };

                    setTagStructure((oldState) => {
                        const newState = {
                            definitions: { ...oldState.definitions },
                            synonyms: oldState.synonyms,
                        };

                        if (editTagDialogData.mode === "create") {
                            const newId = new Date().getTime();

                            newState.definitions[newId] = {
                                _id: newId,
                                name: data.name,
                            };

                            if (editTagDialogData.id) {
                                newState.definitions[editTagDialogData.id] = {
                                    ...newState.definitions[
                                        editTagDialogData.id
                                    ],
                                };

                                newState.definitions[
                                    editTagDialogData.id
                                ].children = [
                                    ...(newState.definitions[
                                        editTagDialogData.id
                                    ].children ?? []),
                                    newId,
                                ];
                            }
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

                    return true;
                }}
                setIsOpen={() => setEditTagDialog({ visible: false })}
            />
        </Layout>
    );
}

export default Tags;
