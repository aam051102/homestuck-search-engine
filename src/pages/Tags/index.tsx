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

type IChildTagProps = {
    tag: ITag;
    constructTagElements: (val: number[]) => (JSX.Element | null)[] | undefined;
    setTagStructure: React.Dispatch<React.SetStateAction<ITags>>;
};

const ChildTag: React.FC<IChildTagProps> = ({
    tag,
    constructTagElements,
    setTagStructure,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing] = useIsEditing();

    {
        /* TODO: Add new. Use YX org list add locations. */
    }

    const tagButtons = isEditing ? (
        <div className="tag-buttons">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // TODO: Delete with warning. Options: delete *, delete and move children up, cancel.
                    setTagStructure((oldState) => {
                        const newState = {
                            definitions: { ...oldState.definitions },
                            synonyms: oldState.synonyms,
                        };
                        delete newState.definitions?.[tag._id];
                        return newState;
                    });
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

                    // TODO: Rename
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

                    // TODO: Add child
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
                    <div className="tag-details">
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
                        setTagStructure={setTagStructure}
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

    return (
        <Layout className="tags-page" title="Homestuck Search Engine | Tags">
            <h1>Tag Hierarchy</h1>
            <div className="tags-wrapper">
                <ul className="sidebar-text focusable">{tagListElements}</ul>
            </div>
            <div className="controls-wrapper">
                <div></div>
                <div>
                    <button
                        type="button"
                        className="control-btn control-save"
                        data-testid="controls-save-btn"
                        onClick={() => {
                            // TODO: Warning about edits taking effect immediately. Are you sure?
                            setIsEditing(false);
                        }}
                    >
                        <MdSave />
                    </button>

                    <button
                        type="button"
                        className="control-btn control-edit"
                        data-testid="controls-edit-btn"
                        onClick={() => {
                            setIsEditing(!isEditing);
                        }}
                    >
                        <MdEdit />
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default Tags;
