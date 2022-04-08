/// Tags
export type ITag = {
    _id: number;
    name: string;
    children?: number[] | undefined;
};

export type ITags = {
    definitions?: Record<number, ITag>;
    synonyms?: Record<string, { ref: number }>;
};

export type ITagStructure = { id: number; children: ITagStructure[] };

/// Result tags
export type IResultTags = Record<
    string,
    {
        tag: number;
        appearances: number;
        resultIndices: Record<string, number>;
    }
>;

/// Results
export type IResult = {
    _id: number;
    page: number;
    type: number;
    thumbnail?: string;
    content: string;
    tags: number[];
};
