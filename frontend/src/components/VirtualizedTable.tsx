import React from 'react';
import {useTable, useFlexLayout, useResizeColumns, useSortBy} from 'react-table';
import {List, AutoSizer, CellMeasurer, CellMeasurerCache} from "react-virtualized";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import TableSortLabel from '@material-ui/core/TableSortLabel';


const kMinWidth = 600;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        table: {
            textAlign: 'left',
            color: theme.palette.text.primary,
            background: theme.palette.background.paper,
            overflowX: 'scroll',
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
            borderColor: theme.palette.grey["100"],
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
            borderTopStyle: 'solid',
            borderBottomStyle: 'solid',
            borderTopWidth: ' 1px',
            borderBottomWidth: ' 1px',
            borderColor: theme.palette.grey["200"],
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
        }

    }),
);


const range = (len: any) => {
    const arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(i);
    }
    return arr;
};

const newPerson = () => {
    const statusChance = Math.random();
    return {
        firstName: "Hello kuazgd aksuzgd asuzgd asuzgd oauzdg oauzdg aoudgz aosudgz aosdgz aoudgz aopfgz pgzdfpaszf psazgf pasuzfg apsfg apsiuf apf",
        lastName: "Me isfg lasigzf asuzfg aosuzfg oufgoaszfg aopsufaosuzfg as",
        age: Math.floor(Math.random() * 30),
        visits: Math.floor(Math.random() * 100),
        progress: Math.floor(Math.random() * 100),
        status:
            statusChance > 0.66
                ? 'relationship'
                : statusChance > 0.33
                ? 'complicated'
                : 'single',
    };
};

function makeData(...lens: any) {
    const makeDataLevel = (depth = 0): any => {
        const len = lens[depth];
        return range(len).map(d => {
            return {
                ...newPerson(),
                subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
            };
        });
    };
    return makeDataLevel();
}


const scrollbarWidth = () => {
    // thanks too https://davidwalsh.name/detect-scrollbar-width
    const scrollDiv = document.createElement('div');
    scrollDiv.setAttribute('style', 'width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;');
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
};

const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 50
});

function Table({columns, data}: any) {
    const classes = useStyles();

    const defaultColumn = React.useMemo(
        () => ({
            minWidth: 50, // minWidth is only used as a limit for resizing
            width: 50, // width is used for both the flex-basis and flex-grow
            maxWidth: 250, // maxWidth is only used as a limit for resizing
        }),
        []
    );

    const orderByFn = React.useMemo(() => {
        console.log()
    }, []);

    const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);
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
        },
        useFlexLayout,
        useSortBy,
    );

// @ts-ignore
    const handleClick = (
        event?: React.MouseEvent,
    ) => {
        console.log("click");
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
                        onClick={handleClick}
                    >
                        {row.cells.map((cell: any) => {
                            return (
                                <div {...cell.getCellProps()} className={classes.rowContent}>
                                    {cell.render('Cell')}
                                </div>
                            );
                        })}
                    </div>
                </CellMeasurer>
            );
        },
        [prepareRow, rows]
    );

    const clearCache = () => {
        cache.clearAll();
    };

    // Render the UI for your table
    return (
        <div {...getTableProps()} className={classes.table}>
            <div className={classes.header}>
                {headerGroups.map((headerGroup: any) => (
                    <div {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column: any) => (
                            <div {...column.getHeaderProps(column.getSortByToggleProps())}
                                 className={classes.headerContent}>
                                <TableSortLabel
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
                                </TableSortLabel>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div {...getTableBodyProps()}>
                <AutoSizer disableHeight
                           onResize={clearCache}
                >
                    {({height, width}) => (
                        <List
                            height={400}
                            rowCount={rows.length}
                            width={width < kMinWidth ? kMinWidth : width}
                            deferredMeasurementCache={cache}
                            rowHeight={cache.rowHeight}
                            rowRenderer={RenderRow}
                        >
                        </List>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
}

export function VirtualizedCollectionTable(): JSX.Element {
    const columns = React.useMemo(
        () => [
            {
                Header: 'Row Index',
                accessor: (row: any, i: any) => i,
            },
            {
                Header: 'First Name',
                accessor: 'firstName',
            },
            {
                Header: 'Last Name',
                accessor: 'lastName',
            },
            {
                Header: 'Age',
                accessor: 'age',
            },
            {
                Header: 'Visits',
                accessor: 'visits',
            },
            {
                Header: 'Status',
                accessor: 'status',
            },
            {
                Header: 'Profile Progress',
                accessor: 'progress',
            },
        ],
        []
    );

    const data = React.useMemo(() => makeData(10000), []);

    return (
        <Table
            columns={columns}
            data={data}/>
    );
}

