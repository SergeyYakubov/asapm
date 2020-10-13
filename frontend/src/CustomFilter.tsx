import React from "react";
import {CollectionFilter} from "./common";
import {ColumnList, columnsVar, PossibleColumnListfromCollections} from "./CollectionListPage";
import {Box, Button, Chip, FormControl, InputLabel, MenuItem, Popover, Select, Typography} from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {CollectionEntry} from "./generated/graphql";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";

interface CustomFilterProps {
    currentFilter: CollectionFilter
    collections: CollectionEntry[] | undefined
}


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        popover: {},
        bold: {
            fontWeight: 'bold',
        },
        formContainer: {
            Width: "600px",
            minWidth: "200px",
        },
        formHeader: {
            margin: theme.spacing(1),
        },
        formControl: {
            minWidth: "120px",
            margin: theme.spacing(2),
        },
        filterChip: {
            margin: "5px",
        },
        addButton: {
            margin: theme.spacing(2),
            marginTop: theme.spacing(4),
        },
    })
);

interface FilterFormProps {
    currentCustomFilter: CurrentCustomFilter
    currentFilter: CollectionFilter
    possibleColumns: ColumnList
    setCurrentCustomFilter: React.Dispatch<React.SetStateAction<CurrentCustomFilter>>
}

type CurrentCustomFilter = {
    value: string
    op: string
    name: string
    filterString: string
}

const emptyCustomFilter: CurrentCustomFilter = {value: "", op: "", name: "", filterString: ""};

function FilterForm({currentFilter, possibleColumns, currentCustomFilter, setCurrentCustomFilter}: FilterFormProps) {
    const classes = useStyles();

    const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentCustomFilter({...currentCustomFilter, name: event.target.value as string, op: "", value: ""});
    };

    const handleChangeOp = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentCustomFilter({...currentCustomFilter, op: event.target.value as string, value: ""});
    };

    const handleChangeVal = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentCustomFilter({...currentCustomFilter, value: event.target.value as string});
    };

    const addEnabled = currentCustomFilter.filterString !== "" || (currentCustomFilter.value !== ""
        && currentCustomFilter.op !== "" && currentCustomFilter.name !== "");

    return <Grid container spacing={0} className={classes.formContainer}>
        <Grid item xs={12}>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} className={classes.formHeader}>
                <Typography variant={'subtitle2'} className={classes.bold}>
                    Edit filter
                </Typography>
                <Button size={"small"} color="primary">Edit as SQL</Button>
            </Box>
        </Grid>
        <Grid item xs={12}>
            <Divider/>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <FormControl fullWidth={true}>
                    <InputLabel id="field-label">Field</InputLabel>
                    <Select
                        labelId="field-label"
                        id="field"
                        value={currentCustomFilter.name}
                        onChange={handleChange}
                    >
                        {possibleColumns.map(value =>
                            <MenuItem value={value.fieldName}>{value.alias || value.fieldName}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <FormControl fullWidth={true}>
                    <InputLabel id="op-label">Operator</InputLabel>
                    <Select
                        labelId="op-label"
                        id="op"
                        value={currentCustomFilter.op}
                        onChange={handleChangeOp}
                        disabled={currentCustomFilter.name === ""}
                    >
                        <MenuItem value={'eq'}>Equals</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <FormControl fullWidth={true}>
                    <InputLabel id="val-label">Value</InputLabel>
                    <Select
                        labelId="val-label"
                        id="val"
                        value={currentCustomFilter.value}
                        onChange={handleChangeVal}
                        disabled={currentCustomFilter.name === "" || currentCustomFilter.op === ""}
                    >
                        <MenuItem value={'eq'}>Equals</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Grid>
        <Grid item xs={12} style={{textAlign: 'end'}}>
            <Button size={"small"} color="secondary"
                    disabled={!addEnabled} variant="contained" className={classes.addButton}>Add</Button>
        </Grid>
    </Grid>;
}

export function CustomFilter({currentFilter, collections}: CustomFilterProps): JSX.Element {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [possibleColumns, SetPossibleColumns] = React.useState<ColumnList>([]);

    const [currentCustomFilter, setCurrentCustomFilter] = React.useState<CurrentCustomFilter>(emptyCustomFilter);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (collections) {
            SetPossibleColumns(PossibleColumnListfromCollections(columnsVar(), collections));
        }
        setCurrentCustomFilter(emptyCustomFilter);
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return <div>
        <Chip
            className={classes.filterChip}
            color="secondary"
            icon={<AddCircleIcon/>}
            label="Add custom filter"
            onClick={handleClick}
        />
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
            className={classes.popover}
        >
            <FilterForm setCurrentCustomFilter={setCurrentCustomFilter} currentFilter={currentFilter}
                        currentCustomFilter={currentCustomFilter} possibleColumns={possibleColumns}/>
        </Popover>
    </div>;
}

