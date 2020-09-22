export interface TableEntry {
    name: string
    value: String
    data?: any
}

export interface TableData extends Array<TableEntry> {
}

export interface TableFromData
{
    (data: any, section: string): TableData;
}

export function IsoDateToStr(isoDate: String) {
    if (typeof (isoDate) !== "string") {
        return "undefined";
    }
    return (isoDate as string).slice(0, 16).replace('T', ' ');
}

export interface FieldFilter {
    alias: string
    key: string
    value: string
    negate: boolean
}

export interface CollectionFilter {
    showBeamtime: boolean
    showSubcollections: boolean
    textSearch: string
    fieldFilters: FieldFilter[]
}

export function RemoveDuplicates(arr:any[]) {
    const seen = new Set();
    return arr.filter(el => {
        const duplicate = seen.has(JSON.stringify(el));
        if (duplicate) {
            return false;
        }
        seen.add(JSON.stringify(el));
        return true;
    });
}

export function RemoveElement(elem:any,arr:any[]) {
    const elemjs = JSON.stringify(elem)
    return arr.filter(el => elemjs !== JSON.stringify(el));
}

export function GetFilterString(filter: CollectionFilter) {
    let filterString = ""
    if (filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'beamtime'"
    }
    if (!filter.showBeamtime && filter.showSubcollections) {
        filterString = "type = 'collection'"
    }

    if (!filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'bla'"
    }

    if (filter.textSearch === "") {
        return filterString
    }

    if (filterString) {
        filterString = filterString + "AND jsonString regexp '" + filter.textSearch + "'"
    } else {
        filterString = "jsonString regexp '" + filter.textSearch + "'"
    }
    return filterString
}