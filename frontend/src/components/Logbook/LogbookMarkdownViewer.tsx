import React, {useEffect, useRef} from "react";
import { EditorView } from "prosemirror-view";
import * as ProseMirrorMarkdown from "prosemirror-markdown";
import {EditorState} from "prosemirror-state";
const schema = (ProseMirrorMarkdown as any).schema;


function LogbookMarkdownViewer({className, rawMarkdown}: {className?: string, rawMarkdown: string}): JSX.Element {
    const viewHost = useRef() as any;
    const view = useRef<EditorView>(null) as any;

    useEffect(() => { // initial render
        const state = EditorState.create({schema, plugins: [], doc: ProseMirrorMarkdown.defaultMarkdownParser.parse(rawMarkdown) });
        const x = new EditorView(viewHost.current, { state });
        x.editable = false;
        (x.dom as HTMLElement).contentEditable = 'false';
        view.current = x;
        return () => view.current.destroy();
    }, []);

    return <div className={className} ref={viewHost} />;
}

export default LogbookMarkdownViewer;
