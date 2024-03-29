import { ITags } from "types/index";

/**
 * Separate tags from a string and return an array of tags and page ranges based on the inserted tags
 *
 * Page range syntax: (FROM-TO)
 */
const parseSearchString = (str: string, tags: ITags) => {
    let prevWasSpace = true;
    const clearedTags: string[] = [];
    let tempTag = "";

    const pageRanges = [];
    let pageRangePoint = 0;
    let rangeRef;

    for (let i = 0; i <= str.length; i++) {
        // Separator
        if (str[i] === "," || i === str.length) {
            const trimmed = tempTag.trimEnd();
            if (trimmed.length > 0) clearedTags.push(trimmed);

            tempTag = "";
            prevWasSpace = true;
            continue;
        }

        // Page range
        if (str[i] === "(") {
            pageRangePoint = 1;
            pageRanges.push(["", ""]);
            rangeRef = pageRanges[pageRanges.length - 1];
            continue;
        } else if (str[i] === "-") {
            pageRangePoint = 2;
            continue;
        } else if (str[i] === ")") {
            pageRangePoint = 0;
            rangeRef = null;
            continue;
        }

        // Tag reading
        if (str[i] === " " && !prevWasSpace) {
            tempTag += " ";
            prevWasSpace = true;
        } else if (str[i] !== " ") {
            const charCode = str.charCodeAt(i);

            if (rangeRef && charCode >= 48 && charCode <= 57) {
                // Start or end of page range
                if (pageRangePoint === 1) {
                    rangeRef[0] += str[i];
                } else if (pageRangePoint === 2) {
                    rangeRef[1] += str[i];
                }
            } else if (charCode >= 65 && charCode <= 90) {
                // Force lowercase
                tempTag += String.fromCharCode(charCode - 65 + 97);
            } else {
                tempTag += str[i];
            }

            prevWasSpace = false;
        }
    }

    // Remove nonexistent tags and change synonyms to tag ID
    const actualTags: number[] = [];
    const failedTags: string[] = [];
    for (let i = 0; i < clearedTags.length; i++) {
        const tagId = tags.synonyms?.[clearedTags[i]]?.ref;

        if (tagId !== undefined) {
            actualTags.push(tagId);
        } else {
            failedTags.push(clearedTags[i]);
        }
    }

    if (failedTags.length > 0) {
        return {
            failedTags,
        };
    }

    return {
        tags: actualTags,
        ranges: pageRanges,
    };
};

export default parseSearchString;
