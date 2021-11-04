import React, {useEffect, useRef, useState} from 'react';
import {useTable, useFlexLayout, useSortBy} from 'react-table';
import {createStyles, withStyles, makeStyles, Theme} from "@material-ui/core/styles";
import TableSortLabel from '@material-ui/core/TableSortLabel';
import {CollectionEntry, Query, QueryCollectionsArgs} from "../generated/graphql";
import {QueryResult, useQuery} from "@apollo/client";
import {
    ColumnData, ColumnItem,
    ColumnList,
    columnsVar, defaultColumns,
    GET_COLUMNS,
    PossibleColumnListfromCollections
} from "../pages/CollectionListPage";
import {CollectionFilter, IsoDateToStr} from "../common";
import {useHistory} from "react-router-dom";
import {Virtuoso} from "react-virtuoso";
import {Box, Button, IconButton, Popover} from "@material-ui/core";
import ViewColumnIcon from "@material-ui/icons/ViewColumn";
import Grid from "@material-ui/core/Grid";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";
import CloseIcon from "@material-ui/icons/Close";
import MaterialTable from "material-table";
import {TableIcons} from "../TableIcons";
import {collectionFilterVar} from "./FilterBoxes";


const kcolumnWidth = 100;

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
            table: {
                textAlign: 'left',
                color: theme.palette.text.primary,
                background: theme.palette.background.paper,
                overflowX: 'scroll',
//            borderStyle: 'solid',
//            borderWidth: ' 1px',
//            borderColor: theme.palette.text.secondary,
//            boxShadow: '0 0 4px -1px '+ theme.palette.grey["200"],
                boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
            },
            visuallyHidden: {
                border: 0,
                clip: 'rect(0 0 0 0)',
                height: 1,
                margin: -1,
                overflow: 'hidden',
                padding: 0,
                position: 'absolute',
                top: 20,
                width: 1,
            },
            header: {
                borderTopStyle: 'solid',
                borderBottomStyle: 'solid',
                borderTopWidth: ' 1px',
                borderBottomWidth: ' 1px',
                borderColor: theme.palette.divider,
                paddingLeft: theme.spacing(2),
            },
            toolBox: {
                margin: theme.spacing(0),
                background: theme.palette.background.paper,
            },
            sortLabel: {
                "&:hover": {
                    textColor: theme.palette.text.primary,
                },
                textOverflow: 'ellipsis',
            },
            headerContent: {
                fontWeight: 'bold',
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
                marginRight: theme.spacing(2),
                overflow: 'hidden',
            },
            row: {
                borderBottomStyle: 'solid',
                borderBottomWidth: ' 1px',
                borderColor: theme.palette.divider,
                paddingLeft: theme.spacing(2),
                "&:hover": {
                    background: theme.palette.action.hover,
                    cursor: 'pointer',
                },
            },
            rowContent: {
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
                marginRight: theme.spacing(2),
                overflowWrap: 'break-word',
            },
            list: {
                outline: 'none',
                overflow: 'hidden',
            },
        }),
);

const useElementWidth = (myRef: any, deps: any) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setWidth(myRef.current.scrollWidth);
        };

        if (myRef.current) {
            setWidth(myRef.current.scrollWidth);
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [myRef, ...deps]);

    return width;
};


function ValueToString(value: any, columnType: string | undefined): string {
    if (!value) {
        return "";
    }
    if (columnType === "Array") {
        return value.join(", ");
    }

    let strval = value.toString();
    if (columnType === "Date") {
        strval = IsoDateToStr(strval);
    }
    return strval;
}

type TableProps = {
    filter: CollectionFilter
    columns: any
    data: CollectionEntry[] | undefined
}

