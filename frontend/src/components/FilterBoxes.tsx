import React, {useCallback} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme, withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from "@material-ui/core/Paper";
import {
    CollectionFilter, EndOfDay,
    FieldFilter,
    InvertFilterOp,
    RemoveDuplicates, StartOfDay, Mode
} from "../common";
import debounce from 'lodash.debounce';
import {GetUniqueNamesForField} from "../meta";
import {gql, makeVar, QueryResult, ReactiveVar} from "@apollo/client";
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
import {Query, QueryCollectionsArgs, UniqueField} from "../generated/graphql";
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
    queryResult: QueryResult<Query, QueryCollectionsArgs>
    filter: CollectionFilter
    filterVar: ReactiveVar<CollectionFilter>
    mode: Mode
}

interface SelectFieldsProps {
    alias: string
    uniqueFields: UniqueField
    filter: CollectionFilter
    filterVar: ReactiveVar<CollectionFilter>
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

function SelectFields({alias, uniqueFields, filter,filterVar}: SelectFieldsProps) {
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
        filterVar({...filter, fieldFilters: RemoveDuplicates([...(filter.fieldFilters), fieldFilter])});
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
            {anchorEl &&
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
            }
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
    filterVar: ReactiveVar<CollectionFilter>
}

function BulkFilterEdit({filter,filterVar}: EditFilterProps) {
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
            return {...value, enabled: enable};
        });
        filterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };

    const handleInvert = () => {
        const updatedFilterFields = filter.fieldFilters.map(value => {
            return {...value, enabled: !value.enabled};
        });
        filterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };

    const handleInvertSimple = () => {
        const updatedFilterFields = filter.fieldFilters.map(value => {
            return {...value, op: InvertFilterOp(value.op)};
        });
        filterVar({...filter, fieldFilters: updatedFilterFields});
        handleClose();
    };
    const handleDelete = () => {
        filterVar({...filter, fieldFilters: []});
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
    sortBy: "",
    sortDir: "asc",
    fieldFilters: [],
    dateFrom: undefined,
    dateTo: undefined,
};

export const collectionFilterVar = makeVar<CollectionFilter>(
    defaultFilter
);

export const beamtimeFilterVar = makeVar<CollectionFilter>(
    {...defaultFilter,showSubcollections: false}
);

export const GET_COLLECTION_FILTER = gql`
  query GetFilter {
    collectionFilter @client
  }
`;

export const GET_BEAMTIME_FILTER = gql`
  query GetFilter {
    beamtimeFilter @client
  }
`;

export interface CollectionFilterData {
    collectionFilter: CollectionFilter;
}

export interface BeamtimeFilterData {
    beamtimeFilter: CollectionFilter;
}


function CollectionFilterBox({queryResult, filter, filterVar, mode}: CollectionFilterBoxProps): JSX.Element {
    const handleChangeScope = (event: React.ChangeEvent<HTMLInputElement>) => {
        filterVar({...filter, [event.target.name]: event.target.checked});
    };

    const handler = useCallback(debounce(filterVar, 500), []);

    const handleTextSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({...filter, textSearch: event.target.value});
    };

    const handleDataRangeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const toggle = () => {
        setAnchorEl(null);
    };

    const handleDataRangeChange = (range: DateRange) => {
        filterVar({...filter, dateFrom: StartOfDay(range.startDate), dateTo: EndOfDay(range.endDate)});
        toggle();
    };

    const handleRangeTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === "") {
            filterVar({...filter, dateFrom: undefined, dateTo: undefined});
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
                            {mode == Mode.Beamtimes?"Beamtimes":"Collections"}
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
                    {mode == Mode.Collections &&
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
                    }
                    <Grid item md={6} sm={12} xs={12}>
                        <Box display="flex">
                            <Typography variant="overline">
                                Add Filter:
                            </Typography>
                            <SelectFields alias={"Facility"} filter={filter} filterVar={filterVar}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields,
                                              mode==Mode.Beamtimes?"facility":"parentBeamtimeMeta.facility")}/>
                            <SelectFields alias={"Beamline"} filter={filter} filterVar={filterVar}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields,
                                              mode==Mode.Beamtimes?"beamline":"parentBeamtimeMeta.beamline")}/>
                            <SelectFields alias={"Door user"} filter={filter} filterVar={filterVar}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields,
                                              mode==Mode.Beamtimes?"users.doorDb":"parentBeamtimeMeta.users.doorDb")}/>
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
                            {anchorEl &&
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
                            }
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
                                <BulkFilterEdit filter={filter}  filterVar={filterVar}/>
                                {filter.fieldFilters.map(fieldFilter => {
                                    return <FilterChip key={n++} collections={queryResult.data?.collections}
                                                       filter={filter} mode={mode} filterVar={filterVar} fieldFilter={fieldFilter}/>;
                                })}
                                <CustomFilter currentFilter={filter} mode={mode} filterVar={filterVar} collections={queryResult.data?.collections}/>
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

