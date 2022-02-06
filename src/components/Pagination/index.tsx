import React from "react";
import { CgChevronLeft, CgChevronRight } from "react-icons/cg";

import "./index.scss";

const VISIBLE_ITEMS_AROUND = 4;

type IProps = {
    currentPage: number;
    pages: number;
    loadPage: (page: number) => void;
    loadNextPage: () => void;
    loadPreviousPage: () => void;
};

const Pagination: React.FC<IProps> = ({
    loadPreviousPage,
    loadPage,
    currentPage,
    loadNextPage,
    pages,
}) => {
    const constructPageLinksElements = () => {
        const elements: React.ReactNode[] = [];

        for (let i = 1; i <= pages; i++) {
            const isVisible =
                Math.abs(currentPage - i) <= VISIBLE_ITEMS_AROUND ||
                i == 1 ||
                i == pages;
            const isDots = i == 2 || i == pages - 1;

            if (isVisible) {
                elements.push(
                    <li key={i}>
                        <button
                            className={currentPage === i ? "current" : ""}
                            onClick={() => {
                                loadPage(i);
                            }}
                        >
                            {i}
                        </button>
                    </li>
                );
            } else if (isDots) {
                elements.push(
                    <li className="text-grey-dark p-1" key={`dots-${i}`}>
                        ...
                    </li>
                );
            }
        }

        return elements;
    };

    return (
        <nav className="page-nav">
            <button
                className={`page-nav_prev-button ${
                    currentPage > 1 ? "enabled" : ""
                }`}
                onClick={loadPreviousPage}
            >
                <CgChevronLeft />
            </button>

            <ul className="page-nav_links">{constructPageLinksElements()}</ul>

            <button
                className={`page-nav_prev-button ${
                    currentPage < pages ? "enabled" : ""
                }`}
                onClick={loadNextPage}
            >
                <CgChevronRight />
            </button>
        </nav>
    );
};

export default Pagination;
