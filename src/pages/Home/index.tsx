import React, {
    FormEvent,
    lazy,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { CgInfo, CgMaximize } from "react-icons/cg";
import useEventListener from "hooks/useEventListener";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import {
    checkIsSignedIn,
    createTagStructure,
    deleteCookie,
} from "helpers/utility";
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
import { MdAdd, MdChevronRight, MdPerson, MdSearch } from "react-icons/md";
import Dialog from "components/Dialog";
import useTimeout from "hooks/useTimeout";
import { useRecoilState } from "recoil";
import { isSignedInState, resultsState } from "helpers/globalState";

/**
 * Global counter for tag
 */
let tagKeyCounter = 0;

/**
 * Represents the home page.
 */
function HomePage() {
    /* States */
    const [isSignedIn, setIsSignedIn] = useRecoilState(isSignedInState);
    const [results, setResults] = useRecoilState(resultsState);

    const [tags, setTags] = useState<ITags>({
        synonyms: undefined,
        definitions: undefined,
    });

    const [visibleResults, setVisibleResults] = useState(20);
    const [resultTags, setResultTags] = useState<IResultTags>({});
    const [failedTags, setFailedTags] = useState<string[]>([]);

    const searchRef = useRef<HTMLInputElement>(null);
    const visibleResultsRef = useRef<HTMLInputElement>(null);

    const [searchHintDialog, setSearchHintDialog] = useState<boolean>(false);
    const [tagQuery, setTagQuery] = useState<string>("");

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
    const [tagStructure, setTagStructure] = useState<ITagStructure[]>([]);

    useTimeout(
        () => {
            setTagStructure(createTagStructure(tags, tagQuery));
        },
        300,
        [tags, tagQuery]
    );

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
    }, [setIsSignedIn]);

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
    }, [query, tags, setResults]);

    /* Event listeners */
    useEventListener("keydown", (e) => {
        if (
            asset === -1 &&
            "input" !== document.activeElement?.tagName.toLowerCase()
        ) {
            if (e.key === "ArrowLeft") {
                e.preventDefault();

                loadPreviousPage();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();

                loadNextPage();
            }
        }
    });

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

    const constructTagElements = useCallback(
        (children: ITagStructure[]) => {
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
        },
        [tags.definitions]
    );

    const tagListElements = useMemo(
        () => (tags.definitions ? constructTagElements(tagStructure) : null),
        [tags.definitions, tagStructure, constructTagElements]
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
                    onClick={() => {
                        deleteCookie("hsse_token");
                        setIsSignedIn(false);
                    }}
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
                <div className="search-term-label-wrapper">
                    <label className="search-term-label" htmlFor="search-term">
                        Search
                    </label>

                    <button
                        className="search-hint-btn"
                        aria-label="Search syntax hint"
                        type="button"
                        onClick={() => setSearchHintDialog(true)}
                        data-testid="search-hint-btn"
                        title="Search syntax hint"
                    >
                        <CgInfo />
                    </button>
                </div>

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

            <Dialog
                title="Search syntax"
                visible={searchHintDialog}
                buttons={[
                    {
                        title: "Ok.",
                        callback: () => {
                            setSearchHintDialog(false);
                        },
                    },
                ]}
            >
                <p>There are two primary search methods.</p>
                <p>
                    Method #1 is using tags. You can find the list of tags in
                    the sidebar. This method allows you to search for specific
                    elements, but it only works on tagged images. For example,
                    &quot;Dave Strider&quot; would display results with Dave
                    Strider.
                </p>
                <p>
                    Tags are not case-sensitive, so &quot;John Egbert&quot;,
                    &quot;jOhN eGbeRt&quot;, and &quot;john egbert&quot; are all
                    equivalent.
                </p>
                <p>
                    Method #2 is using page ranges. The format for a page range
                    is (FROM-TO). For example, &quot;(8000-8001)&quot; would
                    display results from pages 8000 and 8001.
                </p>
                <p>
                    Both search methods can be combined freely in a
                    comma-separated list any number of times. For example,
                    &quot;(1-1000), John Egbert&quot; would show results from
                    pages 1 through 1000, as long as John Egbert is in the
                    result. Feel free to experiment with different combinations.
                </p>
            </Dialog>

            <Sidebar
                title="Tags"
                clearSearch={() => {
                    const search = searchRef.current;
                    if (search) search.value = "";
                }}
            >
                <div className="tag-search-wrapper">
                    <input
                        type="text"
                        className="tag-search-input"
                        value={tagQuery}
                        placeholder="Find tags"
                        onChange={(e) => setTagQuery(e.target.value)}
                    />
                    <MdSearch className="tag-search-icon" />
                </div>

                <ul className="sidebar-text focusable">
                    {tagListElements}

                    <hr />

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
                </ul>
            </Sidebar>

            <Lightbox
                tagQuery={tagQuery}
                setTagQuery={setTagQuery}
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
