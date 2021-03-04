import LogbookItem from "./LogbookItem";
import {GroupedVirtuoso, GroupedVirtuosoMethods} from "react-virtuoso";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {LogEntryMessage} from "../../generated/graphql";
import {getSplitedDate} from "./LogbookUtils";
import LogbookGroupHeader from "./LogbookGroupHeader";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        messageLogRoot: {
            minHeight: theme.spacing(32),
        },
        smallText: {
            color: theme.palette.text.hint,
            fontSize: '0.8em',
        },
    }));

interface LogbookMessageTimelineByDatetimeProps {
    messages: LogEntryMessage[];
    onVisibleGroupChanged: (groupValue: string) => void;
}

const LogbookMessageTimelineByDatetime = forwardRef(({ messages, onVisibleGroupChanged }: LogbookMessageTimelineByDatetimeProps, ref) => {
    const classes = useStyles();

    const [groups, setGroups] = React.useState<string[]>([]);
    const [groupSizes, setGroupSizes] = React.useState<number[]>([]);

    const virtuoso = useRef<GroupedVirtuosoMethods>(null);
    const [groupIndices, setGroupIndices] = useState([]);
    const [currentGroup, setCurrentGroup] = useState('');

    useImperativeHandle(ref, () => ({
        scrollToGroup: (fullDate: string) => {
            const idx = groups.indexOf(fullDate);
            if (idx !== -1) {
                virtuoso.current?.scrollToIndex(groupIndices[idx]);
            }
        }
    }));

    useEffect(() => {
        const groupByFullDate: {[date: string]: LogEntryMessage[]} = {};
        for (const message of messages) {
            const { full } = getSplitedDate(new Date(message.time));

            let groupArrayRef = groupByFullDate[full];
            if (groupArrayRef == undefined) {
                groupArrayRef = groupByFullDate[full] = [];
            }
            groupArrayRef.push(message);
        }

        setGroups(Object.keys(groupByFullDate));
        setGroupSizes(Object.values(groupByFullDate).map(group => group.length));

    }, [messages]);

    useEffect(() => {
        onVisibleGroupChanged(currentGroup);
    }, [currentGroup]);

    return (
    <GroupedVirtuoso
        ref={virtuoso}
        className={classes.messageLogRoot}
        computeItemKey={index => `message,${messages[index].time}`}
        groupIndices={(indices: any) => {
            if (groupIndices.length !== indices.length) {
                setGroupIndices(indices);
            }
        }}
        style={{flex: '1', marginTop: 8}}
        groupCounts={groupSizes}
        group={(index) => {
            return <LogbookGroupHeader key={`header,${groups[index]}`}><span>{groups[index]} <span className={classes.smallText}>({groupSizes[index]} entries)</span></span></LogbookGroupHeader>;
        }}
        item={(index) => {
            return <LogbookItem key={`message,${messages[index].id}`} message={messages[index]}/>;
        }}

        rangeChanged={({startIndex}) => {
            let countLeft = startIndex;
            let group: string | undefined;
            for (let i = 0; i < groupSizes.length; i++){
                const groupSize = groupSizes[i] + 1/*header*/;
                if (countLeft - groupSize <= 0) {
                    group = groups[i];
                    break;
                }
                countLeft -= groupSize;
            }
            if (group && group !== currentGroup) {
                setCurrentGroup(group);
            }
        }}

    />);
});

export default LogbookMessageTimelineByDatetime;
