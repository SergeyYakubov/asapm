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
    if (typeof (isoDate) != "string") {
        return "undefined";
    }
    return (isoDate as string).slice(0, 16).replace('T', ' ');
}

