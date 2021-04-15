import React, { createRef, lazy, useEffect, useState } from "react";
import {
    MdArrowUpward,
    MdChevronLeft,
    MdChevronRight,
    MdFullscreen,
    MdSearch
} from "react-icons/md";

import "../../css/Home.scss";
import Controls from "./Controls";
import ENDPOINT from "../endpoint";

import { useIsEditMode, setIsSignedIn, useIsSignedIn, useDialog, useResults, setResults, setEdits } from "../globalState";

import Layout from "./Layout";
import Sidebar from "./Sidebar";
import StaticCanvas from "./StaticCanvas";
import { checkIsSignedIn, focusElement, setIsEdited } from "../utility";
import Dialog from "./Dialog";
import useEventListener from "../useEventListener";
const Lightbox = lazy(() => import("./Lightbox"));

/**
 * Global counter for tag 
 */
let tagKeyCounter = 0;

/**
 * Represents the home page.
 */
function HomePage() {
    // States
    const [tags, setTags, ] = useState([]);
    const [lightbox, setLightbox, ] = useState({
        results: [],
        id: 0,
        image: "",
        visible: false,
    });
    const [visibleResults, setVisibleResults, ] = useState(20);
    const [currentPage, setCurrentPage, ] = useState(1);
    const [focused, setFocused, ] = useState(- 1);
    const [resultTags, setResultTags, ] = useState({});

    const [results, ] = useResults();
    const [isSignedIn, ] = useIsSignedIn();
    const [isEditMode, ] = useIsEditMode();
    const [dialog, ] = useDialog();

    const searchRef = createRef();
    const visibleResultsRef = createRef();

    // Functions
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
    const updateResultTags = async (data) => {
        const thisResultTags = {};

        for (let i = 0; i < data.length; i++) {
            const result = data[i];

            for (let j = 0; j < result.tags.length; j++) {
                const tag = result.tags[j];

                if (tag.startsWith("http")) {
                    console.log(tag, result);
                }

                if (!thisResultTags[tag]) {
                    thisResultTags[tag] = {
                        key: tagKeyCounter++,
                        appearances: 0,
                        resultIndices: {},
                    };
                }

                thisResultTags[tag].resultIndices[result._id] = j;
                thisResultTags[tag].appearances++;
            }
        }

        setResultTags(thisResultTags);
    };

    /**
     * Returns array of elements, containing used tags.
     */
    const getUsedTagsElements = () => {
        const res = [];
        let index = 0;

        for (const tag in resultTags) {
            const tagInfo = resultTags[tag];

            res.push(
                <li className="sidebar-text-input" key={tagInfo.key || index}>
                    {isEditMode ? (
                        <input className={`tag-input${tag.length === 0 ?
                            " empty" :
                            ""}`} data-index={index} data-original={tag} defaultValue={tag} autoFocus={focused === index} />
                    ) :
                        tag} ({tagInfo.appearances})
                </li>
            );

            index++;
        }

        return res;
    };

    /**
     * Adds a tag to the search bar
     * @param {string} tag 
     */
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

    /**
     * Handles submit event
     * @param {Event} e 
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Get tags from search string
        const searchTags = searchRef.current.value;

        let prevWasSpace = true;
        let actualTags = [];
        let tempTag = "";

        let pageRanges = [];
        let pageRangePoint = 0;
        let rangeRef;

        for (let i = 0; i <= searchTags.length; i++) {
            // Separator
            if (searchTags[i] === "," || i === searchTags.length) {
                let trimmed = tempTag.trimRight();
                if (trimmed.length > 0) actualTags.push(trimmed);

                tempTag = "";
                prevWasSpace = true;
                continue;
            }

            // Page range
            if (searchTags[i] === "(") {
                pageRangePoint = 1;
                pageRanges.push(["", "", ]);
                rangeRef = pageRanges[pageRanges.length - 1];
                continue;
            } else if (searchTags[i] === "-") {
                pageRangePoint = 2;
                continue;
            } else if (searchTags[i] === ")") {
                pageRangePoint = 0;
                rangeRef = null;
                continue;
            }

            // Tag reading
            if (searchTags[i] === " " && !prevWasSpace) {
                tempTag += " ";
                prevWasSpace = true;
            } else if (searchTags[i] !== " ") {
                const charCode = searchTags.charCodeAt(i);

                if (rangeRef && charCode >= 48 && charCode <= 57) {
                    // Start or end of page range
                    if (pageRangePoint === 1) {
                        rangeRef[0] += searchTags[i];
                    } else if (pageRangePoint === 2) {
                        rangeRef[1] += searchTags[i];
                    }
                } else if (charCode >= 65 && charCode <= 90) {
                    // Force lowercase
                    tempTag += String.fromCharCode(charCode - 65 + 97);
                } else {
                    tempTag += searchTags[i];
                }

                prevWasSpace = false;
            }
        }

        // Convert tags to main tag
        // TODO: Improve speed??
        for (let i = 0; i < actualTags.length; i++) {
            let found = false;

            for (let j = 0; j < tags.length; j++) {
                for (let n = 0; n < tags[j].tags.length; n++) {
                    if (tags[j].tags[n].synonyms.includes(actualTags[i])) {
                        actualTags[i] = tags[j].tags[n].title;
                        found = true;
                        break;
                    }
                }

                if (found) {
                    break;
                }
            }
        }

        // Perform search
        fetch(`${ENDPOINT}/api/app/1/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ tags: actualTags, ranges: pageRanges, }),
        })
            .then((e) => e.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                setResults(data);
                setCurrentPage(1);
                updateResultTags(data);
            });
    };

    /**
     * Saves tag changes to global state
     * @param {Event} event 
     */
    function rememberLocalData() {
        const activeElement = document.activeElement;
        const originalTag = activeElement.getAttribute("data-original");
        
        setEdits((editsThis) => {
            const editsLocal = Object.assign({}, editsThis);
            console.log(editsLocal, results, resultTags, "original: ", originalTag);
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const resultId = result._id;

                if (!editsLocal[resultId]) {
                    editsLocal[resultId] = [];

                    for (let j = 0; j < result.tags.length; j++) {
                        let tag = result.tags[j];

                        if (tag === originalTag) {
                            tag = activeElement.value;
                        }

                        editsLocal[resultId].push([tagKeyCounter++, tag, ]);
                    }
                } else {
                    const tagIndex = resultTags[originalTag].resultIndices[resultId];
                    if (tagIndex != undefined) editsLocal[resultId][tagIndex][1] = activeElement.value;
                }
            }
            
            setIsEdited(true);
            return editsLocal;
        });
    }

    // Efects
    useEffect(() => {
        // Get signed in state
        async function fetchData() {
            setIsSignedIn(await checkIsSignedIn());
        }
        fetchData();

        // Get tags
        fetch(`${ENDPOINT}/api/app/1/tags`)
            .then((e) => e.json())
            .then((data) => {
                data.sort((a, b) => {
                    return a.position - b.position;
                });

                setTags(data);
            });
    }, []);

    // Event listeners
    useEventListener("keyup", (e) => {
        if (!lightbox.visible && e.target.classList.contains("tag-input")) {
            if (e.target.value.length === 0) {
                e.target.classList.add("empty");
            } else {
                e.target.classList.remove("empty");
            }

            rememberLocalData();
        }
    }, document);

    useEventListener(
        "keydown",
        (e) => {
            if (isEditMode && e.target.classList.contains("tag-input")) {
                if (e.key === "Enter") {
                    // Add tag
                    /*const resultId = result._id;

                    setEdits((editsThis) => {
                        const index = parseInt(e.target.getAttribute("data-index")) + 1;
                        const editsLocal = Object.assign({}, editsThis);

                        if (!editsLocal[resultId]) {
                            editsLocal[resultId] = resultTags;
                        }

                        editsLocal[resultId].splice(index, 0, [tagKeyCounter++, "", ]);
                            
                        setFocused(index);

                        setIsEdited(true);
                        return editsLocal;
                    });*/
                } else if (e.key === "ArrowUp") {
                    // Move up
                    e.preventDefault();

                    if (e.target.parentNode.previousSibling) {
                        focusElement(e.target.parentNode.previousSibling.children[0]);
                    }
                } else if (e.key === "ArrowDown") {
                    // Move down
                    e.preventDefault();

                    if (e.target.parentNode.nextSibling) {
                        focusElement(e.target.parentNode.nextSibling.children[0]);
                    }
                } else if (e.key === "Backspace") {     
                    if (e.target.value.length === 0) {
                        e.preventDefault();
                            
                        if (resultTags.length > 1) {                                
                            const index = parseInt(e.target.getAttribute("data-index"));
                    
                            // Remove tag
                            /*setEdits((editsThis) => {
                                const editsLocal = Object.assign({}, editsThis);       

                                for(let i = 0; i < results.length; i++) {
                                    const result = results[i];
                                    const resultId = result._id;

                                    if (!editsLocal[resultId]) {
                                        editsLocal[resultId] = result.map((tag) => {
                                            return [tagKeyCounter++, tag, ];
                                        });
                                    }
                                    
                                    editsLocal[resultId].splice(0, 1);
                                };
                                
                                setIsEdited(true);
                                return editsLocal;
                            });

                            focusElement(document.querySelector(`.tag-input[data-index="${index === 0 ?
                                0 :
                                index - 1}"]`));*/
                        }
                    }
                } else if (e.key === "Delete") {     
                    const index = parseInt(e.target.getAttribute("data-index"));

                    if (resultTags.length > index + 1) {
                        const target = document.querySelector(`.tag-input[data-index="${index + 1}"]`);

                        if (target.value.length === 0) {
                            e.preventDefault();
                                                                
                            // Remove tag
                            /*const resultId = result._id;
                                setEdits((editsThis) => {
                                    const editsLocal = Object.assign({}, editsThis);       
                                    editsLocal[resultId].splice(index + 1, 1);
                                    setIsEdited(true);
                                    return editsLocal;
                                });*/
                        }
                    }
                }
            }
        },
        document
    );

    return (
        <Layout className="home-page" title="Homestuck Search Engine">
            <nav className="page-nav">
                <ul>
                    <li
                        className={currentPage > 1 
                            ? "enabled" 
                            : ""}
                        onClick={(e) => {
                            if (e.target.classList.contains("enabled")) {
                                setCurrentPage(currentPage - 1);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }
                        }}
                    >
                        <MdChevronLeft />
                    </li>

                    <li className="pages">
                        {(() => {
                            const data = [];

                            if (visibleResults > 0) {
                                let pages = Math.ceil(
                                    results.length / visibleResults
                                );
                                let firstPage = currentPage - 5;
                                if (firstPage < 1) {
                                    firstPage = 1;
                                }

                                let lastPage = firstPage + 9;
                                if (lastPage > pages) {
                                    lastPage = pages;
                                }

                                for (let i = firstPage; i <= lastPage; i++) {
                                    data.push(
                                        <button
                                            className={
                                                currentPage === i
                                                    ? "current"
                                                    : ""
                                            }
                                            key={i}
                                            onClick={(e) => {
                                                setCurrentPage(
                                                    parseInt(e.target.innerText)
                                                );
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

                            return data;
                        })()}
                    </li>

                    <li
                        className={
                            currentPage <
                            Math.ceil(results.length / visibleResults)
                                ? "enabled"
                                : ""
                        }
                        onClick={(e) => {
                            if (e.target.classList.contains("enabled")) {
                                setCurrentPage(currentPage + 1);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }
                        }}
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
                    />
                    <button
                        className="search-button"
                        aria-label="Search"
                        type="submit"
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
                            visibleResults * (currentPage - 1),
                            visibleResults * (currentPage - 1) + visibleResults
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
                                            setLightbox({
                                                id:
                                                    visibleResults *
                                                        (currentPage - 1) +
                                                    i,
                                                visible: true,
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

            <div
                className="to-top"
                onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth", });
                }}
            >
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
                        {getUsedTagsElements()}
                    </ul>
                </details>

                {tags.map((tag, i) => {
                    return (
                        <details key={i} open>
                            <summary>
                                <h2>{tag.category}</h2>
                            </summary>

                            <ul className="sidebar-text focusable">
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
                    setLightbox({ visible: false, });
                }}
                loadPrevious={() => {
                    if (lightbox.id > 0) {
                        setLightbox({
                            id: lightbox.id - 1,
                            visible: true,
                        });
                    }
                }}
                loadNext={() => {
                    if (lightbox.id < results.length - 1) {
                        setLightbox({
                            id: lightbox.id + 1,
                            visible: true,
                        });
                    }
                }}
                isIsSignedIn={isSignedIn}
                {...lightbox}
            />

            <Dialog {...dialog} />

            <Controls />
        </Layout>
    );
}

export default HomePage;
