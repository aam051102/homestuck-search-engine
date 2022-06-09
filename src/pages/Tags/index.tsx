import React, { useEffect, useMemo, useRef, useState } from "react";
import { setIsSignedIn } from "helpers/globalState";
import ENDPOINT from "helpers/endpoint";
import { checkIsSignedIn } from "helpers/utility";
import Layout from "components/Layout";
import { ITags, ITag, ITagStructure } from "types/index";
import { BsTriangleFill } from "react-icons/bs";

import "./index.scss";
import { MdDragHandle } from "react-icons/md";
import useEventListener from "hooks/useEventListener";

function Index() {
    /* Refs */
    const heldTagRef = useRef<HTMLElement>();

    /* States */
    const [tags, setTags] = useState<ITags>({
        definitions: undefined,
        synonyms: undefined,
    });

    // Tag structure
    const createTagStructure = () => {
        const definitions = tags.definitions;
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

        return createTagStructureRecursive(
            Object.keys(topTags).map((tag) => parseInt(tag))
        );
    };

    const createTagStructureRecursive = (tagList?: number[]) => {
        if (!tagList) return [];

        const tagStructure: ITagStructure[] = [];

        const definitions = tags.definitions;
        if (!definitions) return [];

        for (const tag of tagList) {
            tagStructure.push({
                id: tag,
                children: createTagStructureRecursive(
                    definitions[tag].children
                ),
            });
        }

        return tagStructure;
    };

    const tagStructure = useMemo(createTagStructure, [tags.definitions]);

    /* Functions */

    /* Efects */
    useEffect(() => {
        let ignore = false;

        // Get signed in state
        (async () => {
            const signedInRes = await checkIsSignedIn();

            if (!ignore) {
                setIsSignedIn(signedInRes);
            }
        })();

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

    /* Event listeners */
    useEventListener(
        "mousedown",
        (e) => {
            const target = (e.composedPath() as HTMLElement[]).find((el) =>
                el.classList.contains("tag-item")
            );

            if (target) {
                heldTagRef.current = target;
            }
        },
        document.body
    );

    useEventListener(
        "mousemove",
        (e) => {
            if (heldTagRef.current) {
                heldTagRef.current.style.transform = `translateY(${
                    e.clientY - heldTagRef.current.offsetTop
                }px)`;
            }
        },
        document.body
    );

    useEventListener(
        "mouseup",
        () => {
            if (heldTagRef.current) {
                // TODO: Actually move item in the list

                heldTagRef.current = undefined;
            }
        },
        document.body
    );

    /// DOM Construction
    const constructTagElements = (children: ITagStructure[]) => {
        return children?.map((child) => {
            const tag = tags.definitions?.[child.id];

            if (!tag) return null;

            const tagInner = (
                <>
                    <p>{tag.name}</p>
                    <MdDragHandle className="drag-handle-icon" />
                </>
            );

            return (
                <li key={tag._id} className="tag-item">
                    {tag.children?.length ? (
                        <details>
                            <summary className="tag-wrapper">
                                <BsTriangleFill className="drop-icon" />
                                {tagInner}
                            </summary>

                            <ul>{constructTagElements(child.children)}</ul>
                        </details>
                    ) : (
                        <div className="tag-wrapper">{tagInner}</div>
                    )}
                </li>
            );
        });
    };

    const tagListElements = useMemo(
        () => (tags.definitions ? constructTagElements(tagStructure) : null),
        [tags.definitions]
    );

    /* Return */
    return (
        <Layout
            className="tag-page"
            title="Tag Hierarchy | Homestuck Search Engine"
        >
            <div className="tag-list">
                <ul>{tagListElements}</ul>
            </div>

            <button className="save-btn" type="button">
                Save
            </button>
        </Layout>
    );
}

export default Index;
