import {Box, FormControl, InputLabel, MenuItem, Select} from "@material-ui/core";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";
import React, {ChangeEvent, useEffect} from "react";
import {LogEntryMessage} from "../../generated/graphql";
import {getSplitedDate, monthIdxToText} from "./LogbookUtils";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {OrderType} from "../../pages/LogbooksPage";

const useStyles = makeStyles(() =>
    createStyles({
        treeRoot: {
            width: '100%',
        },
    }),
);

function TreeBodyByYear({ messages, currentVisibleDate, onDateSelected }: { messages: LogEntryMessage[], currentVisibleDate: string, onDateSelected: (fullDate: string) => void }): JSX.Element {
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState('');

    const [preGroupByYear, setPreGroupByYear] = React.useState<{ [year: string]: { [month: number]: string[] }}>({});

    useEffect(() => {
        const preGroupByYearLocal: {[year: number]: { [month: number]: string[] }} = {};
        for (const message of messages) {
            const {full, monthIdx, year} = getSplitedDate(new Date(message.time));

            let preGroupArrayRef = preGroupByYearLocal[year];
            if (preGroupArrayRef == undefined) {
                preGroupArrayRef = preGroupByYearLocal[year] = {};
            }
            let preGroupMonthArrayRef = preGroupArrayRef[monthIdx];
            if (preGroupMonthArrayRef == undefined) {
                preGroupMonthArrayRef = preGroupArrayRef[monthIdx] = [];
            }
            if (!preGroupMonthArrayRef.includes(full)) {
                preGroupMonthArrayRef.push(full);
            }
        }

        setPreGroupByYear(preGroupByYearLocal);
    }, [messages]);

    useEffect(() => {
        easyTreeSelect(currentVisibleDate);
    }, [currentVisibleDate]);

    function easyTreeSelect(fullDate: string) {
        const [/*day*/, month, year] = fullDate.split('.');
        setExpanded([`year:${year}`, `month:${Number(month) - 1},${year}`]);
        setSelected(`date:${fullDate}`);
    }

    function handleSelect(event: React.ChangeEvent<any>, nodeId: string) {
        if (nodeId.startsWith('date:')) {
            const date = nodeId.slice('date:'.length);
            onDateSelected(date);
        } else if (nodeId.startsWith('month:')) {
            const [month,year] = nodeId.slice('month:'.length).split(',');
            const lastDateInMonth = preGroupByYear[year][Number(month)][0];
            onDateSelected(lastDateInMonth);
        } else if (nodeId.startsWith('year:')) {
            const year = nodeId.slice('year:'.length);
            const monthThisYear = Object.keys(preGroupByYear[year]);
            const lastMonthThisYear = monthThisYear.pop();
            const lastDateInYear = preGroupByYear[year][Number(lastMonthThisYear)][0];
            onDateSelected(lastDateInYear);
        }
    }

    const classes = useStyles();

    return <TreeView
        className={classes.treeRoot}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
    >
        {
            Object.keys(preGroupByYear).sort((a, b) => Number(b) - Number(a)).map(year =>
                <TreeItem key={`tree,year:${year}`} nodeId={`year:${year}`} label={year}>
                    {Object.keys(preGroupByYear[year]).slice().reverse().map(month =>
                        <TreeItem key={`tree,month:${month},year:${year}`} nodeId={`month:${month},${year}`} label={monthIdxToText(Number(month))}>
                            {preGroupByYear[year][Number(month)].map(date =>
                                <TreeItem key={`tree,date:${date}`} nodeId={`date:${date}`} label={date} />
                            )}
                        </TreeItem>
                    )}
                </TreeItem>
            )
        }
    </TreeView>;
}

