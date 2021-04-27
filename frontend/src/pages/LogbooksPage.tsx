import React, {createRef, useEffect, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {useQuery} from "@apollo/client";
import {
    BeamtimeMeta,
    LogEntryMessage,
    Query
} from "../generated/graphql";
import {LOG_MESSAGES} from "../graphQLSchemes";
import LogbookNewEntryCreator from "../components/Logbook/LogbookNewEntryCreator";
import LogbookSelectionTree from "../components/Logbook/Tree/LogbookSelectionTree";
import LogbookMessageTimelineByDatetime from "../components/Logbook/Timeline/LogbookMessageTimelineByDatetime";
import LogbookMessageTimelineByFacility from "../components/Logbook/Timeline/LogbookMessageTimelineByFacility";
import LogbookMessageTimelineByBeamtime from "../components/Logbook/Timeline/LogbookMessageTimelineByBeamtime";
import LogbookFilter from "../components/Logbook/LogbookFilter";
import LogbookTimeline from "../components/Logbook/Timeline/LogbookTimeline";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        logbookPageRoot: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
            display: 'flex',
        },
    }),
);


interface LogbooksPageProps {
    prefilledBeamtimeId?: BeamtimeMeta['id'];
    prefilledSubCollection?: BeamtimeMeta['id'];
}

export type OrderType = 'datetime' | /*'facility' |*/ 'beamtime';

function LogbooksPage(props: LogbooksPageProps): JSX.Element {
    const classes = useStyles();

    let filter = '';
    if (props.prefilledBeamtimeId) {
        filter += `beamtime="${props.prefilledBeamtimeId}"`;
        if (props.prefilledSubCollection) {
            console.log('prefilledSubCollection', props.prefilledSubCollection);
            filter += `AND subCollection="${props.prefilledSubCollection}"`;
        }
    }

    const queryResult = useQuery<Query, { filter: string }>(LOG_MESSAGES, {
        pollInterval: 5000,
        variables: {filter}//GetFilterString(filter), orderBy: "id"
    });

    const $messageLog = createRef<any>();

    const [messages, setMessages] = useState<LogEntryMessage[]>([]);
    const [currentVisibleGroup, setCurrentVisibleGroup] = useState('');

    useEffect(() => {
        if (queryResult.error) {
            setMessages([]);
            console.log("collection query error" + queryResult.error);
        }
        if (!queryResult.loading) {
            if (queryResult.data?.logEntries?.entries) {
                const localMessages = queryResult.data!.logEntries!.entries;
                const sortedMessages = localMessages.slice().sort(((a, b) => (Number(new Date(b.time)) - Number(new Date(a.time)))));

                console.log('setMessages', sortedMessages);
                setMessages(sortedMessages);
            }
        }
    }, [queryResult.error, queryResult.loading, queryResult.data]);


    const hasPrefilledCondition = !!props.prefilledBeamtimeId;

    const [orderBy, setOrderBy] = React.useState<OrderType>('datetime');

    return <div className={classes.logbookPageRoot}>
            <div style={{ flex: '1', display: 'flex' }}>
                { hasPrefilledCondition ? null :
                    <LogbookSelectionTree messages={messages} currentVisibleGroup={currentVisibleGroup} onGroupSelected={(fullDate) => {
                        $messageLog.current?.scrollToGroup(fullDate);
                    }}
                                          orderBy={orderBy}
                                          onOrderByChanged={(newOrderBy) => {
                        setOrderBy(newOrderBy);
                    }} />
                }
                <div style={{ flex: '1', display: 'flex' }}>
                    <div style={{ flex: '1', display: 'flex' }}>
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                            <LogbookNewEntryCreator prefilledBeamtime={props.prefilledBeamtimeId} prefilledSubcollection={props.prefilledSubCollection} />
                            <LogbookFilter />
                            <LogbookTimeline orderBy={orderBy} forwardedRef={$messageLog} messages={messages} onVisibleGroupChanged={(fullDate) => setCurrentVisibleGroup(fullDate)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>;
}


export default LogbooksPage;
