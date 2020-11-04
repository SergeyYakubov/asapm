import React, {useCallback, useEffect} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme, withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from "@material-ui/core/Paper";
import {
    CollectionFilter,
    FieldFilter,
    GetFilterString, InvertFilterOp,
    RemoveDuplicates,
} from "../common";
import debounce from 'lodash.debounce';
import {GetUniqueNamesForField} from "../meta";
import {gql, makeVar, useQuery} from "@apollo/client";
import {COLLECTIONS} from "../graphQLSchemes";
import {
    Button,
    CircularProgress,
    IconButton,
    List, ListItem, ListItemIcon, ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
    Popover
} from "@material-ui/core";
import {MenuProps} from "@material-ui/core/Menu";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {DateRangePicker, DateRange} from "materialui-daterange-picker";
import DateRangeIcon from '@material-ui/icons/DateRange';
import SearchIcon from '@material-ui/icons/Search';
import Icon from '@material-ui/core/Icon';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import {CollectionEntry, Query, QueryCollectionsArgs, UniqueField} from "../generated/graphql";
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityTwoToneIcon from '@material-ui/icons/VisibilityTwoTone';
import FlipCameraAndroidIcon from '@material-ui/icons/FlipCameraAndroid';
import DeleteIcon from '@material-ui/icons/Delete';
import {CustomFilter} from "./CustomFilter";
import {FilterChip} from "./FilterChip";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        filtersFields: {
            marginLeft: theme.spacing(2),
        },
        rangeLabel: {
            marginLeft: theme.spacing(1),

        },
        listItemWithIcon: {
            minWidth: "35px",
        },
        filterPaper: {
            marginTop: theme.spacing(2),
        },
        filterBox: {
            alignItems: "center",
        },
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
        },
        progress: {
            marginLeft: theme.spacing(2),
            width: "30%",
        },
        inline: {
            flex: 1,
            display: 'inline',
        },
        textField: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(2),
        },
    }),
);


function BeamtimeFilterBox(): JSX.Element {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Beamtimes
                    </Typography>
                </Grid>
                <Grid item md={6} sm={12} xs={12}>
                    <Typography variant="overline">
                        Quick Filters:
                    </Typography>
                </Grid>
                <Grid item md={6} xs={12}>
                    <Box
                        display="flex"
                        alignItems="flex-end"
                    >
                        <Typography noWrap={true} variant="overline" align={"right"}>
                            Quick Search :
                        </Typography>
                        <TextField className={classes.textField} id="standard-search" margin="dense"
                                   label="Search field" type="search"/>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}

type CollectionFilterBoxProps = {
    setCollections: React.Dispatch<React.SetStateAction<CollectionEntry[]>>
}

interface SelectFieldsProps {
    alias: string
    uniqueFields: UniqueField
    filter: CollectionFilter
}

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props: MenuProps) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
));

function SelectFields({alias, uniqueFields, filter}: SelectFieldsProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuClick = (value: string) => {
        const fieldFilter: FieldFilter = {
            alias: alias,
            key: uniqueFields.keyName as string,
            op: "equals",
            type: "string",
            value: value as string,
            enabled: true
        };
        collectionFilterVar({...filter, fieldFilters: RemoveDuplicates([...(filter.fieldFilters), fieldFilter])});
        handleClose();
    };

    return (
        <div>
            <Button aria-controls="simple-menu" aria-haspopup="true" size="small" color="secondary"
                    endIcon={<ArrowDropDownIcon/>}
                    onClick={handleClick}
                    className={classes.filtersFields}
                    disabled={uniqueFields.values.filter(value => value).length === 0}
            >
                {alias}
            </Button>
            <StyledMenu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {uniqueFields.values.filter(value => value).map(value => {
                    return <MenuItem key={value as string} onClick={() => handleMenuClick(value)}>{value}</MenuItem>;
                })}
            </StyledMenu>
        </div>
    );

}

function DataRangeToString(range: DateRange) {
    if (!range || !range.startDate || !range.endDate) {
        return "";
    }
    return range.startDate.toLocaleDateString() + " - " + range.endDate.toLocaleDateString();
}

interface EditFilterProps {
    filter: CollectionFilter
}

function BulkFilterEdit({filter}: EditFilterProps) {
    const classes = useStyles();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEnable = (enable: boolean) => {
        const updatedFilterFields = filter.fieldFilters.map(value => {
            return {...value,enabled:enable};
        });
        collectionFilterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };

    const handleInvert = () => {
        const updatedFilterFields = filter.fieldFilters.map(value => {
            return {...value,enabled:!value.enabled};
        });
        collectionFilterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };

    const handleInvertSimple = () => {
        const updatedFilterFields = filter.fieldFilters.map(value => {
            return {...value,op:InvertFilterOp(value.op)};
        });
        collectionFilterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };
    const handleDelete = () => {
        collectionFilterVar({...filter, fieldFilters: []});
        handleClose();
    };


    return <div>
        <IconButton onClick={handleClick}>
            <MoreVertIcon/>
        </IconButton>
        <Popover
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <List
                dense={true}
                component="nav"
                aria-labelledby="nested-list-subheader"
                subheader={
                    <ListSubheader component="div" id="nested-list-subheader">
                        Change all filters
                    </ListSubheader>
                }
            >
                <ListItem button onClick={() => handleEnable(true)}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <VisibilityIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Enable all"/>
                </ListItem>
                <ListItem button onClick={() => handleEnable(false)}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <VisibilityOffIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Disable all"/>
                </ListItem>
                <ListItem button onClick={handleInvertSimple}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <FlipCameraAndroidIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Invert simple filters"/>
                </ListItem>
                <ListItem button onClick={handleInvert}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <VisibilityTwoToneIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Invert enabled/disabled"/>
                </ListItem>
                <ListItem button onClick={handleDelete}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <DeleteIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Delete all"/>
                </ListItem>
            </List>
        </Popover>
    </div>;
}


