import React from 'react';
import {useTable, useFlexLayout, useSortBy} from 'react-table';
import {List, AutoSizer, CellMeasurer, CellMeasurerCache} from "react-virtualized";
import {createStyles, withStyles, makeStyles, Theme} from "@material-ui/core/styles";
import TableSortLabel from '@material-ui/core/TableSortLabel';
import {CollectionEntry} from "../generated/graphql";
import {useQuery} from "@apollo/client";
import {ColumnData, ColumnList, GET_COLUMNS} from "../pages/CollectionListPage";
import {IsoDateToStr} from "../common";
import {useHistory} from "react-router-dom";


const kMinWidth = 600;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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
            minWidth: kMinWidth,
        },
        sortLabel: {
            "&:hover": {
                textColor:theme.palette.text.primary,
            },
            "&$selected": {
                textColor:theme.palette.text.primary,
            },

        },
        headerContent: {
            fontWeight: 'bold',
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
            marginRight: theme.spacing(2),
        },
        row: {
            borderBottomStyle: 'solid',
            borderBottomWidth: ' 1px',
            borderColor: theme.palette.divider,
            paddingLeft: theme.spacing(2),
            "&:hover": {
                background:theme.palette.action.hover,
                cursor: 'pointer',
            },
        },
        rowContent: {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
            marginRight: theme.spacing(2),
        },
        list: {
            outline:'none',
        },
    }),
);


const range = (len: any) => {
    const arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(i);
    }
    return arr;
};

const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 50
});

function ValueToString(value: any, columnType: string | undefined) : string {
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


function Table({columns, data}: any) {
    const classes = useStyles();
    const history = useHistory();

    const defaultColumn = React.useMemo(
        () => ({
            minWidth: 50, // minWidth is only used as a limit for resizing
            width: 50, // width is used for both the flex-basis and flex-grow
            maxWidth: 250, // maxWidth is only used as a limit for resizing
        }),
        []
    );

    const orderByFn = React.useMemo(() => {
        console.log("click sort");
    }, []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
// @ts-ignore
        state: {sortBy}
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
// @ts-ignore
            manualSortBy: true,
            disableMultiSort: true,
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

    const RenderRow = React.useCallback(
        ({key, parent, index, style}) => {
            const row = rows[index];
            prepareRow(row);
            return (
                <CellMeasurer
                    key={key}
                    cache={cache}
                    parent={parent}
                    columnIndex={0}
                    rowIndex={index}
                >
                    <div
                        {...row.getRowProps({
                            style,
                        })}
                        className={classes.row}
                        onClick={(event)=>handleClick(event,row)}
                    >
                        {row.cells.map((cell: any) => {
                            return (
                                <div {...cell.getCellProps()} className={classes.rowContent}>
                                    {cell.render((cell:any)=>{
                                        return ValueToString(cell.value, cell.column.type);
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </CellMeasurer>
            );
        },
        [prepareRow, rows, classes]
    );

    const clearCache = () => {
        cache.clearAll();
    };

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


    // Render the UI for your table
    return (
        <div {...getTableProps()} className={classes.table}>
            <div className={classes.header}>
                {headerGroups.map((headerGroup: any) => (
                    <div {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column: any) => (
                            <div {...column.getHeaderProps(column.getSortByToggleProps())}
                                 className={classes.headerContent}>
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
                <AutoSizer disableHeight
                           onResize={clearCache}
                >
                    {({width}) => (
                        <List
                            height={400}
                            rowCount={rows.length}
                            width={width < kMinWidth ? kMinWidth : width}
                            deferredMeasurementCache={cache}
                            rowHeight={cache.rowHeight}
                            rowRenderer={RenderRow}
                            className={classes.list}
                        >
                        </List>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
}

type CollectionProps = {
    collections: CollectionEntry[]
}

export function VirtualizedCollectionTable({collections}:CollectionProps): JSX.Element {

    const {data} = useQuery<ColumnData>(GET_COLUMNS);

    const columns = React.useMemo(
        () => data!.columns.map(col => {
            return {Header: col.alias || col.fieldName, accessor: col.fieldName,type:col.type};
            }
        ),[data]
    );

    return (
        <Table
            columns={columns}
            data={collections}/>
    );
}

