import {
    Button, CircularProgress,
    Dialog, DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link,
    TextField
} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import userService from "../../userService";
import {ApplicationApiBaseUrl} from "../../common";
import {makeStyles, Theme} from "@material-ui/core/styles";
import AssignmentIcon from "@material-ui/icons/Assignment";

interface ApiTokenGeneratorDialogProps {
    open: boolean;
    onClose: () => void;
}

const useStyles = makeStyles((theme: Theme) => ({
    pre: {
        background: theme.palette.background.default,
        overflowX: 'scroll',
    },
}));

export default function ApiTokenGeneratorDialog({open, onClose}: ApiTokenGeneratorDialogProps): JSX.Element {
    const classes = useStyles();

    const [apiToken, setApiToken] = useState<string>('');
    const [errorText, setErrorText] = useState<string>('');

    // only generate a new token when needed
    useEffect(() => {
        setApiToken('');
        setErrorText('');
        if (open) {
            userService.generateOfflineApiToken().then(token => {
                setApiToken(token);
            }).catch(e =>  {
                console.error(e);
                setErrorText(e.message);
            });
        }
    }, [open]);

    const tokenBoxRef = React.createRef<any>();

    function copyTokenToClipboard() {
        if (!tokenBoxRef.current) {
            return;
        }
        const parentElement = tokenBoxRef.current as HTMLDivElement;
        const inputElement = parentElement.querySelector('input') as HTMLInputElement;

        // Select the text field
        inputElement.disabled = false;
        inputElement.focus();
        inputElement.select();
        inputElement.setSelectionRange(0, 99999);
        inputElement.disabled = true;

        // Copy the text inside the text field
        document.execCommand("copy");
    }

    return <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="api-token-menu-title"
        aria-describedby="api-token-menu-description"
    >
        <DialogTitle id="api-token-menu-title">Copy your token</DialogTitle>
        <DialogContent>
            {
                errorText
            }
            {
                apiToken ?
                <React.Fragment>
                    <DialogContentText id="api-token-menu-description">
                        A new API token was created&nbsp;
                        <Link href={"https://eosc-pan-git.desy.de/mdp/asapm/-/tree/develop/clients"}>that can be used
                        with our clients</Link>.
                    </DialogContentText>
                    <div style={{display: 'flex'}}>
                        <TextField
                            ref={tokenBoxRef}
                            autoFocus
                            margin="dense"
                            label="API Token"
                            type="text"
                            fullWidth
                            value={apiToken}
                            disabled={true}
                        />
                        <Button title={"Copy to clipboard"} onClick={copyTokenToClipboard}><AssignmentIcon/></Button>
                    </div>
                    <pre className={classes.pre}>
                        <code>./yourScript \<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;--url "{ApplicationApiBaseUrl}" \<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;--token "{apiToken}" \<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;--authServiceUrl "{process.env.REACT_APP_KEYCLOAK_ENDPOINT}"<br/>
                        </code>
                    </pre>
                </React.Fragment>
                :
                <React.Fragment>
                    <CircularProgress />
                </React.Fragment>
            }
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} color="primary">
                Close
            </Button>
        </DialogActions>
    </Dialog>;
}
