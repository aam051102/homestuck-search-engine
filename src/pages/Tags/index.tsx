import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { checkIsSignedIn, createTagStructure } from "helpers/utility";
import { setIsSignedIn, useIsSignedIn } from "helpers/globalState";
import Layout from "components/Layout";
import { ITagStructure, ITags } from "types";
import {
    MdAdd,
    MdChevronRight,
    MdDelete,
    MdEdit,
    MdMoreVert,
    MdSave,
} from "react-icons/md";
import "./index.scss";

function Tags() {
    const [isSignedIn] = useIsSignedIn();
    const navigate = useNavigate();

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
    const [tagStructure, setTagStructure] = useState<ITagStructure[]>([]);

    useEffect(() => {
        setTagStructure(createTagStructure(tags));
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

    const constructTagElements = (children: ITagStructure[]) => {
        return children?.map((child) => {
            const tag = tags.definitions?.[child.id];

            if (!tag) return null;

            const tagButtons = (
                <div className="tag-buttons">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // TODO: Delete with warning. Options: delete *, delete and move children up, cancel.
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
            );

            return (
                <li key={tag._id}>
                    {tag.children?.length ? (
                        <details className="tag-details">
                            <summary className="tag-title tag-title_summary">
                                <MdChevronRight className="tag-dropdown-icon" />
                                <p className="tag-title_text">{tag.name}</p>

                                {tagButtons}
                            </summary>

                            <ul className="sidebar-text focusable">
                                {constructTagElements(child.children)}
                            </ul>
                        </details>
                    ) : (
                        <div className="tag-title">
                            <p className="tag-title_text">{tag.name}</p>

                            {tagButtons}

                            {/* TODO: Add button to grab and button to rename both here and in details. Also add delete button with warning. How to add new? Use YX Org list add placements */}
                        </div>
                    )}
                </li>
            );
        });
    };

    const tagListElements = useMemo(
        () => (tags.definitions ? constructTagElements(tagStructure) : null),
        [tags.definitions, tagStructure]
    );

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
                            // TODO
                        }}
                    >
                        <MdSave />
                    </button>

                    <button
                        type="button"
                        className="control-btn control-edit"
                        data-testid="controls-edit-btn"
                        onClick={() => {
                            // TODO
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
