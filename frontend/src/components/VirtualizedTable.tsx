import React from 'react';
import { useTable, useFlexLayout,useResizeColumns } from 'react-table';
import {List, AutoSizer,CellMeasurer, CellMeasurerCache} from "react-virtualized";

const range = (len:any) => {
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
    const makeDataLevel = (depth = 0):any => {
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

function Table({ columns, data }:any) {
    // Use the state and functions returned from useTable to build your UI

    const defaultColumn = React.useMemo(
        () => ({
            minWidth: 30, // minWidth is only used as a limit for resizing
            width: 150, // width is used for both the flex-basis and flex-grow
            maxWidth: 200, // maxWidth is only used as a limit for resizing
        }),
        []
    );

    const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
        },
        useFlexLayout,
    );

    const handleClick = (
        event?: React.MouseEvent,
    ) => {
        console.log("click");
    };


    const RenderRow = React.useCallback(
        ({ key,parent,index, style }) => {
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
                    className="tr"
                    onClick={handleClick}
                >
                    {row.cells.map((cell:any) => {
                        return (
                            <div {...cell.getCellProps()} className="td">
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

    const clearCache= () => {
        cache.clearAll();
    };

    // Render the UI for your table
    return (
        <div {...getTableProps()} className="table">
            <div>
                {headerGroups.map((headerGroup:any) => (
                    <div {...headerGroup.getHeaderGroupProps()} className="tr">
                        {headerGroup.headers.map((column:any) => (
                            <div {...column.getHeaderProps()} className="th">
                                {column.render('Header')}
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
                    width={width}
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

export function VirtualizedCollectionTable():JSX.Element {
    const columns = React.useMemo(
        () => [
            {
                Header: 'Row Index',
                accessor: (row: any, i: any) => i,
            },
            {
                Header: 'Name',
                columns: [
                    {
                        Header: 'First Name',
                        accessor: 'firstName',
                    },
                    {
                        Header: 'Last Name',
                        accessor: 'lastName',
                    },
                ],
            },
            {
                Header: 'Info',
                columns: [
                    {
                        Header: 'Age',
                        accessor: 'age',
                        width: 50,
                    },
                    {
                        Header: 'Visits',
                        accessor: 'visits',
                        width: 60,
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
            },
        ],
        []
    );

    const data = React.useMemo(() => makeData(10000), []);

    return (
            <Table columns={columns} data={data} />
    );
}

