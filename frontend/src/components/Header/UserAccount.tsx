import React, {useState} from 'react';
import {makeStyles, Theme, withStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Menu, {MenuProps} from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import VpnLockIcon from '@material-ui/icons/VpnLock';
import UserService from "../../userService";

import Typography from '@material-ui/core/Typography';
import Brightness4OutlinedIcon from '@material-ui/icons/Brightness4Outlined';
import Brightness5OutlinedIcon from '@material-ui/icons/Brightness5Outlined';
import BrightnessAutoOutlinedIcon from '@material-ui/icons/BrightnessAutoOutlined';
import Divider from '@material-ui/core/Divider';
import Container from '@material-ui/core/Container';
import userPreferences from "../../userPreferences";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link, TextField
} from "@material-ui/core";
import ApiTokenGeneratorDialog from "./ApiTokenGeneratorDialog";

const useStyles = makeStyles((theme: Theme) => ({
    userAccountButton: {
        marginLeft: 'auto',
    },
    root: {},
    box: {
        marginLeft: theme.spacing(-2),
        marginRight: theme.spacing(-2),
    },
}));

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
            horizontal: 'center',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        {...props}
    />
));

const StyledSubMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props: MenuProps) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'center',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'center',
            horizontal: 'right',
        }}
        {...props}
    />
));

interface ThemeIconProps {
    theme: string
}

function ThemeIcon({theme}: ThemeIconProps) {
    switch (theme) {
        case "light":
            return <Brightness5OutlinedIcon fontSize="small"/>;
        case "dark":
            return <Brightness4OutlinedIcon fontSize="small"/>;
        default:
            return <BrightnessAutoOutlinedIcon fontSize="small"/>;
    }
}

interface ThemeMenuProps {
    closeParent : () => void
}

function ThemeMenu({closeParent}:ThemeMenuProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const {data} = userPreferences.useUserPreferences();
    const themeType = data?.user?.preferences.schema || "auto";
    const [changeTheme] = userPreferences.useUpdateUserTheme();


    const handleChangeTheme = (event: React.MouseEvent<HTMLElement>, theme: string) => {
        changeTheme({variables: {id: (data?.user?.id || ""), schema: theme}});
        handleClose();
    };

    const handleClose = () => {
        setAnchorEl(null);
        closeParent();
    };

    return (
        <MenuItem>
            <Box display="flex" alignItems={'center'} onClick={handleClickListItem}>
                <ListItemIcon>
                    <ThemeIcon theme={themeType}/>
                </ListItemIcon>
                <ListItemText primary={"Change theme ..."}/>
            </Box>
            <StyledSubMenu
                id="lock-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem
                    key={"Auto"}
                    selected={themeType === "auto"}
                    onClick={(event) => handleChangeTheme(event, "auto")}
                >
                    <ListItemIcon>
                        <BrightnessAutoOutlinedIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary={"Use system theme"}/>
                </MenuItem>
                <MenuItem
                    key={"Dark"}
                    selected={themeType === "dark"}
                    onClick={(event) => handleChangeTheme(event, "dark")}
                >
                    <ListItemIcon>
                        <Brightness4OutlinedIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary={"Use dark theme"}/>
                </MenuItem>
                <MenuItem
                    key={"Light"}
                    selected={themeType === "light"}
                    onClick={(event) => handleChangeTheme(event, "light")}
                >
                    <ListItemIcon>
                        <Brightness5OutlinedIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary={"Use light theme"}/>
                </MenuItem>
            </StyledSubMenu>
        </MenuItem>
    );
}


export default function UserAccount(): JSX.Element {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const [apiDialogOpen, setApiDialogOpen] = useState<boolean>(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        UserService.doLogout();
    };

    const handleApiDialogClose = () => {
        setApiDialogOpen(false);
    };
    const handleGenerateApiToken = () => {
        setApiDialogOpen(true);
    };

    const classes = useStyles();
    return (
        <div>
            <IconButton edge="end" className={classes.userAccountButton} color="inherit" onClick={handleClick}>
                <AccountCircle/>
            </IconButton>
            <StyledMenu
                id="menu-appbar"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem>
                    <Container className={classes.root}>
                        <Typography gutterBottom variant="h5" component="h2">
                            User Account
                        </Typography>
                        <Typography id="username" variant="body2" color="textSecondary" component="p">
                            {UserService.getUserName()}
                        </Typography>
                    </Container>
                </MenuItem>
                <Divider/>
                <ThemeMenu closeParent={handleClose}/>
                <MenuItem onClick={handleGenerateApiToken}>
                    <ListItemIcon>
                        <VpnLockIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary="Generate API Token"/>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <ExitToAppIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                </MenuItem>
            </StyledMenu>

            <ApiTokenGeneratorDialog open={apiDialogOpen} onClose={handleApiDialogClose} />
        </div>
    );
}
