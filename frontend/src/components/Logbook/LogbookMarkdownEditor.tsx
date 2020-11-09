import * as ProseMirrorMarkdown from "prosemirror-markdown";
const schema = (ProseMirrorMarkdown as any).schema;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-menu/style/menu.css';
import './LogbookMarkdownEditor.css';

import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {exampleSetup} = require('prosemirror-example-setup');

const reactPropsKey = new PluginKey("reactProps");

function reactProps(initialProps: any) {
    return new Plugin({
        key: reactPropsKey,
        state: {
            init: () => initialProps,
            apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
        },
    });
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        editor: {
            '& .ProseMirror': {
                maxHeight: '300px',
            }
        }
    })
);
const LogbookMarkdownEditor = forwardRef((props, ref) => {
    const classes = useStyles();

    const viewHost = useRef() as any;
    const view = useRef<EditorView>(null) as any;

    useImperativeHandle(ref, () => ({
        getRawContent(): string {
            return ProseMirrorMarkdown.defaultMarkdownSerializer.serialize(view.current.state.doc);
        }
    }));

    useEffect(() => { // initial render
        const state = EditorState.create({schema, plugins: exampleSetup({schema}) });
        view.current = new EditorView(viewHost.current, { state });
        return () => view.current.destroy();
    }, []);

    useEffect(() => { // every render
        const tr = view.current.state.tr.setMeta(reactPropsKey, {});
        view.current.dispatch(tr);
    });

    return <div id="editor" ref={viewHost} className={classes.editor} />;
});

export default LogbookMarkdownEditor;
