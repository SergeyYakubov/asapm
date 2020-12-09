import React from 'react';
import {IconButton, List, ListItem, ListItemIcon, ListItemText, Popover} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                margin: theme.spacing(1),
            },
            divider: {
                marginLeft: theme.spacing(-1),
                marginRight: theme.spacing(-1),
                margin: theme.spacing(2),
            },
            listItemWithIcon: {
                minWidth: "35px",
            },
            title: {
                marginTop: theme.spacing(0),
                marginBottom: theme.spacing(2),
            },
            tableTitle: {
                marginLeft: theme.spacing(2),
            },
            customDataTitle: {
                marginTop: theme.spacing(3),
                marginLeft: theme.spacing(2),
            },
            chip: {},
            chipRunning: {
//            backgroundColor: '#4caf50',
//            color: '#4caf50',
                borderColor: '#4caf50',
            },
            chipCompleted: {
                borderColor: '#ff8a65',
            },
            chipScheduled: {
//            backgroundColor: '#03a9f4',
                borderColor: '#03a9f4',
            },
            staticMeta: {
                flexGrow: 1,
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
            table: {
                '& > *': {
                    borderBottom: 'unset',
                },
            },
            displayNone: {
                display: 'none',
            },
            switch: {
                marginLeft: 'auto',
                marginRight: theme.spacing(2),
            },
            tabs: {
                borderRight: `1px solid ${theme.palette.divider}`,
            },
            tabLabel: {
                textTransform: 'none',
                alignItems: "flex-start"
            },
            tabPanel: {
                marginLeft: theme.spacing(2),
            },
            colorError: {
                color: '#f54e42',
            },
            buttonWithoutPadding: {
                padding: 0,
            }
        }),
);

function LogbookItemPopover({idRef}: {idRef: string}): JSX.Element {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = () => {
        handleClose();
    };

    const handleEdit = () => {
        console.log('Would edit', idRef);
    };
    const handleDelete = () => {
        console.log('Would delete', idRef);
    };

    return <div>
        <IconButton onClick={handleClick}>
            <MoreVertIcon  className={classes.buttonWithoutPadding}/>
        </IconButton>
        {anchorEl && <Popover
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'right',
            }}
        >
            <List
                dense={true}
                component="nav"
            >
                <ListItem button onClick={() => {handleItemClick(); handleEdit();}}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <EditIcon fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText primary="Edit"/>
                </ListItem>
                <ListItem button onClick={() => {handleItemClick(); handleDelete();}}>
                    <ListItemIcon className={classes.listItemWithIcon}>
                        <DeleteIcon className={classes.colorError} fontSize={"small"}/>
                    </ListItemIcon>
                    <ListItemText className={classes.colorError} primary="Remove"/>
                </ListItem>
            </List>
        </Popover>}
    </div>;
}

export default LogbookItemPopover;
