import {useQuery} from "@apollo/client";
import {CollectionDetails} from "./meta";
import Toolbar from "@material-ui/core/Toolbar";
import {CollectionFilterBox} from "./FilterBoxes";
import Grid from "@material-ui/core/Grid";
import React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import MaterialTable, {Column} from "material-table";
import {TableIcons} from "./TableIcons";
import {CollectionFilter, IsoDateToStr} from "./common";
import {useHistory} from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import {gql, InMemoryCache, makeVar} from "@apollo/client";
import SettingsBackupRestoreIcon from '@material-ui/icons/SettingsBackupRestore';
import {Box, Button, IconButton, Popover} from "@material-ui/core";
import ViewColumnIcon from '@material-ui/icons/ViewColumn';
import CloseIcon from '@material-ui/icons/Close';

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
        columnFieldText:{
            fontSize:'0.9rem',
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

type CollectionProps = {
    collections: CollectionDetails[]
}

interface BasicCollectionDetails {
    id: String
    type: String
}

type ColumnItem = {
    fieldName: string
    alias: string | null
    type: string | null
    active: boolean
}

type ColumnList = ColumnItem[];

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
    close: () => void
}

function SelectColumns({collections, columns, close}: SelectColumnsProps) {
    const possibleColumns: ColumnList = PossibleColumnListfromCollections(columns, collections);
    const handleColumnButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        columnsVar(defaultColumns);
    };

    const classes = useStyles();

    const UpdateAlias = (
        newValue: any,
        oldValue: any,
        rowData: ColumnItem,
        columnDef: Column<any>
        ) :Promise<void>  => {
        return new Promise((resolve, reject) => {
            let ind = possibleColumns.findIndex(col => col.fieldName === rowData.fieldName);
            possibleColumns[ind].alias = newValue;
            columnsVar(possibleColumns);
        });
    }

    const handleSelectionChange = (
        data: ColumnList
    ) => {
        possibleColumns.forEach(row => {
            let ind = data.findIndex(selectedCol => selectedCol.fieldName === row.fieldName);
            if (ind>-1) {
                row.active = true
            } else {
                row.active = false
            }
        })
        columnsVar(possibleColumns);
    }

    return <Box className={classes.root}>
        <Grid container justify={'space-between'} className={classes.columnsHeader} >
            <Button variant="contained" color="secondary" onClick={handleColumnButtonClick} startIcon={<SettingsBackupRestoreIcon/>}>
                    Restore defaults
            </Button>
            <IconButton onClick={close}     size="small">
                <CloseIcon/>
            </IconButton>
        </Grid>
        <MaterialTable
            icons={TableIcons}
            options={{
                filtering: false,
                header: true,
                showTitle: false,
                search: true,
                paging: false,
                toolbar: true,
                draggable: false,
                sorting: true,
                minBodyHeight: "50vh",
                selection: true,
                showTextRowsSelected: false,
                headerStyle: {
                    fontWeight: 'bold',
                },
            }}
            cellEditable={{
                onCellEditApproved: UpdateAlias,
            }}
            onSelectionChange={handleSelectionChange}
            columns={[
                { title: 'Key Name', field: 'fieldName',editable:'never'},
                { title: 'Alias', field: 'alias' },
            ]}
            data={possibleColumns.map(column => { return {fieldName:column.fieldName,alias:column.alias || column.fieldName,type:null, active:column.active,
                tableData: { checked: column.active } }})}
        />
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
                <SelectColumns close={handleColumnsSelect} columns={columns} collections={collections}/>
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
        textSearch: "",
        fieldFilters: [],
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
