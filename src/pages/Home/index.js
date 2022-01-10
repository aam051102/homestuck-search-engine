import React, { createRef, lazy, useEffect, useState } from "react";
import {
    MdArrowUpward,
    MdChevronLeft,
    MdChevronRight,
    MdFullscreen,
    MdSearch,
} from "react-icons/md";
import {
    useIsEditMode,
    setIsSignedIn,
    useIsSignedIn,
    useDialog,
    useResults,
    setResults,
    setEdits,
} from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import ENDPOINT from "helpers/endpoint";
import { checkIsSignedIn, focusElement, setIsEdited } from "helpers/utility";
import Controls from "components/Controls";
import Layout from "components/Layout";
import Sidebar from "components/Sidebar";
import StaticCanvas from "components/StaticCanvas";
import Dialog from "components/Dialog";
import parseSearchString from "helpers/parseSearchString";
import { useSearchParams } from "react-router-dom";

const Lightbox = lazy(() => import("components/Lightbox"));

import "./index.scss";

/**
 * Global counter for tag
 */
let tagKeyCounter = 0;

/**
 * Represents the home page.
 */
function HomePage() {
    /* States */
    const [tags, setTags] = useState([]);
    const [visibleResults, setVisibleResults] = useState(20);
    const [focused, setFocused] = useState(-1);
    const [resultTags, setResultTags] = useState({});

    const [results] = useResults();
    const [isSignedIn] = useIsSignedIn();
    const [isEditMode] = useIsEditMode();
    const [dialog] = useDialog();

    const searchRef = createRef();
    const visibleResultsRef = createRef();

    // URL parameters
    const [params, setParams] = useSearchParams();

    const query = params.get("query") ?? "";
    const page = parseInt(params.get("page"));
    const asset = parseInt(params.get("asset") ?? "-1");

    /* Functions */
    /**
     * Updates the list of all result tags to use following structure:
     *
     * ```
     * {
     *   name: {
     *     key: uniqueId,
     *     appearances: resultIndices.length,
     *     resultIndices: {
     *       resultId: uniqueId
     *     },
     *   }
     * }
     * ```
     */
    const restructureResultTags = async (data) => {
        const thisResultTags = {};
        const thisResultTagsIndices = {};

        // Process all results
        for (let i = 0; i < data.length; i++) {
            const result = data[i];

            for (let j = 0; j < result.tags.length; j++) {
                const tag = result.tags[j];

                // Ensure that tag entry exists
                let key = thisResultTagsIndices[tag];

                if (key === undefined) {
                    key = tagKeyCounter++;

                    // Create temporary index to improve speed
                    thisResultTagsIndices[tag] = key;

                    // Add tag
                    thisResultTags[key] = {
                        tag: tag,
                        appearances: 0,
                        resultIndices: {},
                    };
                }

                // Add one to tag entry
                thisResultTags[key].resultIndices[result._id] = j;
                thisResultTags[key].appearances++;
            }
        }

        setResultTags(thisResultTags);
    };

    const addTagToSearch = (tag) => {
        for (let i = searchRef.current.value.length - 1; i >= 0; i--) {
            if (searchRef.current.value[i] === ",") {
                break;
            } else if (searchRef.current.value[i] !== " ") {
                searchRef.current.value += ",";
                break;
            }
        }

        searchRef.current.value += tag;

        searchRef.current.scrollLeft = searchRef.current.scrollWidth;
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const setCurrentPage = (page) => {
        setParams({
            query: query,
            page: page,
        });
    };

    const loadPreviousPage = () => {
        if (page > 1) {
            setCurrentPage(page - 1);
            scrollToTop();
        }
    };

    const loadNextPage = () => {
        if (page < Math.ceil(results.length / visibleResults)) {
            setCurrentPage(page + 1);
            scrollToTop();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const searchTags = searchRef.current.value;

        // Update URL params
        setParams({
            query: searchTags,
            page: 1,
        });
    };

    /**
     * Saves tag changes to global state
     */
    function rememberLocalData() {
        const activeElement = document.activeElement;
        const tagKey = parseInt(activeElement.getAttribute("data-key"));

        setEdits((editsThis) => {
            const editsLocal = Object.assign({}, editsThis);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const resultId = result._id;

                if (!editsLocal[resultId]) {
                    editsLocal[resultId] = [];

                    for (let j = 0; j < result.tags.length; j++) {
                        let tag = result.tags[j];

                        editsLocal[resultId].push([tagKeyCounter++, tag]);
                    }
                }

                const tagIndex = resultTags[tagKey].resultIndices[resultId];
                if (tagIndex !== undefined)
                    editsLocal[resultId][tagIndex][1] = activeElement.value;
            }

            setIsEdited(true);
            return editsLocal;
        });
    }

    /* Efects */
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
                data.sort((a, b) => {
                    return a.position - b.position;
                });

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

    useEffect(() => {
        restructureResultTags(results);
    }, [results]);

    useEffect(() => {
        if (!query) return;

        // Perform search
        fetch(`${ENDPOINT}/api/app/1/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parseSearchString(query, tags)),
        })
            .then((e) => e.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                setResults(data);
            })
            .catch((e) => {
                console.error(`Failed to fetch due to error: ${e}`);
            });
    }, [query]);

    /* Event listeners */
    useEventListener(
        "keyup",
        (e) => {
            if (asset === -1 && e.target.classList.contains("tag-input")) {
                if (e.target.value.length === 0) {
                    e.target.classList.add("empty");
                } else {
                    e.target.classList.remove("empty");
                }

                rememberLocalData();
            }
        },
        document
    );

    useEventListener(
        "keydown",
        (e) => {
            if (isEditMode && e.target.classList.contains("tag-input")) {
                if (e.key === "Enter") {
                    // Add tag
                    const newIndex =
                        parseInt(
                            document.activeElement.getAttribute("data-index")
                        ) + 1;
                    const resultIndices = {};

                    setEdits((editsThis) => {
                        const editsLocal = Object.assign({}, editsThis);

                        for (const resultIndex in results) {
                            const result = results[resultIndex];
                            const resultId = result._id;

                            if (!editsLocal[resultId]) {
                                editsLocal[resultId] = [];

                                for (let j = 0; j < result.tags.length; j++) {
                                    editsLocal[resultId].push([
                                        tagKeyCounter++,
                                        result.tags[j],
                                    ]);
                                }
                            }

                            resultIndices[resultId] = result.tags.length;
                            editsLocal[resultId].splice(result.tags.length, 0, [
                                tagKeyCounter++,
                                "",
                            ]);
                        }

                        setIsEdited(true);
                        return editsLocal;
                    });

                    setResultTags((resultTagsThis) => {
                        const resultTagsLocal = Object.assign(
                            {},
                            resultTagsThis
                        );

                        resultTagsLocal[tagKeyCounter++] = {
                            tag: "",
                            appearances: results.length,
                            resultIndices: resultIndices,
                        };

                        setFocused(newIndex);
                        return resultTagsLocal;
                    });
                } else if (e.key === "ArrowUp") {
                    // Move up
                    e.preventDefault();

                    if (e.target.parentNode.previousSibling) {
                        focusElement(
                            e.target.parentNode.previousSibling.children[0]
                        );
                    }
                } else if (e.key === "ArrowDown") {
                    // Move down
                    e.preventDefault();

                    if (e.target.parentNode.nextSibling) {
                        focusElement(
                            e.target.parentNode.nextSibling.children[0]
                        );
                    }
                } else if (e.key === "Backspace") {
                    if (e.target.value.length === 0) {
                        e.preventDefault();

                        // Temporary
                        // TOOD: Improve speed.
                        if (Object.keys(resultTags).length > 1) {
                            const index = parseInt(
                                document.activeElement.getAttribute(
                                    "data-index"
                                )
                            );
                            const key =
                                document.activeElement.getAttribute("data-key");

                            setEdits((editsThis) => {
                                const editsLocal = Object.assign({}, editsThis);
                                const tagInfo = resultTags[key];

                                for (const resultId in tagInfo.resultIndices) {
                                    const resultIndex =
                                        tagInfo.resultIndices[resultId];

                                    if (!editsLocal[resultId]) {
                                        const result = results.find(
                                            (result) => result._id === resultId
                                        ); // Redo results structure to make this faster
                                        editsLocal[resultId] = [];

                                        for (
                                            let j = 0;
                                            j < result.tags.length;
                                            j++
                                        ) {
                                            editsLocal[resultId].push([
                                                tagKeyCounter++,
                                                result.tags[j],
                                            ]);
                                        }
                                    }

                                    editsLocal[resultId].splice(resultIndex, 1);
                                }

                                setIsEdited(true);
                                return editsLocal;
                            });

                            setResultTags((resultTagsThis) => {
                                const resultTagsLocal = Object.assign(
                                    {},
                                    resultTagsThis
                                );

                                delete resultTagsLocal[key];

                                focusElement(
                                    document.querySelector(
                                        `.tag-input[data-index="${
                                            index === 0 ? 0 : index - 1
                                        }"]`
                                    )
                                );
                                return resultTagsLocal;
                            });
                        }
                    }
                } else if (e.key === "Delete") {
                    const index = parseInt(e.target.getAttribute("data-index"));
                    const resultTagsLength = Object.keys(resultTags).length - 1;

                    if (resultTagsLength > index) {
                        const target = document.querySelector(
                            `.tag-input[data-index="${index + 1}"]`
                        );

                        if (target.value.length === 0) {
                            e.preventDefault();

                            // Remove tag
                            const key =
                                document.activeElement.getAttribute("data-key");

                            setEdits((editsThis) => {
                                const editsLocal = Object.assign({}, editsThis);
                                const tagInfo = resultTags[key];

                                for (const resultId in tagInfo.resultIndices) {
                                    const resultIndex =
                                        tagInfo.resultIndices[resultId];

                                    if (!editsLocal[resultId]) {
                                        const result = results.find(
                                            (result) => result._id === resultId
                                        ); // Redo results structure to make this faster
                                        editsLocal[resultId] = [];

                                        for (
                                            let j = 0;
                                            j < result.tags.length;
                                            j++
                                        ) {
                                            editsLocal[resultId].push([
                                                tagKeyCounter++,
                                                result.tags[j],
                                            ]);
                                        }
                                    }

                                    editsLocal[resultId].splice(resultIndex, 1);
                                }

                                setIsEdited(true);
                                return editsLocal;
                            });

                            setResultTags((resultTagsThis) => {
                                const resultTagsLocal = Object.assign(
                                    {},
                                    resultTagsThis
                                );

                                delete resultTagsLocal[key];

                                focusElement(
                                    document.querySelector(
                                        `.tag-input[data-index="${
                                            index >= resultTagsLength
                                                ? resultTagsLength - 1
                                                : index + 1
                                        }"]`
                                    )
                                );
                                return resultTagsLocal;
                            });
                        }
                    }
                }
            } else if (
                asset === -1 &&
                !e.target.classList.contains("tag-input")
            ) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();

                    loadPreviousPage();
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();

                    loadNextPage();
                }
            }
        },
        document
    );

    /// DOM Construction
    const constructPageLinksElements = () => {
        const elements = [];

        if (visibleResults > 0) {
            let pages = Math.ceil(results.length / visibleResults);
            let firstPage = page - 5;
            if (firstPage < 1) {
                firstPage = 1;
            }

            let lastPage = firstPage + 9;
            if (lastPage > pages) {
                lastPage = pages;
            }

            for (let i = firstPage; i <= lastPage; i++) {
                elements.push(
                    <button
                        className={page === i ? "current" : ""}
                        key={i}
                        onClick={(e) => {
                            // Update URL params
                            setCurrentPage(parseInt(e.target.innerText));

                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            });
                        }}
                    >
                        {i}
                    </button>
                );
            }
        }

        return elements;
    };

    const constructUsedTagsElements = () => {
        const elements = [];
        let index = 0;

        for (const key in resultTags) {
            const tagInfo = resultTags[key];

            elements.push(
                <li
                    className="sidebar-text-input"
                    key={key || index}
                    data-testid="used-tag-item"
                >
                    {isEditMode ? (
                        <input
                            className={`tag-input${
                                tagInfo.tag.length === 0 ? " empty" : ""
                            }`}
                            data-index={index}
                            data-key={key}
                            defaultValue={tagInfo.tag}
                            autoFocus={focused === index}
                        />
                    ) : (
                        tagInfo.tag
                    )}{" "}
                    ({tagInfo.appearances})
                </li>
            );

            index++;
        }

        return elements;
    };

    /* Return */
    return (
        <Layout className="home-page" title="Homestuck Search Engine">
            <nav className="page-nav">
                <ul>
                    <li
                        className={page > 1 ? "enabled" : ""}
                        onClick={loadPreviousPage}
                    >
                        <MdChevronLeft />
                    </li>

                    <li className="pages">{constructPageLinksElements()}</li>

                    <li
                        className={
                            page < Math.ceil(results.length / visibleResults)
                                ? "enabled"
                                : ""
                        }
                        onClick={loadNextPage}
                    >
                        <MdChevronRight />
                    </li>
                </ul>
            </nav>

            <form className="search-form" onSubmit={handleSubmit}>
                <label className="search-term-label" htmlFor="search-term">
                    Search
                </label>
                <div className="search-term-wrapper">
                    <input
                        ref={searchRef}
                        id="search-term"
                        className="search-input"
                        type="text"
                        autoComplete="off"
                        placeholder="Search (ex. 'john, act 1, dad')"
                        data-testid="search-field"
                        defaultValue={params.get("query") ?? ""}
                    />
                    <button
                        className="search-button"
                        aria-label="Search"
                        type="submit"
                        data-testid="search-button"
                    >
                        <MdSearch />
                    </button>
                </div>
            </form>

            <div className="results-info">
                <p className="total-results">Found {results.length} results</p>

                <div className="results-per-page">
                    <label htmlFor="results-input">Results per page:</label>
                    <div className="results-input-wrapper themed-input-wrapper">
                        <input
                            id="results-input"
                            className="results-input themed-input"
                            ref={visibleResultsRef}
                            type="number"
                            defaultValue={visibleResults}
                            min="1"
                            max="100"
                            onChange={() => {
                                if (visibleResultsRef.current.value < 1) {
                                    visibleResultsRef.current.value = 1;
                                } else if (
                                    visibleResultsRef.current.value > 100
                                ) {
                                    visibleResultsRef.current.value = 100;
                                }

                                setVisibleResults(
                                    visibleResultsRef.current.value
                                );

                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            <section className="result-grid">
                {results.length > 0 ? (
                    results
                        .slice(
                            visibleResults * (page - 1),
                            visibleResults * (page - 1) + visibleResults
                        )
                        .map((result, i) => {
                            return (
                                <section className="search-result" key={i}>
                                    <a
                                        href={`https://homestuck.com/story/${result.page}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {result.type === 0 ? (
                                            <StaticCanvas
                                                width="650"
                                                height="450"
                                                src={
                                                    result.thumbnail ||
                                                    result.content
                                                }
                                            />
                                        ) : null}
                                        {result.type === 1 ? (
                                            <div>
                                                <p>Flash not functional.</p>
                                            </div>
                                        ) : null}
                                    </a>

                                    <div
                                        className="search-result-link"
                                        onClick={() => {
                                            setParams({
                                                query,
                                                page,
                                                asset:
                                                    visibleResults *
                                                        (page - 1) +
                                                    i,
                                            });
                                        }}
                                    >
                                        <MdFullscreen />
                                    </div>
                                </section>
                            );
                        })
                ) : (
                    <p className="no-results">No results</p>
                )}
            </section>

            <div className="to-top" onClick={scrollToTop}>
                <MdArrowUpward />
            </div>

            <Sidebar
                title="Tags"
                clearSearch={() => {
                    searchRef.current.value = "";
                }}
            >
                <details>
                    <summary>
                        <h2>Used Tags</h2>
                    </summary>

                    <ul className="sidebar-text">
                        {constructUsedTagsElements()}
                    </ul>
                </details>

                {tags.map((tag, i) => {
                    return (
                        <details key={i} open>
                            <summary>
                                <h2>{tag.category}</h2>
                            </summary>

                            <ul
                                className="sidebar-text focusable"
                                data-testid="tag-category-list"
                            >
                                {tag.tags.map((tag, i) => {
                                    return (
                                        <li
                                            key={i}
                                            onClick={() => {
                                                addTagToSearch(tag.title);
                                            }}
                                        >
                                            {tag.title}
                                        </li>
                                    );
                                })}
                            </ul>
                        </details>
                    );
                })}
            </Sidebar>

            <Lightbox
                hideLightbox={() => {
                    setParams({ query, page });
                }}
                loadPrevious={() => {
                    if (asset > 0) {
                        setParams({
                            query,
                            page,
                            asset: asset - 1,
                        });
                    }
                }}
                loadNext={() => {
                    if (asset < results.length - 1) {
                        setParams({
                            query,
                            page,
                            asset: asset + 1,
                        });
                    }
                }}
                isIsSignedIn={isSignedIn}
                visible={asset !== -1}
                id={asset}
                results={results}
            />

            <Dialog {...dialog} />

            <Controls />
        </Layout>
    );
}

export default HomePage;
