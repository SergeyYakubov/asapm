import {useQuery} from "@apollo/client";
import {
    CollectionFilterBox,
    collectionFilterVar,
    CollectionFilterData,
    GET_COLLECTION_FILTER,
    Mode
} from "../components/FilterBoxes";
import Grid from "@material-ui/core/Grid";
import React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import {GetFilterString, GetOrderBy} from "../common";
import Paper from "@material-ui/core/Paper";
import {gql, makeVar} from "@apollo/client";
import {CollectionEntry, Query, QueryCollectionsArgs} from "../generated/graphql";
import {VirtualizedCollectionTable} from "../components/VirtualizedTable";
import {COLLECTIONS} from "../graphQLSchemes";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth: 0,
        },
        columnsHeader: {
            margin: theme.spacing(1),
            marginBottom: theme.spacing(2),
        },
        columnFieldText: {
            fontSize: '0.9rem',
        },
        toolBox: {
            margin: theme.spacing(0),
            background: theme.palette.background.paper
        },
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
        secondaryAction: {
            margin: theme.spacing(0),
        },

    }),
);

export type ColumnItem = {
    fieldName: string
    alias: string | undefined
    type: string | undefined
    active: boolean
}

export type ColumnList = ColumnItem[];

function possibleColumnListfromCustomValues(vals: KvObj | null, root: string, columns: ColumnList) {
    if (!vals) return;
    for (const [column, value] of Object.entries(vals)) {
        const fullColumn: string = (root !== "" ? root + "." : "") + column;
        if (!value) continue;
        if (value.constructor.name === "Object") {
            possibleColumnListfromCustomValues(value, fullColumn, columns);
        } else {
            if (!columns.find(column => column.fieldName === "customValues." + fullColumn)) {
                columns.push({
                    fieldName: "customValues." + fullColumn,
                    alias: fullColumn.replace(/\./g, '-'),
                    active: false,
                    type: value.constructor.name
                });
            }
        }
    }
}

export function PossibleColumnListfromCollections(currentColumns: ColumnList, collections: CollectionEntry[]  | undefined): ColumnItem[] {
    if (!collections) {
        return [];
    }
    const columns = currentColumns.map(a => Object.assign({}, a));
    collections!.forEach(col => {
        possibleColumnListfromCustomValues(col.customValues, "", columns);
    });
    return columns;
}

export const defaultColumns: ColumnList = [
    {fieldName: "id", alias: "ID", active: true, type: "string"},
    {fieldName: "title", alias: "Title", active: true, type: "string"},
    {fieldName: "parentBeamtimeMeta.id", alias: "Beamtime ID", active: true, type: "string"},
    {fieldName: "parentBeamtimeMeta.beamline", alias: "Beamline", active: true, type: "string"},
    {fieldName: "parentBeamtimeMeta.facility", alias: "Facility", active: true, type: "string"},
    {fieldName: "parentBeamtimeMeta.users.doorDb", alias: "Door users", active: true, type: "Array"},
    {fieldName: "eventStart", alias: "Started At", active: true, type: "Date"},
];

export const columnsVar = makeVar<ColumnList>(
    defaultColumns
);


export const GET_COLUMNS = gql`
  query GetColumns {
    columns @client
  }
`;

export interface ColumnData {
    columns: ColumnList;
}


let oldCollections : CollectionEntry[] | undefined;

function CollectionListPage(): JSX.Element {
    const classes = useStyles();
    const {data} = useQuery<CollectionFilterData>(GET_COLLECTION_FILTER);
    const filter = data!.collectionFilter;

    const queryResult = useQuery<Query, QueryCollectionsArgs>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: GetFilterString(filter), orderBy: GetOrderBy(filter)}
    });

    if (queryResult.data) {
        oldCollections = [...queryResult.data.collections];
    } else
    if ( queryResult.error) {
        console.log(queryResult.error);
        oldCollections = undefined;
    }

    return (
        <div className={classes.root}>
            <CollectionFilterBox queryResult={queryResult} filter={filter} mode={Mode.Collections} filterVar={collectionFilterVar}/>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider/>
                </Grid>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <VirtualizedCollectionTable oldCollections={oldCollections} queryResult={queryResult} filter={filter}/>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default CollectionListPage;
