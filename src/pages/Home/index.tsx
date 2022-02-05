import React, {
    FormEvent,
    lazy,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    CgArrowUp,
    CgChevronLeft,
    CgChevronRight,
    CgMaximize,
    CgSearch,
} from "react-icons/cg";
import {
    setIsSignedIn,
    useDialog,
    useResults,
    setResults,
} from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import ENDPOINT from "helpers/endpoint";
import { checkIsSignedIn } from "helpers/utility";
import Controls from "components/Controls";
import Layout from "components/Layout";
import Sidebar from "components/Sidebar";
import StaticCanvas from "components/StaticCanvas";
import Dialog from "components/Dialog";
import parseSearchString from "helpers/parseSearchString";
import { useSearchParams } from "react-router-dom";
import { ITags, ITag, ITagStructure, IResult, IResultTags } from "types/index";

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
    const [tags, setTags] = useState<ITags>({
        definitions: undefined,
        synonyms: undefined,
    });
    const [visibleResults, setVisibleResults] = useState(20);
    const [resultTags, setResultTags] = useState<IResultTags>({});

    const [results] = useResults();
    const [dialog] = useDialog();

    const searchRef = useRef<HTMLInputElement>(null);
    const visibleResultsRef = useRef<HTMLInputElement>(null);

    // URL parameters
    const [params, setParams] = useSearchParams({
        query: "",
        page: "1",
        asset: "-1",
    });

    const query = params.get("query");
    const page = parseInt(params.get("page") ?? "1");
    const asset = parseInt(params.get("asset") ?? "-1");

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

        return createTagStructureRecursive(Object.keys(topTags).map(parseInt));
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
    const restructureResultTags = async (data: IResult[]) => {
        const thisResultTags: IResultTags = {};
        const thisResultTagsIndices: Record<string, number> = {};

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

    const addTagToSearch = (tag: string) => {
        const search = searchRef.current;
        if (!search) return;

        for (let i = search.value.length - 1; i >= 0; i--) {
            if (search.value[i] === ",") {
                break;
            } else if (search.value[i] !== " ") {
                search.value += ",";
                break;
            }
        }

        search.value += tag;

        search.scrollLeft = search.scrollWidth;
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const setCurrentPage = (page: number) => {
        setParams({
            query: query ?? "",
            page: page.toString(),
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const searchTags = searchRef.current?.value;

        // Update URL params
        setParams({
            query: searchTags ?? "",
            page: "1",
        });
    };

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
        if (!query || !tags.synonyms) return;

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
    }, [query, tags]);

    /* Event listeners */
    useEventListener(
        "keydown",
        (e) => {
            if (asset === -1) {
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
            const pages = Math.ceil(results.length / visibleResults);

            const ITEMS_AROUND_PAGE = 4;

            for (let i = 1; i <= pages; i++) {
                const isVisible =
                    Math.abs(page - i) <= ITEMS_AROUND_PAGE ||
                    i == 1 ||
                    i == pages;
                const isDots = i == 2 || i == pages - 1;

                if (isVisible) {
                    elements.push(
                        <button
                            className={page === i ? "current" : ""}
                            key={i}
                            onClick={() => {
                                // Update URL params
                                setCurrentPage(i);

                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                        >
                            {i}
                        </button>
                    );
                } else if (isDots) {
                    elements.push(
                        <span
                            className="inline-block text-grey-dark p-1"
                            key={`dots-${i}`}
                        >
                            ...
                        </span>
                    );
                }
            }
        }

        return elements;
    };

    const constructUsedTagsElements = () => {
        if (!tags.definitions) return;

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
                    {tags.definitions[tagInfo.tag]?.name} ({tagInfo.appearances}
                    )
                </li>
            );

            index++;
        }

        return elements;
    };

    const constructTagElements = (children: ITagStructure[]) => {
        return children?.map((child) => {
            const tag = tags.definitions?.[child.id];

            if (!tag) return null;

            return (
                <li key={tag._id}>
                    {tag.children?.length ? (
                        <details>
                            <summary>
                                <p>{tag.name}</p>
                            </summary>

                            <ul className="sidebar-text focusable">
                                {constructTagElements(child.children)}
                            </ul>
                        </details>
                    ) : (
                        <p>{tag.name}</p>
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
        <Layout className="home-page" title="Homestuck Search Engine">
            <nav className="page-nav">
                <ul>
                    <li
                        className={page > 1 ? "enabled" : ""}
                        onClick={loadPreviousPage}
                    >
                        <CgChevronLeft />
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
                        <CgChevronRight />
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
                        <CgSearch />
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
                                const visibleResultsField =
                                    visibleResultsRef.current;
                                if (!visibleResultsField) return;

                                let newVisibleResult = parseInt(
                                    visibleResultsField.value
                                );
                                if (newVisibleResult < 1) {
                                    newVisibleResult = 1;
                                } else if (newVisibleResult > 100) {
                                    newVisibleResult = 100;
                                }

                                setVisibleResults(newVisibleResult);

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
                                                width={650}
                                                height={450}
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
                                                query: query ?? "",
                                                page: page.toString() ?? "",
                                                asset: (
                                                    visibleResults *
                                                        (page - 1) +
                                                    i
                                                ).toString(),
                                            });
                                        }}
                                    >
                                        <CgMaximize />
                                    </div>
                                </section>
                            );
                        })
                ) : (
                    <p className="no-results">No results</p>
                )}
            </section>

            <div className="to-top" onClick={scrollToTop}>
                <CgArrowUp />
            </div>

            <Sidebar
                title="Tags"
                clearSearch={() => {
                    const search = searchRef.current;
                    if (search) search.value = "";
                }}
            >
                <ul className="sidebar-text focusable">
                    <li>
                        <details>
                            <summary>
                                <p>Used Tags</p>
                            </summary>

                            <ul className="sidebar-text">
                                {constructUsedTagsElements()}
                            </ul>
                        </details>
                    </li>

                    {tagListElements}
                </ul>
            </Sidebar>

            <Lightbox
                hideLightbox={() => {
                    setParams({ query: query ?? "", page: page.toString() });
                }}
                loadPrevious={() => {
                    if (asset > 0) {
                        setParams({
                            query: query ?? "",
                            page: page.toString(),
                            asset: (asset - 1).toString(),
                        });
                    }
                }}
                loadNext={() => {
                    if (asset < results.length - 1) {
                        setParams({
                            query: query ?? "",
                            page: page.toString(),
                            asset: (asset + 1).toString(),
                        });
                    }
                }}
                visible={asset !== -1}
                id={asset}
            />

            <Dialog {...dialog} />

            <Controls />
        </Layout>
    );
}

export default HomePage;
