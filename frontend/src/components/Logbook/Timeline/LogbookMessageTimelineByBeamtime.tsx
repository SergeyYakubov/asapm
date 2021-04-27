import LogbookItem from "../LogbookItem";
import {GroupedVirtuoso, GroupedVirtuosoMethods} from "react-virtuoso";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {LogEntryMessage} from "../../../generated/graphql";
import LogbookGroupHeader from "../LogbookGroupHeader";
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

interface LogbookMessageTimelineByBeamtimeProps {
    messages: LogEntryMessage[];
    onVisibleGroupChanged: (groupValue: string) => void;
}

const LogBookMessageTimelineByBeamtime = forwardRef(({ messages, onVisibleGroupChanged }: LogbookMessageTimelineByBeamtimeProps, ref) => {
    const classes = useStyles();

    const [groups, setGroups] = React.useState<string[]>([]);
    const [groupSizes, setGroupSizes] = React.useState<number[]>([]);

    const virtuoso = useRef<GroupedVirtuosoMethods>(null);
    const [groupIndices, setGroupIndices] = useState([]);
    const [currentGroup, setCurrentGroup] = useState('');

    useImperativeHandle(ref, () => ({
        scrollToGroup: (groupString: string) => {
            // this function is a bit more complicated than the others.
            // If only a facility is selected and there is no log entry, the tree will bug out.
            // So we search for the first entry of for this facility

            const idx = groups.indexOf(groupString);
            if (idx !== -1) {
                virtuoso.current?.scrollToIndex(groupIndices[idx]);
            } else {
                const [facility, beamtime] = groupString.split('@');
                if (!beamtime) {
                    const facilityOnlyIdx = groups.findIndex(g => g.startsWith(`${facility}@`));
                    if (facilityOnlyIdx !== -1) {
                        virtuoso.current?.scrollToIndex(groupIndices[facilityOnlyIdx]);
                    }
                }
            }
        }
    }));

    function toGroupString(msg: LogEntryMessage): string {
        let result = msg.facility;
        if (msg.beamtime) {
            result += `@${msg.beamtime}`;
            if (msg.subCollection) {
                result += `.${msg.subCollection}`;
            }
        }
        return result;
    }

    useEffect(() => {
        const groupByBeamtime: {[beamtime: string]: LogEntryMessage[]} = {};
        const sortedWrappedMessages = messages.map(msg => ({
            groupString: toGroupString(msg),
            msg,
        })).sort((a, b) => {
            return a.groupString.localeCompare(b.groupString) || (Number(new Date(b.msg.time)) - Number(new Date(a.msg.time)));
        });
        for (const wMsg of sortedWrappedMessages) {
            let groupArrayRef = groupByBeamtime[wMsg.groupString];
            if (groupArrayRef == undefined) {
                groupArrayRef = groupByBeamtime[wMsg.groupString] = [];
            }
            groupArrayRef.push(wMsg.msg);
        }

        setGroups(Object.keys(groupByBeamtime));
        setGroupSizes(Object.values(groupByBeamtime).map(group => group.length));

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
                return messages[index] && <LogbookItem key={`message,${messages[index].id}`} message={messages[index]} displayDate={true}/>;
            }}

            rangeChanged={({startIndex}) => {
                // I want to get the currently visible group so that I can select it in the left tree
                // But this seems to be hidden, so I have to use this workaround
                // https://github.com/petyosi/react-virtuoso/issues/192
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

export default LogBookMessageTimelineByBeamtime;