function TreeBodyByFacility({ messages, currentVisibleDate, onDateSelected }: { messages: LogEntryMessage[], currentVisibleDate: string, onDateSelected: (fullDate: string) => void }): JSX.Element {
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState('');

    const [preGroupByFacility, setPreGroupByFacility] = React.useState<{ [facility: string]: { [year: string]: { [month: number]: string[] }}}>({});

    useEffect(() => {
        const preGroupByFacilityLocal: { [facility: string]: { [year: string]: { [month: number]: string[] }}} = {};
        for (const message of messages) {
            const {full, monthIdx, year} = getSplitedDate(new Date(message.time));

            let preGroupFacilityRef = preGroupByFacilityLocal[message.facility];
            if (preGroupFacilityRef == undefined) {
                preGroupFacilityRef = preGroupByFacilityLocal[message.facility] = {};
            }
            let preGroupYearArrayRef = preGroupFacilityRef[year];
            if (preGroupYearArrayRef == undefined) {
                preGroupYearArrayRef = preGroupFacilityRef[year] = {};
            }
            let preGroupMonthArrayRef = preGroupYearArrayRef[monthIdx];
            if (preGroupMonthArrayRef == undefined) {
                preGroupMonthArrayRef = preGroupYearArrayRef[monthIdx] = [];
            }
            if (!preGroupMonthArrayRef.includes(full)) {
                preGroupMonthArrayRef.push(full);
            }
        }

        setPreGroupByFacility(preGroupByFacilityLocal);
    }, [messages]);

    useEffect(() => {
        easyTreeSelect(currentVisibleDate);
    }, [currentVisibleDate]);

    function easyTreeSelect(fullDateWithFacility: string) {
        const [fullDate, facility] = fullDateWithFacility.split(',');
        const [/*day*/, month, year] = fullDate.split('.');
        setExpanded([`facility:${facility}`, `year:${year},${facility}`, `month:${Number(month) - 1},${year},${facility}`]);
        setSelected(`date:${fullDate},${facility}`);
    }

    function handleSelect(event: React.ChangeEvent<any>, nodeId: string) {
        if (nodeId.startsWith('date:')) {
            const [date, facility] = nodeId.slice('date:'.length).split(',');
            onDateSelected(`${date},${facility}`);
        } else if (nodeId.startsWith('month:')) {
            const [month, year, facility] = nodeId.slice('month:'.length).split(',');
            const preGroupByYear = preGroupByFacility[facility];
            const lastDateInMonth = preGroupByYear[year][Number(month)][0];
            onDateSelected(`${lastDateInMonth},${facility}`);
        } else if (nodeId.startsWith('year:')) {
            const [year, facility] = nodeId.slice('year:'.length).split(',');
            const preGroupByYear = preGroupByFacility[facility];
            const monthThisYear = Object.keys(preGroupByYear[year]);
            const lastMonthThisYear = monthThisYear.pop();
            const lastDateInYear = preGroupByYear[year][Number(lastMonthThisYear)][0];
            onDateSelected(`${lastDateInYear},${facility}`);
        } else if (nodeId.startsWith('facility:')) {
            const facility = nodeId.slice('facility:'.length);
            const years = Object.keys(preGroupByFacility[facility]);
            const lastYear = years.pop()!;
            const preGroupByYear = preGroupByFacility[facility];
            const monthThisYear = Object.keys(preGroupByYear[lastYear]);
            const lastMonthThisYear = monthThisYear.pop();
            const lastDateInYear = preGroupByYear[lastYear][Number(lastMonthThisYear)][0];
            onDateSelected(`${lastDateInYear},${facility}`);
        }
    }

    const classes = useStyles();

    return <TreeView
        className={classes.treeRoot}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
    >
        {
            Object.keys(preGroupByFacility).sort((a, b) => a.localeCompare(b)).map((facility) =>
                <TreeItem key={`tree,facility:${facility}`} nodeId={`facility:${facility}`} label={facility}>
                    {Object.keys(preGroupByFacility[facility]).sort((a, b) => Number(b) - Number(a)).map(year =>
                        <TreeItem key={`tree,year:${year},facility:${facility}`} nodeId={`year:${year},${facility}`} label={year}>
                            {Object.keys(preGroupByFacility[facility][year]).slice().reverse().map(month =>
                                <TreeItem key={`tree,month:${month},year:${year},facility:${facility}`} nodeId={`month:${month},${year},${facility}`} label={monthIdxToText(Number(month))}>
                                    {preGroupByFacility[facility][year][Number(month)].map(date =>
                                        <TreeItem key={`tree,facility:${facility},date:${date}`} nodeId={`date:${date},${facility}`} label={date} />
                                    )}
                                </TreeItem>
                            )}
                        </TreeItem>
                    )}
                </TreeItem>
            )
        }
    </TreeView>;
}


interface LogbookSelectionTreeProps {
    messages: LogEntryMessage[];
    currentVisibleDate: string;
    onDateSelected: (fullDate: string) => void;
    orderBy: OrderType;
    onOrderByChanged: (newOrderType: OrderType) => void;
}

function LogbookSelectionTree({ messages, currentVisibleDate, onDateSelected, orderBy, onOrderByChanged }: LogbookSelectionTreeProps): JSX.Element {
    // const classes = useStyles();

    return <div style={{ minWidth: '220px', marginRight: '8px', overflowY: 'auto' }}>
        <Box style={{ marginBottom: '8px' }}>
            <FormControl fullWidth={true}>
                <InputLabel id="order-by-label">Order by</InputLabel>
                <Select
                    labelId="order-by-label"
                    id="order-by"
                    value={orderBy}
                    onChange={(e: ChangeEvent<{ value: unknown }>) => onOrderByChanged(e.target.value as OrderType)}
                >
                    <MenuItem value={'datetime'}>Datetime</MenuItem>
                    <MenuItem value={'facility'}>Facility</MenuItem>
                    <MenuItem value={'facility_and_beamtime'}>Facility &amp; BeamTime</MenuItem>
                </Select>
            </FormControl>
        </Box>
        {
            {
            ['datetime']: <TreeBodyByYear messages={messages} currentVisibleDate={currentVisibleDate} onDateSelected={onDateSelected} />,
            ['facility']: <TreeBodyByFacility messages={messages} currentVisibleDate={currentVisibleDate} onDateSelected={onDateSelected} />,
            ['facility_and_beamtime']: <div />,
            }[orderBy]
        }
    </div>;
}

export default LogbookSelectionTree;
