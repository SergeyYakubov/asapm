import {LogEntryMessage} from "../../../generated/graphql";
import React, {useEffect} from "react";
import TreeItem from "@material-ui/lab/TreeItem";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import {createStyles, makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(() =>
    createStyles({
        treeRoot: {
            width: '100%',
        },
    }),
);

export function TreeBodyByBeamtime({
                                       messages,
                                       currentVisibleGroup,
                                       onGroupSelected
                                   }: { messages: LogEntryMessage[], currentVisibleGroup: string, onGroupSelected: (fullDate: string) => void }): JSX.Element {
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState('');

    interface SubCollectionTree {
        [subCollection: string]: SubCollectionTree;
    }

    const [preGroupByFacility, setPreGroupByFacility] = React.useState<{ [facility: string]: { [beamtime: string]: SubCollectionTree } }>({});

    useEffect(() => {
        const preGroupByFacilityLocal: { [facility: string]: { [beamtime: string]: SubCollectionTree } } = {};
        for (const message of messages) {
            let preGroupFacilityRef = preGroupByFacilityLocal[message.facility];
            if (preGroupFacilityRef == undefined) {
                preGroupFacilityRef = preGroupByFacilityLocal[message.facility] = {};
            }

            if (!message.beamtime) {
                continue;
            }

            let beamtimeRef = preGroupFacilityRef[message.beamtime!];
            if (beamtimeRef == undefined) {
                beamtimeRef = preGroupFacilityRef[message.beamtime!] = {};
            }

            if (message.subCollection) {
                const collectionParts = message.subCollection.split('.');
                let currRef = beamtimeRef;
                for (const collectionPart of collectionParts) {
                    if (!currRef[collectionPart]) {
                        currRef[collectionPart] = {};
                        currRef = currRef[collectionPart];
                    }
                }
            }
        }

        setPreGroupByFacility(preGroupByFacilityLocal);
    }, [messages]);

    useEffect(() => {
        easyTreeSelect(currentVisibleGroup);
    }, [currentVisibleGroup]);

    function easyTreeSelect(groupName: string) {
        const [facility, beamtime] = groupName.split('@');


        const newExpanded = [`facility:${facility}`];
        if (beamtime) {
            let combinedBeamtime = '';
            for (const collectionPart of beamtime.split('.')) {
                if (combinedBeamtime) {
                    combinedBeamtime += '.';
                }
                combinedBeamtime += collectionPart;
                newExpanded.push(`facility:${facility},beamtime:${combinedBeamtime}`);
            }
        }

        console.log('in easy select: newExpanded', newExpanded);
        setExpanded(newExpanded);
        setSelected(newExpanded[newExpanded.length - 1]);
    }

    function handleSelect(event: React.ChangeEvent<any>, nodeId: string) {
        const [rawFacility, rawBeamtime] = nodeId.split(',');
        const facility = rawFacility.slice('facility:'.length);

        let newSelection = facility;
        if (rawBeamtime) {
            const beamtime = rawBeamtime.slice('beamtime:'.length);
            newSelection += `@${beamtime}`;
        }

        console.log(newSelection);
        onGroupSelected(newSelection);
    }

    const classes = useStyles();

    function recursiveCreateBeamlineNode(facility: string, preable: string, next: SubCollectionTree): JSX.Element[] | JSX.Element {
        return Object.keys(next).sort((a, b) => a.localeCompare(b)).map((subCollection) =>
            <TreeItem key={`tree,facility:${facility},beamtime:${preable}.${subCollection}`}
                      nodeId={`facility:${facility},beamtime:${preable}.${subCollection}`}
                      label={`.${subCollection}`}>
                {recursiveCreateBeamlineNode(facility, `${preable}.${subCollection}`, next[subCollection])}
            </TreeItem>
        );
    }

    return <TreeView
        className={classes.treeRoot}
        defaultCollapseIcon={<ExpandMoreIcon/>}
        defaultExpandIcon={<ChevronRightIcon/>}
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
    >
        {
            Object.keys(preGroupByFacility).sort((a, b) => a.localeCompare(b)).map((facility) =>
                <TreeItem key={`tree,facility:${facility}`} nodeId={`facility:${facility}`} label={facility}>
                    {
                        Object.keys(preGroupByFacility[facility]).sort((a, b) => a.localeCompare(b)).map((beamtime) =>
                            <TreeItem key={`tree,facility:${facility},beamtime:${beamtime}`}
                                      nodeId={`facility:${facility},beamtime:${beamtime}`} label={beamtime}>
                                {recursiveCreateBeamlineNode(facility, beamtime, preGroupByFacility[facility][beamtime])}
                            </TreeItem>)
                    }
                </TreeItem>
            )
        }
    </TreeView>;
}
