import {LogEntryMessage} from "../../../generated/graphql";
import React, {useEffect} from "react";
import {getSplitedDate, monthIdxToText} from "../LogbookUtils";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";
import {createStyles, makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(() =>
    createStyles({
        treeRoot: {
            width: '100%',
        },
    }),
);

export function TreeBodyByDatetime({
                                       messages,
                                       currentVisibleGroup,
                                       onDateSelected
                                   }: { messages: LogEntryMessage[], currentVisibleGroup: string, onDateSelected: (fullDate: string) => void }): JSX.Element {
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState('');

    const [preGroupByYear, setPreGroupByYear] = React.useState<{ [year: string]: { [month: number]: string[] } }>({});

    useEffect(() => {
        const preGroupByYearLocal: { [year: number]: { [month: number]: string[] } } = {};
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
        easyTreeSelect(currentVisibleGroup);
    }, [currentVisibleGroup]);

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
            const [month, year] = nodeId.slice('month:'.length).split(',');
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
        defaultCollapseIcon={<ExpandMoreIcon/>}
        defaultExpandIcon={<ChevronRightIcon/>}
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
    >
        {
            Object.keys(preGroupByYear).sort((a, b) => Number(b) - Number(a)).map(year =>
                <TreeItem key={`tree,year:${year}`} nodeId={`year:${year}`} label={year}>
                    {Object.keys(preGroupByYear[year]).slice().reverse().map(month =>
                        <TreeItem key={`tree,month:${month},year:${year}`} nodeId={`month:${month},${year}`}
                                  label={monthIdxToText(Number(month))}>
                            {preGroupByYear[year][Number(month)].map(date =>
                                <TreeItem key={`tree,date:${date}`} nodeId={`date:${date}`} label={date}/>
                            )}
                        </TreeItem>
                    )}
                </TreeItem>
            )
        }
    </TreeView>;
}
