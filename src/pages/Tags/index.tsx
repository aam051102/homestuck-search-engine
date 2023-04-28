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
    constructTagElements: (val: number[]) => (JSX.Element | null)[] | undefined;
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
                        {/* TODO: Move tagButtons out of button element */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="tag-title tag-title_summary"
                        >
                            <MdChevronRight className="tag-dropdown-icon" />
                            <p className="tag-title_text">{tag.name}</p>

                            {tagButtons}
                        </button>
                    </div>

                    {isOpen ? (
                        <ul className="sidebar-text focusable">
                            {constructTagElements(tag.children)}
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

type IRenameTagDialogForm = {
    name: string;
};

type IRenameTagDialogProps = {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    defaultValues?: Nullable<IRenameTagDialogForm>;
    onSubmit: (data: IRenameTagDialogForm) => boolean | Promise<boolean>;
};

const RenameTagDialog: React.FC<IRenameTagDialogProps> = ({
    isOpen,
    defaultValues,
    onSubmit,
    setIsOpen,
}) => {
    const { handleSubmit, control, reset } = useForm<
        Nullable<IRenameTagDialogForm>
    >({
        defaultValues,
    });

    useEffect(() => {
        reset(defaultValues);
    }, [isOpen, reset]);

    return (
        <Dialog visible={isOpen} title="Rename tag">
            <form
                id="renameTag"
                onSubmit={handleSubmit(async (data) => {
                    await onSubmit(data as IRenameTagDialogForm);
                    setIsOpen(false);
                })}
                noValidate
            >
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            id={`renameTag.${field.name}`}
                            name={field.name}
                            value={field.value ?? undefined}
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                    )}
                    rules={{ required: true }}
                />

                <div className="dialog-button-wrapper">
                    <button className="dialog-btn" type="submit">
                        Save
                    </button>
                    <button
                        className="dialog-btn"
                        type="button"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
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
        (children: number[]) => {
            if (!tagStructure.definitions) return;

            return children?.map((child) => {
                const tag = tagStructure.definitions?.[child];
                if (!tag) return null;
                return (
                    <ChildTag
                        constructTagElements={constructTagElements}
                        deleteTag={tryDeleteTag}
                        renameTag={(id) =>
                            setRenameTagDialog({
                                data: { id },
                                visible: true,
                                defaultValues: { name: tag.name },
                            })
                        }
                        addChildToTag={(id) => setCreateTagDialog({ id })}
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

    const [deleteTagDialog, setDeleteTagDialog] = useState<
        { buttons?: { title?: string; callback?: () => void }[] } | undefined
    >(undefined);

    const [renameTagDialog, setRenameTagDialog] = useState<{
        visible: boolean;
        defaultValues?: Nullable<IRenameTagDialogForm>;
        data?: { id: number };
    }>({ visible: false });

    const [createTagDialog, setCreateTagDialog] = useState<
        { id: number } | undefined
    >(undefined);

    function deleteTag(id: number) {
        setTagStructure((oldState) => {
            const newState = {
                definitions: { ...oldState.definitions },
                synonyms: oldState.synonyms,
            };
            delete newState.definitions?.[id];
            return newState;
        });
    }

    function tryDeleteTag(id: number) {
        setDeleteTagDialog({
            buttons: [
                {
                    title: "Delete and move children up",
                    callback: async () => {
                        deleteTag(id);
                        setDeleteTagDialog(undefined);
                    },
                },
                {
                    title: "Delete everything",
                    callback: () => {
                        deleteTag(id);
                        setDeleteTagDialog(undefined);
                    },
                },
                {
                    title: "Cancel",
                    callback: () => {
                        setDeleteTagDialog(undefined);
                    },
                },
            ],
        });
    }

    async function saveEdits() {
        // TODO
        return true;
    }

    function hasUnsavedChanges() {
        // TODO
        return true;
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
                visible={!!deleteTagDialog}
                buttons={deleteTagDialog?.buttons}
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

            <RenameTagDialog
                isOpen={!!renameTagDialog?.visible}
                defaultValues={renameTagDialog?.defaultValues}
                onSubmit={(data) => {
                    setTagStructure((oldState) => {
                        const newState = {
                            definitions: { ...oldState.definitions },
                            synonyms: oldState.synonyms,
                        };

                        newState.definitions[
                            renameTagDialog?.data?.id as number
                        ].name = data.name;

                        /*const newId = new Date().getTime();

                        newState.definitions[newId] = {
                            _id: newId,
                            name: data.name,
                        };

                        newState.definitions[
                            renameTagDialog?.data.id as number
                        ].children?.push(0);*/

                        return newState;
                    });

                    return true;
                }}
                setIsOpen={() => setRenameTagDialog({ visible: false })}
            />

            <Dialog visible={!!createTagDialog} title="Create tag">
                {createTagDialog ? (
                    <form>
                        <p>
                            You are about to add a tag as a child of{" "}
                            {
                                tagStructure.definitions?.[createTagDialog.id]
                                    .name
                            }
                        </p>

                        <input type="text" />

                        <button type="button">Save</button>
                        <button type="button">Cancel</button>
                    </form>
                ) : null}
            </Dialog>
        </Layout>
    );
}

export default Tags;
