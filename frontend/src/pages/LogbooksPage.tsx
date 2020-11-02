import Grid from "@material-ui/core/Grid";
import React, {useEffect, useRef, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import {GroupedVirtuoso} from "react-virtuoso";
import LogbookItem, {ItemDefinition} from "../components/Logbook/LogbookItem";
import {useQuery} from "@apollo/client";
import {LogEntry, LogEntryMessage, Query, QueryCollectionsArgs} from "../generated/graphql";
import {LOG_MESSAGES} from "../graphQLSchemes";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
        },
    }),
);


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


function getDate(date: Date): { full: string, month: string, year: number} {
    const full = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear())}`;

    return {
        month: monthToText[date.getMonth()],
        year: date.getFullYear(),
        full,
    };
}

/*
const { messages, groups, groupCounts, preGroupByYear } = (() => {
    const messages: ItemDefinition[] = [];

    let lastTimestamp = 1_600_000_000_000;
    for (let i = 0; i < 50; i++) {
        lastTimestamp += Math.random() * 50_000_000;
        messages.push({
            time: new Date(lastTimestamp),
            message: `Message${i}`,
        });
    }

    const preGroupByYear: {[year: number]: { [month: string]: string[] }} = {};
    const groupByDate: {[date: string]: ItemDefinition[]} = {};
    for (const message of messages) {
        const {full, month, year} = getDate(message.time);

        let groupArrayRef = groupByDate[full];
        if (groupArrayRef == undefined) {
            groupArrayRef = groupByDate[full] = [];
        }
        groupArrayRef.push(message);

        let preGroupArrayRef = preGroupByYear[year];
        if (preGroupArrayRef == undefined) {
            preGroupArrayRef = preGroupByYear[year] = {};
        }
        let preGroupMonthArrayRef = preGroupArrayRef[month];
        if (preGroupMonthArrayRef == undefined) {
            preGroupMonthArrayRef = preGroupArrayRef[month] = [];
        }
        if (!preGroupMonthArrayRef.includes(full)) {
            preGroupMonthArrayRef.push(full);
        }
    }

    const groups = Object.keys(groupByDate);
    const groupCounts = Object.values(groupByDate).map((x) => x.length);

    return {
        messages,
        groups,
        groupCounts,
        preGroupByYear,
    };
})();
*/

function LogbooksPage(): JSX.Element {
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState([] as string[]);
    const [selected, setSelected] = React.useState('');
    const [useLocalTime, setUseLocalTime] = React.useState(false);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [groupSizes, setGroupSizes] = React.useState<number[]>([]);
    const [preGroupByYear, setPreGroupByYear] = React.useState<{ [year: string]: { [month: string]: string[] }}>({});

    const handleToggle = (event: React.ChangeEvent<any>, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (event: React.ChangeEvent<any>, nodeId: string) => {
        setSelected(nodeId);
    };

    const queryResult = useQuery<Query, QueryCollectionsArgs>(LOG_MESSAGES, {
        pollInterval: 5000,
        //variables: {filter: GetFilterString(filter), orderBy: "id"}
    });

    const [messages, setMessages] = React.useState<LogEntryMessage[]>([]);
    useEffect(() => {
        console.log('FINDME', queryResult);
        if (queryResult.error) {
            setMessages([]);
            console.log("collection query error" + queryResult.error);
        }
        if (queryResult.loading === false && queryResult.data?.logEntries?.entries) {
            console.log('findme 2');
            const localMessages = queryResult.data!.logEntries!.entries;
            const preGroupByYearLocal: {[year: number]: { [month: string]: string[] }} = {};
            const groupByDate: {[date: string]: LogEntryMessage[]} = {};
            for (const message of localMessages) {
                const {full, month, year} = getDate(new Date(message.time));

                let groupArrayRef = groupByDate[full];
                if (groupArrayRef == undefined) {
                    groupArrayRef = groupByDate[full] = [];
                }
                groupArrayRef.push(message);

                let preGroupArrayRef = preGroupByYearLocal[year];
                if (preGroupArrayRef == undefined) {
                    preGroupArrayRef = preGroupByYearLocal[year] = {};
                }
                let preGroupMonthArrayRef = preGroupArrayRef[month];
                if (preGroupMonthArrayRef == undefined) {
                    preGroupMonthArrayRef = preGroupArrayRef[month] = [];
                }
                if (!preGroupMonthArrayRef.includes(full)) {
                    preGroupMonthArrayRef.push(full);
                }
            }

            setMessages(localMessages);
            setGroups(Object.keys(groupByDate));
            setGroupSizes(Object.values(groupByDate).map(group => group.length));
            setPreGroupByYear(preGroupByYearLocal);
            console.log('abc', localMessages);
        }
    }, [queryResult.error, queryResult.loading, queryResult.data, setMessages]);

    const virtuoso = useRef<any>(null);
    const [groupIndices, setGroupIndices] = useState([]);

    console.log(virtuoso);
    return (
        <div className={classes.root}>
            <Grid container spacing={1}>
                <Grid item xs={2}>
                    <TreeView
                    className={classes.root}
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    expanded={expanded}
                    selected={selected}
                    onNodeToggle={handleToggle}
                    onNodeSelect={handleSelect}
                    >
                        {
                            Object.keys(preGroupByYear).map(year =>
                            <TreeItem key={`tree,year:${year}`} nodeId={`year:${year}`} label={year}>
                                {Object.keys(preGroupByYear[year as any]).map(month =>
                                    <TreeItem key={`tree,month:${month}`} nodeId={`month:${month}`} label={month}>
                                        {preGroupByYear[year as any][month].map(date =>
                                            <TreeItem key={`tree,date:${date}`} nodeId={`date:${date}`} label={date} />
                                        )}
                                    </TreeItem>
                                )}
                            </TreeItem>
                            )
                        }
                    </TreeView>
                </Grid>
                <Grid item xs={10}>
                    <div style={{ display: 'flex' }}>
                        <div>
                            <GroupedVirtuoso
                                ref={virtuoso}
                                computeItemKey={index => `message,${messages[index].time}`}
                                groupIndices={(indices: any) => {
                                    if (groupIndices.length !== indices.length) {
                                        setGroupIndices(indices);
                                        console.log(indices);
                                        //setSelected(`date:${groups[indices]}`);
                                    }
                                }}
                                style={{ height: 500, width: 500 }}
                                groupCounts={groupSizes}
                                group={(index) => {
                                    //console.log('Iwas called');
                                    return <p>{groups[index]} ({groupSizes[index]} entries)</p>;
                                }}
                                item={(index) => {
                                    //console.log('Iwas called2');
                                    return <LogbookItem key={`message,${messages[index].time}`} message={messages[index]} />;
                                }}
                                rangeChanged={({ startIndex, endIndex }) => {
                                    let left = startIndex;
                                    let idx = 0;
                                    while (left > 0 && idx < groupSizes.length) {
                                        left -= groupSizes[idx];
                                        if (left <= 0) {
                                            break;
                                        }
                                        idx++;
                                    }
                                    console.log('idx: ', idx, groups[idx]);
                                    setSelected(`date:${groups[idx]}`);
                                }}
                            />
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    );
}


export default LogbooksPage;