function Table({filter, columns, data}: TableProps) {
    const classes = useStyles();
    const history = useHistory();

    const defaultColumn = React.useMemo(
        () => ({
            minWidth: 0,
            width: kcolumnWidth,
            maxWidth: 1000,
        }),
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data: data ? data : [],
            defaultColumn,
// @ts-ignore
            manualSortBy: true,
            disableMultiSort: true,
            autoResetSortBy: false,
            initialState: {
// @ts-ignore
                sortBy: [{id: filter.sortBy, desc: filter.sortDir === "desc"}]
            },
        },
        useFlexLayout,
        useSortBy,
    );

    const handleClick = (
        event?: React.MouseEvent,
        row?: any,
    ) => {
        const path = (row.original.type === "collection" ? "/detailedcollection/" : "/detailed/") + row.original.id + "/meta";
        history.push(path);
    };

    const handleClickSort = (
        event: React.MouseEvent,
        column:any
    ) => {
        const willBeSorted = column.isSortedDesc !== true;
        const willBeDesc = column.isSortedDesc === false;
        column.getSortByToggleProps().onClick(event);
        collectionFilterVar({...filter, sortBy:willBeSorted?column.id:"", sortDir:willBeDesc ?"desc":"asc"});
    };

    const RenderRow = React.useCallback(
        index => {
            const row = rows[index];
            prepareRow(row);
            return (
                <div
                    {...row.getRowProps()}
                    className={classes.row}
                    onClick={(event) => handleClick(event, row)}
                >
                    {row.cells.map((cell: any) => {
                        return (
                            <div {...cell.getCellProps()} className={classes.rowContent}>
                                {cell.render((cell: any) => {
                                    if (cell.column.type!="Image" || !cell.value) {
                                        return ValueToString(cell.value, cell.column.type);
                                    }
                                    return <img src={`data:image/png;base64,${cell.value}`}/>;
                                })}
                            </div>
                        );
                    })}
                </div>
            );
        },
        [prepareRow, rows, filter]
    );

    const StyledTableSortLabel = withStyles((theme: Theme) =>
        createStyles({
            root: {
                color: theme.palette.text.primary,
                "&:hover": {
                    color: theme.palette.text.primary,
                },
                '&$active': {
                    color: theme.palette.text.primary,
                },
            },
            active: {},
            icon: {
                color: 'inherit !important'
            },
        })
    )(TableSortLabel);

    const componentRef = useRef<HTMLDivElement>(null);
    const width = useElementWidth(componentRef, [columns, data]);

    // Render the UI for your table
    return (
        <div {...getTableProps()} className={classes.table}>
            <div className={classes.header} ref={componentRef}>
                {headerGroups.map((headerGroup: any) => (
                    <div {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column: any) => (
                            <div {...column.getHeaderProps(column.getSortByToggleProps())}
                                 className={classes.headerContent}
                                 onClick={(event)=>handleClickSort(event, column)}
                            >
                                <StyledTableSortLabel
                                    active={column.isSorted}
                                    direction={column.isSortedDesc ? 'desc' : 'asc'}
                                    className={classes.sortLabel}
                                >
                                    {column.render('Header')}
                                    {column.isSorted &&
                                    <span className={classes.visuallyHidden}>
                                        {column.isSortedDesc ? 'sorted descending' : 'sorted ascending'}
                                    </span>
                                    }
                                </StyledTableSortLabel>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div {...getTableBodyProps()}>
                <Virtuoso
                    totalCount={rows.length}
                    overscan={200}
                    item={RenderRow}
                    style={{height: '400px', width: width}}
                    className={classes.list}
                />
            </div>
        </div>
    );
}

type SelectColumnsProps = {
    columns: ColumnList
    collections: CollectionEntry[] | undefined
    close: () => void
}

function SelectColumns({collections, columns, close}: SelectColumnsProps) {
    const possibleColumns: ColumnList = PossibleColumnListfromCollections(columns, collections);
    const handleColumnButtonClick = () => {
        columnsVar(defaultColumns);
    };

    const classes = useStyles();

    const UpdateAlias = (
        newValue: any,
        oldValue: any,
        rowData: ColumnItem
    ): Promise<void> => {
        return new Promise(() => {
            const ind = possibleColumns.findIndex(col => col.fieldName === rowData.fieldName);
            possibleColumns[ind].alias = newValue;
            columnsVar(possibleColumns);
        });
    };

    const handleSelectionChange = (
        data: ColumnList
    ) => {
        possibleColumns.forEach(row => {
            const ind = data.findIndex(selectedCol => selectedCol.fieldName === row.fieldName);
            row.active = ind > -1;
        });
        columnsVar(possibleColumns);
    };

    return <Box className={classes.root}>
        <Grid container justifyContent={'space-between'} className={classes.columnsHeader}>
            <Button variant="contained" color="secondary" onClick={handleColumnButtonClick}
                    startIcon={<SettingsBackupRestoreIcon/>}>
                Restore defaults
            </Button>
            <IconButton onClick={close} size="small">
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
                {title: 'Key Name', field: 'fieldName', editable: 'never'},
                {title: 'Alias', field: 'alias'},
            ]}
            data={possibleColumns.map(column => {
                return {
                    fieldName: column.fieldName,
                    alias: column.alias || column.fieldName,
                    type: undefined,
                    active: column.active,
                    tableData: {checked: column.active}
                };
            })}
        />
    </Box>;
}


type CollectionProps = {
    queryResult: QueryResult<Query, QueryCollectionsArgs>
    oldCollections: CollectionEntry[] | undefined
    filter: CollectionFilter
}

export function VirtualizedCollectionTable({filter, oldCollections, queryResult}: CollectionProps): JSX.Element {
    const classes = useStyles();

    const {data} = useQuery<ColumnData>(GET_COLUMNS);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleColumnButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleColumnsSelect = () => {
        setAnchorEl(null);
    };

    const columns: ColumnList = data!.columns;

    const tableColumns = React.useMemo(
        () => columns.filter(col => col.active).map(col => {
                return {
                    Header: col.alias || col.fieldName,
                    accessor: col.fieldName,
                    type: col.type,
                    style: {'white-space': 'unset', overflowWrap: "break-word"}
                };
            }
        ), [data!.columns]
    );

    return (
        <Box display="inline">
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
                    <SelectColumns close={handleColumnsSelect} columns={columns}
                                   collections={queryResult.data?.collections}/>
                </Popover>
            </Box>
            <Table
                filter={filter}
                columns={tableColumns}
                data={queryResult.data?.collections || oldCollections}/>
        </Box>
    );
}

