export interface TableEntry {
    name: string
    value: string
    data?: any
}

export type TableData = Array<TableEntry>

export interface TableFromData {
    (data: any, section?: string): TableData;
}

export function IsoDateToStr(isoDate: string | null): string {
    if (typeof (isoDate) !== "string") {
        return "undefined";
    }
    const d = new Date(isoDate);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export interface FieldFilter {
    alias: string
    key: string
    value: string
    op: string
    enabled: boolean
    type: string
    filterString?: string
}

export function InvertFilterOp(textOp: string): string {
    switch (textOp) {
        case "equals":
            return "not equals";
        case "not equals":
            return "equals";
        case "greater than":
            return "less than or equal to";
        case "less than":
            return "greater than or equal to";
        case "less than or equal to":
            return "greater than";
        case "greater than or equal to":
            return "less than";
        case "regexp":
            return "not regexp";
        case "not regexp":
            return "regexp";
        default:
            return "not " + textOp;
    }
}

export function TextOpToSQLOp(textOp: string): string {
    switch (textOp) {
        case "equals":
            return "=";
        case "not equals":
            return "!=";
        case "greater than":
            return ">";
        case "less than":
            return "<";
        case "less than or equal to":
            return "<=";
        case "greater than or equal to":
            return ">=";
        case "regexp":
            return "regexp";
        case "not regexp":
            return "not regexp";
        default:
            return textOp;
    }
}

function NeedsQuotes(filterType: string) {
    switch (filterType) {
        case "string":
        case "String":
        case "Array":
            return true;
        default:
            return false;
    }
}

export function StringFromFieldFilter(filter: FieldFilter): string {
    if (filter.filterString) {
        return filter.filterString;
    } else {
        if (filter.key && filter.op && filter.value) {
            return filter.key + " " + TextOpToSQLOp(filter.op!) + " " + (NeedsQuotes(filter.type!) ? "'" : "") + filter.value + (NeedsQuotes(filter.type!) ? "'" : "");
        } else {
            return "";
        }
    }
}

export interface CollectionFilter {
    showBeamtime: boolean
    showSubcollections: boolean
    textSearch: string
    fieldFilters: FieldFilter[]
    dateFrom: Date | undefined
    dateTo: Date | undefined
}

export function RemoveDuplicates<T>(arr: T[]): T[] {
    const seen = new Set();
    return arr.filter(el => {
        const uniqueStr = JSON.stringify(el, ["key","op","value"]);
        const duplicate = seen.has(uniqueStr);
        if (duplicate) {
            return false;
        }
        seen.add(uniqueStr);
        return true;
    });
}

export function ReplaceElement<T>(oldElem: T,elem: T, arr: T[]): T[] {
    const elemjs = JSON.stringify(oldElem);
    return arr.map(el =>
        JSON.stringify(el) === elemjs ? elem : el
    );
}

export function RemoveElement<T>(elem: T, arr: T[]): T[] {
    const elemjs = JSON.stringify(elem);
    return arr.filter(el => elemjs !== JSON.stringify(el));
}

function AddToFilter(filter: string, add: string, op: string): string {
    if (filter) {
        return "(" + filter + " " + op + " " + add + ")";
    } else
        return add;
}

export function GetFilterString(filter: CollectionFilter): string {
    let filterString = "";
    if (filter.showBeamtime && !filter.showSubcollections) {
        filterString = AddToFilter(filterString, "type = 'beamtime'", "and");
    }
    if (!filter.showBeamtime && filter.showSubcollections) {
        filterString = AddToFilter(filterString, "type = 'collection'", "and");
    }

    if (!filter.showBeamtime && !filter.showSubcollections) {
        filterString = AddToFilter(filterString, "type = 'bla'", "and");
    }

    filter.fieldFilters.forEach(fieldFilter => {
        if (fieldFilter.enabled) {
            filterString = AddToFilter(filterString, StringFromFieldFilter(fieldFilter), "and");
        }
    });

    if (filter.dateTo && filter.dateFrom) {
        const endDate = new Date(filter.dateTo.valueOf());
        endDate.setDate(endDate.getDate() + 1);
        let filter1 = AddToFilter("", "eventStart >= isodate('" + filter.dateFrom.toISOString() + "')", "and");
        filter1 = AddToFilter(filter1, "eventStart <= isodate('" + endDate.toISOString() + "')", "and");
        let filter2 = AddToFilter("", "eventEnd >= isodate('" + filter.dateFrom.toISOString() + "')", "and");
        filter2 = AddToFilter(filter2, "eventEnd <= isodate('" + endDate.toISOString() + "')", "and");
        let filter3 = AddToFilter("", "eventEnd >= isodate('" + endDate.toISOString() + "')", "and");
        filter3 = AddToFilter(filter3, "eventStart <= isodate('" + filter.dateFrom.toISOString() + "')", "and");
        let filterRange = AddToFilter(filter1, filter2, "or");
        filterRange = AddToFilter(filterRange, filter3, "or");
        filterString = AddToFilter(filterString, filterRange, "and");
    }

    if (filter.textSearch === "") {
        return filterString;
    }

    filterString = AddToFilter(filterString, "jsonString regexp '" + filter.textSearch + "'", "and");

    return filterString;
}
