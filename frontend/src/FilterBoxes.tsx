import React, {useCallback, useEffect} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme, withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from "@material-ui/core/Paper";
import {CollectionFilter, FieldFilter, GetFilterString,RemoveDuplicates,RemoveElement} from "./common";
import debounce from 'lodash.debounce';
import {CollectionDetails, CollectionEntitiesDetails, GetUniqueNamesForField, UniqueField} from "./meta";
import {useQuery} from "@apollo/client";
import {COLLECTIONS} from "./graphQLSchemes";
import {Button, Chip, CircularProgress, IconButton, Menu, MenuItem, Popover} from "@material-ui/core";
import {MenuProps} from "@material-ui/core/Menu";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {DateRangePicker, DateRange} from "materialui-daterange-picker";
import DateRangeIcon from '@material-ui/icons/DateRange';
import SearchIcon from '@material-ui/icons/Search';
import Icon from '@material-ui/core/Icon';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import MoreVertIcon from '@material-ui/icons/MoreVert';

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
        filterChip: {
            margin: "5px",
        },
        filterPaper: {
            marginTop: theme.spacing(2),
        },
        filterBox: {
            alignItems:"center",
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


function BeamtimeFilterBox() {
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
    filter: CollectionFilter
    setFilter: React.Dispatch<React.SetStateAction<CollectionFilter>>
    setCollections: React.Dispatch<React.SetStateAction<CollectionDetails[]>>
}

interface SelectFieldsProps {
    alias: string
    uniqueFields: UniqueField
    filter: CollectionFilter
    setFilter: React.Dispatch<React.SetStateAction<CollectionFilter>>
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

function SelectFields({alias, uniqueFields,filter,setFilter}: SelectFieldsProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuClick = (value: String) => {
        const fieldFilter: FieldFilter = {alias:alias,key:uniqueFields.keyName as string,value:value as string,negate:false};
        setFilter({...filter,fieldFilters: RemoveDuplicates([...(filter.fieldFilters),fieldFilter])});
        handleClose();
    };

    return (
        <div>
            <Button aria-controls="simple-menu" aria-haspopup="true" size="small" color="secondary"
                    endIcon={<ArrowDropDownIcon/>}
                    onClick={handleClick}
                    className={classes.filtersFields}
                    disabled={uniqueFields.values.length === 0}
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
                {uniqueFields.values.map(value => {
                    return <MenuItem onClick={() => handleMenuClick(value)}>{value}</MenuItem>;
                })}
            </StyledMenu>
        </div>
    );

}

function DataRangeToString(range: DateRange){
    if (!range || !range.startDate || !range.endDate) {
        return "";
    }
    return range.startDate.toLocaleDateString()+" - "+range.endDate.toLocaleDateString()
}

function CollectionFilterBox({filter, setFilter, setCollections}: CollectionFilterBoxProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter({...filter, [event.target.name]: event.target.checked});
    };

    const handler = useCallback(debounce(setFilter, 500), []);

    const handleTextSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({...filter, textSearch: event.target.value});
    }

    const handleDataRangeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const queryResult = useQuery<CollectionEntitiesDetails>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: GetFilterString(filter), orderBy: "id"}
    });
    if (queryResult.error) {
        setCollections([])
        console.log(queryResult.error.message)
    }

    useEffect(() => {
        if (queryResult.loading === false && queryResult.data) {
            console.log("set collection");
            setCollections(queryResult.data!.collections);
        }
    }, [queryResult.loading, queryResult.data, setCollections])

    const [dateRange, setDateRange] = React.useState<DateRange>({});
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const toggle = () => {
        setAnchorEl(null);
    }

    const handleDataRangeChange = (range: DateRange) => {
        setDateRange(range)
        toggle()
    }

    const handleRangeTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === "") {
            setDateRange({})
        }
    };


    const handleAddFilterClick = () => {
    };

    const handleFieldFilterDelete = (fieldFilter:FieldFilter) => {
        setFilter({...filter,fieldFilters: RemoveElement(fieldFilter,filter.fieldFilters)});
    }

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
                                control={<Checkbox checked={filter.showBeamtime} onChange={handleChange}
                                                   name="showBeamtime"/>}
                                label="Beamtimes"
                            />
                            <FormControlLabel
                                className={classes.filtersFields}
                                control={<Checkbox checked={filter.showSubcollections} onChange={handleChange}
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
                            <SelectFields alias={"facility"} filter={filter} setFilter={setFilter}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.facility")}/>
                            <SelectFields alias={"beamline"} filter={filter} setFilter={setFilter}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.beamline")}/>
                            <SelectFields alias={"door user"} filter={filter} setFilter={setFilter}
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
                            <TextField className={classes.textField} id="standard-search" margin="dense" fullWidth={true}
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
                                value={DataRangeToString(dateRange)}
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
                            <Box flexWrap="wrap" display={'flex'} className={classes.filterBox} >
                                <IconButton>
                                    <MoreVertIcon/>
                                </IconButton>
                                {filter.fieldFilters.map(fieldFilter =>{
                                    return  <Chip
                                        className={classes.filterChip}
                                        label={fieldFilter.alias + " = " + fieldFilter.value}
                                        onDelete={() => handleFieldFilterDelete(fieldFilter)}
                                    />
                                })}
                                <Chip
                                    className={classes.filterChip}
                                    color="secondary"
                                    icon={<AddCircleIcon />}
                                    label="Add custom filter"
                                    onClick={handleAddFilterClick}
                                />
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
}

