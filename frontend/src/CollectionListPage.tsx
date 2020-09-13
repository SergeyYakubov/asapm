import {useQuery} from "@apollo/client";
import {CollectionDetails} from "./meta";
import Toolbar from "@material-ui/core/Toolbar";
import {CollectionFilterBox} from "./FilterBoxes";
import Grid from "@material-ui/core/Grid";
import React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import MaterialTable from "material-table";
import {TableIcons} from "./TableIcons";
import {CollectionFilter, IsoDateToStr} from "./common";
import {useHistory} from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import {gql, InMemoryCache, makeVar} from "@apollo/client";

import {
    Box,
    Checkbox,
    FormControl, FormControlLabel,
    FormGroup,
    FormLabel,
    IconButton,
    Popover
} from "@material-ui/core";
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth: 0,
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

    }),
);

type CollectionProps = {
    collections: CollectionDetails[]
}

interface BasicCollectionDetails {
    id: String
    type: String
}

type ColumnList = {
    fieldName: string
    alias: string | null
    type: string | null
    active: boolean
}[]

function ValueToString(value: any, columnType: string | undefined) {
    if (!value) {
        return "";
    }
    if (value.constructor.name === "Array") {
        return value.join(", ")
    }

    let strval = value.toString();
    if (columnType === "string") {
        strval = IsoDateToStr(strval)
    }
    return strval
}

function plainDataFromObject(plainData: BasicCollectionDetails, data: object, root: string, columns: ColumnList) {
    for (const [column, value] of Object.entries(data)) {
        const fullColumn = (root !== "" ? root + "." : "") + column
        if (!value) continue;
        if (value.constructor.name === "Object") {
            plainDataFromObject(plainData, value, fullColumn, columns)
        } else {
            for (let i = 0; i < columns.length; i++) {
                if (fullColumn === columns[i].fieldName) {
                    // @ts-ignore
                    plainData[fullColumn] = ValueToString(value, columns[i].type)
                    break;
                }
            }
        }
    }
}

function TableDataFromCollections(collections: CollectionDetails[], columns: ColumnList): BasicCollectionDetails[] {
    return collections.map(collection => {
            var res: BasicCollectionDetails = {id: collection.id, type: collection.type};
            plainDataFromObject(res, collection, "", columns);
            return res
        }
    )
}

function possibleColumnListfromCustomValues(vals: Object, root: string, columns: ColumnList) {
    if (!vals) return;
    for (const [column, value] of Object.entries(vals)) {
        const fullColumn = (root !== "" ? root + "." : "") + column
        if (!value) continue;
        if (value.constructor.name === "Object") {
            possibleColumnListfromCustomValues(value, fullColumn, columns)
        } else {
            if (!columns.find(column => column.fieldName === "customValues." + fullColumn)) {
                columns.push({fieldName: "customValues." + fullColumn, alias: fullColumn, active: false,type:null});
            }
        }
    }
}

function PossibleColumnListfromCollections(currentColumns: ColumnList, collections: CollectionDetails[]) {
    let columns = currentColumns.map(a => Object.assign({}, a));
    collections.forEach(col => {
        possibleColumnListfromCustomValues(col.customValues, "", columns)
    })
    return columns
}

type SelectColumnsProps = {
    columns: ColumnList
    collections: CollectionDetails[]
}

function SelectColumns({collections, columns}: SelectColumnsProps) {
    const possibleColumns: ColumnList = PossibleColumnListfromCollections(columns, collections);
    const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        columnsVar(columns);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let ind = possibleColumns.findIndex(colval => colval.fieldName === event.target.name);
        possibleColumns[ind].active = !possibleColumns[ind].active;
        columnsVar(possibleColumns);
    };


    return <Box margin={"2"}>
        <FormControl component="fieldset">
            <FormLabel component="legend">Select columns</FormLabel>
            <FormGroup>
                {possibleColumns.map(column => {
                    return <FormControlLabel
                        key={column.fieldName}
                        control={<Checkbox checked={column.active} onChange={handleChange} name={column.fieldName}/>}
                        label={column.alias || column.fieldName + ":" + column.fieldName}
                    />
                })}
            </FormGroup>
        </FormControl>

        <IconButton color="secondary" aria-label="select columns" aria-haspopup="true" onClick={handleButtonClick}>
            <ViewColumnIcon/>
        </IconButton>

    </Box>
}

