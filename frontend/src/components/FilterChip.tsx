import {CollectionFilter, FieldFilter, InvertFilterOp, RemoveElement, ReplaceElement, TextOpToSQLOp} from "../common";
import React from "react";
import {Chip, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import VisibilityIcon from "@material-ui/icons/Visibility";
import FlipCameraAndroidIcon from "@material-ui/icons/FlipCameraAndroid";
import DeleteIcon from "@material-ui/icons/Delete";
import {collectionFilterVar} from "./FilterBoxes";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {FilterForm} from "./CustomFilter";
import {CollectionEntry} from "../generated/graphql";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        listItemWithIcon: {
            minWidth: "35px",
        },
        filterChip: {
            margin: "5px",
        },
        filterChipDisabled: {
            margin: "5px",
            color: theme.palette.text.disabled,
        },
    }),
);


interface FilterChipProps {
    filter: CollectionFilter
    fieldFilter: FieldFilter,
    collections: CollectionEntry[] | undefined
}

export function FilterChip({filter,fieldFilter,collections}: FilterChipProps): JSX.Element {
    const classes = useStyles();
    const handleDelete = () => {
        collectionFilterVar({...filter, fieldFilters: RemoveElement(fieldFilter, filter.fieldFilters)});
    };

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleEdit = () => {
        setAnchorEl2(anchorEl);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl2(null);
        setAnchorEl(null);
    };

    const handleEnable = () => {
        const updatedFilter  = {...fieldFilter,enabled:!fieldFilter.enabled};
        collectionFilterVar({...filter, fieldFilters: ReplaceElement(fieldFilter,updatedFilter, filter.fieldFilters)});
        handleClose();
    };

    const handleInvert = () => {
        const updatedFilter  = {...fieldFilter,op:InvertFilterOp(fieldFilter.op)};
        collectionFilterVar({...filter, fieldFilters: ReplaceElement(fieldFilter,updatedFilter, filter.fieldFilters)});
        handleClose();
    };

    let label:string;
    if (fieldFilter.filterString) {
        label = fieldFilter.filterString;
    } else {
        label = (fieldFilter.alias?fieldFilter.alias:fieldFilter.key) + " " +  TextOpToSQLOp(fieldFilter.op!) + " " + fieldFilter.value;
    }

    return <div>
        <Chip
            key={fieldFilter.value}
            className={fieldFilter.enabled ? classes.filterChip : classes.filterChipDisabled}
            label={label}
            onClick={handleClick}
            onDelete={handleDelete}
        />
        {anchorEl2 &&
        <Popover
            id="simple-menu"
            anchorEl={anchorEl2}
            keepMounted
            open={Boolean(anchorEl2)}
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
            <FilterForm fieldFilterToEdit={fieldFilter} close={handleClose} currentFilter={filter}
                        collections={collections}/>
        </Popover>
        }

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
                        Change filter
                    </ListSubheader>
                }
            >
                <ListItem button onClick={handleEdit}  >
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <EditIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Edit filter"/>
                </ListItem>

                <ListItem button onClick={handleEnable}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        {fieldFilter.enabled?
                            <VisibilityOffIcon fontSize={"small"}/>
                            :
                            <VisibilityIcon fontSize={"small"}/>
                        }
                    </ListItemIcon>
                    <ListItemText primary={fieldFilter.enabled?"Disable":"Enable"}/>
                </ListItem>
                <ListItem button onClick={handleInvert} disabled={!!fieldFilter.filterString} >
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <FlipCameraAndroidIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Invert filter"/>
                </ListItem>
                <ListItem button onClick={handleDelete}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <DeleteIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Delete"/>
                </ListItem>
            </List>
        </Popover>

    </div>;
}
