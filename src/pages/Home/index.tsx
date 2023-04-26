import React, {
    FormEvent,
    lazy,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { CgMaximize, CgSearch } from "react-icons/cg";
import {
    setIsSignedIn,
    useResults,
    setResults,
    useIsSignedIn,
} from "helpers/globalState";
import useEventListener from "hooks/useEventListener";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { checkIsSignedIn, createTagStructure, signOut } from "helpers/utility";
import Layout from "components/Layout";
import Sidebar from "components/Sidebar";
import StaticCanvas from "components/StaticCanvas";
import parseSearchString from "helpers/parseSearchString";
import { ITagStructure, IResult, IResultTags, ITags } from "types/index";
import Pagination from "components/Pagination";
import useParams from "hooks/useParams";
import { GoSignOut } from "react-icons/go";
const Lightbox = lazy(() => import("components/Lightbox"));
import "./index.scss";
import { Link } from "react-router-dom";
import { MdAdd, MdChevronRight, MdPerson } from "react-icons/md";

/**
 * Global counter for tag
 */
let tagKeyCounter = 0;

/**
 * Represents the home page.
 */
function HomePage() {
    /* States */
    const [isSignedIn] = useIsSignedIn();
    const [tags, setTags] = useState<ITags>({
        synonyms: undefined,
        definitions: undefined,
    });

    const [visibleResults, setVisibleResults] = useState(20);
    const [resultTags, setResultTags] = useState<IResultTags>({});
    const [failedTags, setFailedTags] = useState<string[]>([]);

    const [results] = useResults();

    const searchRef = useRef<HTMLInputElement>(null);
    const visibleResultsRef = useRef<HTMLInputElement>(null);

    // URL parameters
    const [params, setParams] = useParams<{
        query?: string;
        page?: number;
        asset?: number;
    }>();

    const query = params.query ?? "";
    const page = params.page ?? 0;
    const asset = params.asset ?? -1;

    // Tag structure
    const tagStructure = useMemo(() => createTagStructure(tags), [tags]);

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

    const loadPage = (page: number) => {
        setParams({
            query,
            page,
        });
        scrollToTop();
    };

    const loadPreviousPage = () => {
        if (page > 1) {
            loadPage(page - 1);
        }
    };

    const loadNextPage = () => {
        if (page < Math.ceil(results.length / visibleResults)) {
            loadPage(page + 1);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const searchTags = searchRef.current?.value;

        // Update URL params
        setParams({
            query: searchTags,
            page: 1,
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

        const parsedQuery = parseSearchString(query, tags);

        if (parsedQuery.failedTags) {
            console.warn(`Tags don't exist: ${parsedQuery.failedTags}`);
            setFailedTags(parsedQuery.failedTags);
            setResults([]);
            return;
        }

        // Perform search
        fetch(`${ENDPOINT}/api/app/1/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedQuery),
        })
            .then((e) => e.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                setFailedTags([]);
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
            if (asset === -1 && searchRef.current !== document.activeElement) {
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
    const constructUsedTagsElements = () => {
        const definitions = tags.definitions;
        if (!definitions) return;

        const elements = [];
        let index = 0;

        for (const key in resultTags) {
            const tagInfo = resultTags[key];

            elements.push(
                <li
                    className="tag-title"
                    key={key || index}
                    data-testid="used-tag-item"
                >
                    <p className="tag-title_text">
                        {definitions[tagInfo.tag]?.name} ({tagInfo.appearances})
                    </p>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addTagToSearch(definitions[tagInfo.tag]?.name);
                        }}
                        type="button"
                        className="tag-add-btn"
                    >
                        <MdAdd />
                    </button>
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
                        <details className="tag-details">
                            <summary className="tag-title tag-title_summary">
                                <MdChevronRight className="tag-dropdown-icon" />
                                <p className="tag-title_text">{tag.name}</p>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addTagToSearch(tag.name);
                                    }}
                                    type="button"
                                    className="tag-add-btn"
                                >
                                    <MdAdd />
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
                                    addTagToSearch(tag.name);
                                }}
                                type="button"
                                className="tag-add-btn"
                            >
                                <MdAdd />
                            </button>
                        </div>
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
            <Pagination
                loadPage={loadPage}
                loadNextPage={loadNextPage}
                loadPreviousPage={loadPreviousPage}
                currentPage={page}
                pages={
                    visibleResults > 0
                        ? Math.ceil(results.length / visibleResults)
                        : 0
                }
            />

            {isSignedIn ? (
                <button
                    className="login-state logout-btn"
                    type="button"
                    onClick={() => signOut()}
                >
                    <p className="login-text">Sign out</p>

                    <GoSignOut className="login-icon" />
                </button>
            ) : (
                <Link to={`${BASE_URL}login`} className="login-state">
                    <p className="login-text">Sign in</p>
                    <MdPerson className="login-icon" />
                </Link>
            )}

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
                        defaultValue={query}
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

                                loadPage(1);
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
                                <section
                                    className="search-result"
                                    key={result._id}
                                >
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
                                            <div className="no-flash">
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
                                        <CgMaximize />
                                    </div>
                                </section>
                            );
                        })
                ) : (
                    <div className="no-results">
                        {failedTags.length > 0 ? (
                            <p>
                                The following tags do not exist in the database
                                and should be removed from your search query:{" "}
                                {failedTags.join(",")}
                            </p>
                        ) : (
                            <p>No results</p>
                        )}
                    </div>
                )}
            </section>

            <Sidebar
                title="Tags"
                clearSearch={() => {
                    const search = searchRef.current;
                    if (search) search.value = "";
                }}
            >
                <ul className="sidebar-text focusable">
                    <li>
                        <details className="tag-details">
                            <summary className="tag-title tag-title_summary">
                                <MdChevronRight className="tag-dropdown-icon" />
                                <p className="tag-title_text">Used Tags</p>
                            </summary>

                            <ul className="sidebar-text">
                                {constructUsedTagsElements()}
                            </ul>
                        </details>
                    </li>

                    <hr />

                    {tagListElements}
                </ul>
            </Sidebar>

            <Lightbox
                closeLightbox={() => {
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
                visible={asset !== -1}
                id={asset}
                tagStructure={tagStructure}
                tags={tags}
            />
        </Layout>
    );
}

export default HomePage;
