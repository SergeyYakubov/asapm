import React from 'react';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Menu, {MenuProps} from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import UserService from "../../userService";

import Typography from '@material-ui/core/Typography';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Divider from '@material-ui/core/Divider';
import Container from '@material-ui/core/Container';
import userPreferences from "../../userPreferences";

const useStyles = makeStyles(() => ({
    userAccountButton: {
        marginLeft: 'auto',
    },
    root: {
        maxWidth: 345,
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

export default function UserAccount(): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const {data} = userPreferences.useUserPreferences();
    const themeType = data?.user?.preferences.schema || "light";

    const [changeTheme] = userPreferences.useUpdateUserTheme();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        UserService.doLogout();
    };

    const otherTheme = themeType === "light" ? "dark" : "light";

    const handleChangeTheme = () => {
        changeTheme({variables: {id: (data?.user?.id || ""), schema: otherTheme.toString()}});
        handleClose();
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
                <MenuItem onClick={handleChangeTheme}>
                    <ListItemIcon>
                        <Brightness4Icon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary={"Use " + otherTheme.toString() + " theme"}/>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <ExitToAppIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                </MenuItem>
            </StyledMenu>
        </div>
    );
}
