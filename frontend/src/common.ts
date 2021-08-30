import {ColumnList} from "./pages/CollectionListPage";

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
    sortBy: string
    sortDir: string
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


export function GetOrderBy(filter: CollectionFilter): string {
    let filterString = "";
    if (filter.sortBy !=="") {
        filterString = filter.sortBy;
        if (filter.sortDir === "desc") {
            filterString = filterString + " DESC";
        }
    }
    return filterString;
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
        let filter1 = AddToFilter("", "eventStart >= isodate('" + filter.dateFrom.toISOString() + "')", "and");
        filter1 = AddToFilter(filter1, "eventStart <= isodate('" + filter.dateTo.toISOString() + "')", "and");

        let filter2 = AddToFilter("", "eventEnd >= isodate('" + filter.dateFrom.toISOString() + "')", "and");
        filter2 = AddToFilter(filter2, "eventEnd <= isodate('" + filter.dateTo.toISOString() + "')", "and");

        let filter3 = AddToFilter("", "eventEnd >= isodate('" + filter.dateTo.toISOString() + "')", "and");
        filter3 = AddToFilter(filter3, "eventStart <= isodate('" + filter.dateFrom.toISOString() + "')", "and");

        let filterRange = AddToFilter(filter1, filter2, "or");
        filterRange = AddToFilter(filterRange, filter3, "or");
        filterString = AddToFilter(filterString, filterRange, "and");
    }
    if (filter.textSearch !== "") {
        filterString = AddToFilter(filterString, "jsonString regexp '" + filter.textSearch + "'", "and");
    }

    return filterString;
}

// If REACT_APP_API_URL available use it, otherwise use the current host with PUBLIC_URL
const baseHost = process.env.REACT_APP_API_URL
                ? process.env.REACT_APP_API_URL
                : (window.location.origin + process.env.PUBLIC_URL);
export const ApplicationApiBaseUrl = baseHost + process.env.REACT_APP_API_SUFFIX;

/**
 * @param path api endpoint path
 * @param file the file to upload
 * @param progressCallback will be called if the upload progress has changed (value form 0 to 1)
 * @returns Promise resolves with response string if status is 200, otherwise reject
 */
export function EasyFileUpload(path: string, file: File, progressCallback?: (progress: number) => void): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const request = new XMLHttpRequest();
            request.open('POST', path, true);
            request.upload.onprogress = (e) => {
                progressCallback?.(e.loaded / e.total);
            };

            request.onload = () => {
                if (request.status == 200) {
                    resolve(request.responseText);
                } else {
                    reject(new Error(`Response status was '${request.statusText}'`));
                }
            };

            request.onerror = () => {
                reject(new Error('XMLHttpRequest onerror'));
            };

            const fd = new FormData();
            fd.append('file', file);
            request.send(fd);
        } catch(e) {
            reject(e);
        }
    });
}

export function EndOfDay(date: Date|undefined): Date|undefined {
    if (!date) {
        return date;
    }
    return  new Date(date!.getFullYear()
        ,date!.getMonth()
        ,date!.getDate()
        ,23,59,59);
}


export function StartOfDay(date: Date|undefined): Date|undefined {
    if (!date) {
        return date;
    }
    return  new Date(date!.getFullYear()
        ,date!.getMonth()
        ,date!.getDate()
        ,0,0,0);
}

export enum Mode {
    Beamtimes,
    Collections,
}

export const beamtimeFilterKeys: ColumnList = [
    {fieldName: "id", alias: "ID", active: true, type: "string"},
    {fieldName: "title", alias: "Title", active: true, type: "string"},
    {fieldName: "beamline", alias: "Beamline", active: true, type: "string"},
    {fieldName: "facility", alias: "Facility", active: true, type: "string"},
    {fieldName: "proposalId", alias: "Proposal Id", active: false, type: "string"},
    {fieldName: "users.doorDb", alias: "Door users", active: true, type: "Array"},
];