const defaultColumns: ColumnList = [
    {fieldName: "id", alias: "ID", active: true,type:null},
    {fieldName: "title", alias: "Title", active: true,type:null},
    {fieldName: "parentBeamtimeMeta.id", alias: "Beamtime ID", active: true,type:null},
    {fieldName: "parentBeamtimeMeta.beamline", alias: "Beamline", active: true,type:null},
    {fieldName: "parentBeamtimeMeta.facility", alias: "Facility", active: true,type:null},
    {fieldName: "parentBeamtimeMeta.users.doorDb", alias: "Door users", active: true,type:null},
    {fieldName: "eventStart", alias: "Started At", type: "string", active: true},
]

export const columnsVar = makeVar<ColumnList>(
    defaultColumns
);

export const cache: InMemoryCache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                columns: {
                    read () {
                        return columnsVar();
                    },
                },
                type() {
                    return "blabalba"
                }

            }
        }
    }
});

export const GET_COLUMNS = gql`
  query GetColumns {
    columns @client { 
      fieldName  
      alias  
      active
      type
    }
  }
`

export interface ColumnData {
    columns: ColumnList;
}

function CollectionTable({collections}: CollectionProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const {data} = useQuery<ColumnData>(GET_COLUMNS);
    console.log("data:", data)
    const columns: ColumnList = data!.columns;
    const history = useHistory();
    const handleClick = (
        event?: React.MouseEvent,
        rowData?: BasicCollectionDetails,
        toggleDetailPanel?: (panelIndex?: number) => void
    ) => {
        const path = (rowData!.type === "collection" ? "/detailedcollection/" : "/detailed/") + rowData!.id + "/meta";
        history.push(path);
    }

    const handleColumnButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleColumnsSelect = () => {
        setAnchorEl(null);
    };

    return <div>
        <Box display="flex" justifyContent={"flex-end"} className={classes.toolBox}>
            <IconButton color="secondary" aria-label="select columns" aria-haspopup="true"
                        onClick={handleColumnButtonClick}>
                <ViewColumnIcon/>
            </IconButton>
            <Popover
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleColumnsSelect}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <SelectColumns columns={columns} collections={collections}/>
            </Popover>
        </Box>
        <MaterialTable
            icons={TableIcons}
            onRowClick={handleClick}
            options={{
                filtering: false,
                header: true,
                emptyRowsWhenPaging: false,
                showTitle: false,
                search: false,
                paging: true,
                pageSize: 20,
                paginationPosition: collections.length > 10 ? "both" : "bottom",
                pageSizeOptions: [20, 40, 100],
                toolbar: false,
                draggable: false,
                sorting: false,
                minBodyHeight: "50vh",
                headerStyle: {
                    fontWeight: 'bold',
                }
            }}
            columns={columns.filter(column => column.active).map(column => {
                return {title: column.alias || column.fieldName, field: column.fieldName}
            })}
            data={TableDataFromCollections(collections, columns)}
        />
    </div>
}

function CollectionListPage() {
    const classes = useStyles();

    const [collections, setCollections] = React.useState<CollectionDetails[]>([])
    const [filter, setFilter] = React.useState<CollectionFilter>({
        showBeamtime: true,
        showSubcollections: true,
        textSearch: ""
    });

    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <CollectionFilterBox filter={filter} setFilter={setFilter} setCollections={setCollections}/>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <CollectionTable collections={collections}/>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}


export default CollectionListPage;
