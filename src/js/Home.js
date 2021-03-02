import React, { createRef, lazy, useEffect, useState } from "react";
import {
    MdArrowUpward,
    MdChevronLeft,
    MdChevronRight,
    MdFullscreen,
    MdSearch,
} from "react-icons/md";

import "../css/Home.scss";
import Background from "./Background";

import Layout from "./Layout";
import Sidebar from "./Sidebar";
import StaticCanvas from "./StaticCanvas";
const Lightbox = lazy(() => import("./Lightbox"));

let ENDPOINT =
    window.location.host === "localhost:3000"
        ? "http://localhost:4000"
        : "https://ahlgreen.net";

function HomePage() {
    const [results, setResults] = useState([]);
    const [tags, setTags] = useState([]);
    const [lightbox, setLightbox] = useState({
        results: [],
        id: 0,
        image: "",
        visible: false,
    });
    const [visibleResults, setVisibleResults] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const searchRef = createRef();
    const visibleResultsRef = createRef();

    useEffect(() => {
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
                pageRanges.push(["", ""]);
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

                if (charCode <= 57 && charCode >= 48) {
                    // Start or end of page range
                    if (rangeRef) {
                        if (pageRangePoint === 1) {
                            rangeRef[0] += searchTags[i];
                        } else if (pageRangePoint === 2) {
                            rangeRef[1] += searchTags[i];
                        }
                    }
                } else if (charCode <= 90 && charCode >= 65) {
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
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tags: actualTags, ranges: pageRanges }),
        })
            .then((e) => e.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                setResults(data);
                setCurrentPage(1);
            });
    };

    return (
        <Layout className="home-page" title="Homestuck Search Engine">
            <Background src="https://pipe.miroware.io/5bc7665ecc3313406322aba0/dirk_bg_earthC.png" />

            <nav className="page-nav">
                <ul>
                    <li
                        className={currentPage > 1 ? "enabled" : ""}
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
                    <div className="results-input-wrapper">
                        <input
                            id="results-input"
                            className="results-input"
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
                                        href={result.url}
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
                    window.scrollTo({ top: 0, behavior: "smooth" });
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
                {tags.map((tag, i) => {
                    return (
                        <ul key={i}>
                            <li>
                                {tag.category}
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
                            </li>
                        </ul>
                    );
                })}
            </Sidebar>

            <Lightbox
                hideLightbox={() => {
                    setLightbox({ visible: false });
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
                results={results}
                {...lightbox}
            />
        </Layout>
    );
}

export default HomePage;
