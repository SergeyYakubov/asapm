import LogbookMessageTimelineByDatetime from "./LogbookMessageTimelineByDatetime";
import LogbookMessageTimelineByBeamtime from "./LogbookMessageTimelineByBeamtime";
import React from "react";
import {LogEntryMessage} from "../../../generated/graphql";
import {OrderType} from "../../../pages/LogbooksPage";

interface LogbookTimelineProps {
    messages: LogEntryMessage[];
    onVisibleGroupChanged: (groupValue: string) => void;
    forwardedRef: any;
    orderBy: OrderType;
}

export default function LogbookTimeline({messages, onVisibleGroupChanged, forwardedRef, orderBy}: LogbookTimelineProps): JSX.Element {
{
    return {
        ['datetime']: <LogbookMessageTimelineByDatetime ref={forwardedRef} messages={messages} onVisibleGroupChanged={onVisibleGroupChanged} />,
        //['facility']: <LogbookMessageTimelineByFacility ref={forwardedRef} messages={messages} onVisibleGroupChanged={onVisibleGroupChanged} />,
        ['beamtime']: <LogbookMessageTimelineByBeamtime ref={forwardedRef} messages={messages} onVisibleGroupChanged={onVisibleGroupChanged} />,
    }[orderBy];
}
}
