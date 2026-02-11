import { QuoteItem } from "@prisma/client";

export interface SpanInfo {
    rowSpan: number;
    isFirst: boolean;
    isLastInSpan: boolean;
}

/**
 * Pre-processes items for row spanning logic.
 * This identifies items with the same name that should be visually merged.
 */
export const calculateItemSpans = (items: QuoteItem[]): SpanInfo[] => {
    const spans: SpanInfo[] = new Array(items.length)
        .fill(null)
        .map(() => ({ rowSpan: 1, isFirst: true, isLastInSpan: true }));

    for (let i = 0; i < items.length; i++) {
        if (i > 0 && items[i].name === items[i - 1].name) {
            spans[i].isFirst = false;
            spans[i].rowSpan = 0; // Means hidden/merged
            spans[i].isLastInSpan = true; // Assume last for now

            // Increment span of the first item in this group
            let ptr = i - 1;
            while (ptr >= 0 && !spans[ptr].isFirst) {
                ptr--;
            }
            spans[ptr].rowSpan++;
            spans[ptr].isLastInSpan = false; // The first one is no longer last

            // The previous one in the same group is no longer last
            spans[i - 1].isLastInSpan = false;
        }
    }
    return spans;
};
