import {IsoDateToStr, TableData} from "./common";
import {BeamtimeMeta, CollectionEntry, UniqueField} from "./generated/graphql";


export function TableDataFromMeta(meta: BeamtimeMeta, section: string): TableData {
    switch (section) {
        case "Beamtime":
            return [
                {name: 'Beamtime ID', value: meta.id},
                {name: 'Facility', value: meta.facility || "undefined"},
                {name: 'Beamline', value: meta.beamline || "undefined"},
                {name: 'Generated', value: IsoDateToStr(meta.generated)},
                {name: 'Start', value: IsoDateToStr(meta.eventStart)},
                {name: 'End', value: IsoDateToStr(meta.eventEnd)},
            ];
        case "Proposal":
            return [
                {name: 'Proposal ID', value: meta.proposalId || "undefined"},
                {name: 'Type', value: meta.proposalType || "undefined"},
                {name: 'Principal Investigator', value: meta.pi?.lastname || "undefined", data: meta.pi},
                {name: 'Leader', value: meta.leader?.lastname || "undefined", data: meta.leader},
                {name: 'Applicant', value: meta.applicant?.lastname || "undefined", data: meta.applicant},
            ];
        case "Analysis":
            return [
                {name: 'Core path', value: meta.corePath || "undefined"},
                {name: 'Online', value: meta.onlineAnalysis ? "Requested" : "Not requested", data: meta.onlineAnalysis},
            ];
    }
    return [];
}

export function TableDataFromCollection(meta: CollectionEntry, section: string): TableData {
            return [
                {name: 'ID', value: meta.id},
                {name: 'Beamtime ID', value: meta.parentBeamtimeMeta!.id},
                {name: 'Facility', value: meta.parentBeamtimeMeta!.facility || "undefined"},
                {name: 'Beamline', value: meta.parentBeamtimeMeta!.beamline || "undefined"},
                {name: 'Start', value: meta.eventStart?meta.eventStart.toString():""},
                {name: 'End', value: IsoDateToStr(meta.eventEnd)},
            ];
}

export function GetUniqueNamesForField(fields : UniqueField[] | undefined,name : string): UniqueField {
    if (!fields) {
        return {keyName:name,values:[]};
    }
    const field =  fields.find(field => field.keyName === name);
    if (field) {
        return field;
    } else {
        return {keyName:name,values:[]};
    }
}