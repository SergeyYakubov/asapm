/*
export enum GroupMessagesBy {
    DateTime,
    //Facillity,
    //Beamtime,
}
 */

export interface LogbookUniqueFields {
    facilities: string[];
    beamtimes: string[];
}

const monthToText = [
    'January',
    'February',
    'March',
    'April',
    'Mai',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export function monthIdxToText(monthIdx: number): string {
    return monthToText[monthIdx];
}

export function getSplitedDate(date: Date): { full: string, monthIdx: number, year: number} {
    const full = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear())}`;

    return {
        monthIdx: date.getMonth(),
        year: date.getFullYear(),
        full,
    };
}
