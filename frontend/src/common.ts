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

export function IsoDateToStr(isoDate: String | null) {
    if (typeof (isoDate) !== "string") {
        return "undefined";
    }
    var d = new Date(isoDate);
    return d.toLocaleDateString()+" "+d.toLocaleTimeString()
}

export interface FieldFilter {
    alias: string
    key: string
    value: string
    negate: boolean
    enabled: boolean
}

export interface CollectionFilter {
    showBeamtime: boolean
    showSubcollections: boolean
    textSearch: string
    fieldFilters: FieldFilter[]
    dateFrom: Date | undefined
    dateTo: Date | undefined
}

export function RemoveDuplicates(arr:any[]) {
    const seen = new Set();
    return arr.filter(el => {
        const uniqueStr = JSON.stringify(el,["key","value"]);
        const duplicate = seen.has(uniqueStr);
        if (duplicate) {
            return false;
        }
        seen.add(uniqueStr);
        return true;
    });
}

export function ReplaceElement(elem:any,arr:any[]) {
    const elemjs = JSON.stringify(elem,["key","value"])
    return arr.map(el =>
        JSON.stringify(el,["key","value"]) === elemjs ? elem : el
    );
}

export function RemoveElement(elem:any,arr:any[]) {
    const elemjs = JSON.stringify(elem)
    return arr.filter(el => elemjs !== JSON.stringify(el));
}

function AddToFilter(filter:string,add:string,op:string):string {
    if (filter) {
        return "("+filter+" "+op+" "+add+")";
    }
    else
        return add
}

export function GetFilterString(filter: CollectionFilter) {
    let filterString = "";
    if (filter.showBeamtime && !filter.showSubcollections) {
        filterString = AddToFilter(filterString,"type = 'beamtime'","and");
    }
    if (!filter.showBeamtime && filter.showSubcollections) {
        filterString =  AddToFilter(filterString,"type = 'collection'","and");
    }

    if (!filter.showBeamtime && !filter.showSubcollections) {
        filterString = AddToFilter(filterString,"type = 'bla'","and");
    }

    filter.fieldFilters.forEach( fieldFilter => {
        if (fieldFilter.enabled) {
            filterString = AddToFilter(filterString,fieldFilter.key+(fieldFilter.negate?" != '":" = '")+fieldFilter.value+"'","and");
        }
    })

    if (filter.dateTo && filter.dateFrom) {
        let endDate = new Date(filter.dateTo.valueOf())
        endDate.setDate(endDate.getDate() + 1 )
        let filter1 = AddToFilter("","eventStart >= isodate('" + filter.dateFrom.toISOString()+"')","and");
        filter1 = AddToFilter(filter1,"eventStart <= isodate('" + endDate.toISOString()+"')","and");
        let filter2 = AddToFilter("","eventEnd >= isodate('" + filter.dateFrom.toISOString()+"')","and");
        filter2 = AddToFilter(filter2,"eventEnd <= isodate('" + endDate.toISOString()+"')","and");
        let filter3 = AddToFilter("","eventEnd >= isodate('" + endDate.toISOString()+"')","and");
        filter3 = AddToFilter(filter3,"eventStart <= isodate('" + filter.dateFrom.toISOString()+"')","and");
        let filterRange = AddToFilter(filter1,filter2,"or")
        filterRange = AddToFilter(filterRange,filter3,"or")
        filterString =  AddToFilter(filterString,filterRange,"and");
    }

    if (filter.textSearch === "") {
        return filterString;
    }

    filterString = AddToFilter(filterString,"jsonString regexp '" + filter.textSearch + "'","and");

    return filterString
}