const defaultFilter: CollectionFilter = {
    showBeamtime: true,
    showSubcollections: true,
    textSearch: "",
    fieldFilters: [],
    dateFrom: undefined,
    dateTo: undefined,
};

export const collectionFilterVar = makeVar<CollectionFilter>(
    defaultFilter
);


export const GET_FILTER = gql`
  query GetFilter {
    collectionFilter @client
  }
`;

export interface FilterData {
    collectionFilter: CollectionFilter;
}

function CollectionFilterBox({setCollections}: CollectionFilterBoxProps): JSX.Element {
    const {data} = useQuery<FilterData>(GET_FILTER);
    const filter = data!.collectionFilter;
    const handleChangeScope = (event: React.ChangeEvent<HTMLInputElement>) => {
        collectionFilterVar({...filter, [event.target.name]: event.target.checked});
    };

    const handler = useCallback(debounce(collectionFilterVar, 500), []);

    const handleTextSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({...filter, textSearch: event.target.value});
    };

    const handleDataRangeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const queryResult = useQuery<Query, QueryCollectionsArgs>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: GetFilterString(filter), orderBy: "id"}
    });

    useEffect(() => {
        if (queryResult.error) {
            setCollections([]);
            console.log("collection query error" + queryResult.error);
        }
        if (!queryResult.loading && queryResult.data) {
            setCollections(queryResult.data!.collections);
        }
    }, [queryResult.error, queryResult.loading, queryResult.data, setCollections]);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const toggle = () => {
        setAnchorEl(null);
    };

    const handleDataRangeChange = (range: DateRange) => {
        collectionFilterVar({...filter, dateFrom: range.startDate, dateTo: range.endDate});
        toggle();
    };

    const handleRangeTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === "") {
            collectionFilterVar({...filter, dateFrom: undefined, dateTo: undefined});
        }
    };

    let n = 0;
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                        <Typography variant="h6" color="textSecondary">
                            Collections
                        </Typography>
                        {
                            queryResult.loading &&
                            <CircularProgress size={20} className={classes.progress}/>
                        }
                    </Box>
                </Grid>
            </Grid>
            <Paper className={classes.paper}>
                <Grid container spacing={1} alignItems="flex-end">
                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center">
                            <Typography variant="overline">
                                Scope:
                            </Typography>
                            <FormControlLabel
                                className={classes.filtersFields}
                                control={<Checkbox checked={filter.showBeamtime} onChange={handleChangeScope}
                                                   name="showBeamtime"/>}
                                label="Beamtimes"
                            />
                            <FormControlLabel
                                className={classes.filtersFields}
                                control={<Checkbox checked={filter.showSubcollections} onChange={handleChangeScope}
                                                   name="showSubcollections"/>}
                                label="Subcollections"
                            />
                        </Box>
                    </Grid>
                    <Grid item md={6} sm={12} xs={12}>
                        <Box display="flex">
                            <Typography variant="overline">
                                Add Filter:
                            </Typography>
                            <SelectFields alias={"Facility"} filter={filter}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.facility")}/>
                            <SelectFields alias={"Beamline"} filter={filter}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.beamline")}/>
                            <SelectFields alias={"Door user"} filter={filter}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.users.doorDb")}/>
                        </Box>
                    </Grid>
                    <Grid item md={3} sm={12} xs={12}>
                        <Box
                            display="flex"
                            alignItems="flex-end"
                        >
                            <Icon>
                                <SearchIcon/>
                            </Icon>
                            <TextField className={classes.textField} id="standard-search" margin="dense"
                                       fullWidth={true}
                                       defaultValue={filter.textSearch}
                                       label="Search field" type="search" onChange={handleTextSearchChange}/>
                        </Box>
                    </Grid>
                    <Grid item md={3} sm={12} xs={12}>
                        <Box
                            display="flex"
                            alignItems="flex-end"
                        >
                            <IconButton onClick={handleDataRangeClick} size={"small"}>
                                <DateRangeIcon/>
                            </IconButton>
                            <Popover
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={toggle}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                            >
                                <DateRangePicker
                                    open={true}
                                    closeOnClickOutside={true}
                                    toggle={toggle}
                                    onChange={handleDataRangeChange}
                                />
                            </Popover>
                            <TextField
                                className={classes.rangeLabel}
                                label="Time Range"
                                id="range-text"
                                value={DataRangeToString({startDate: filter.dateFrom, endDate: filter.dateTo})}
                                type="search"
                                margin="dense"
                                size="small"
                                fullWidth={true}
                                onChange={handleRangeTextChange}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper variant="outlined" className={classes.filterPaper}>
                            <Box flexWrap="wrap" display={'flex'} className={classes.filterBox}>
                                <BulkFilterEdit filter={filter}/>
                                {filter.fieldFilters.map(fieldFilter => {
                                    return <FilterChip key={n++} collections={queryResult.data?.collections} filter={filter} fieldFilter={fieldFilter}/>;
                                })}
                                <CustomFilter currentFilter={filter} collections={queryResult.data?.collections} />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
}

export {
    BeamtimeFilterBox,
    CollectionFilterBox
};

