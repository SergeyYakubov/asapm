import React, {useEffect, useRef} from "react";
import { EditorView } from "prosemirror-view";
import * as ProseMirrorMarkdown from "prosemirror-markdown";
import { EditorState } from "prosemirror-state";
import { schemaWithTable } from "./LogbookMarkdownEditor";


function LogbookMarkdownViewer({className, rawMarkdown}: {className?: string, rawMarkdown: string}): JSX.Element {
    const viewHost = useRef() as any;
    const view = useRef<EditorView>(null) as any;

    useEffect(() => { // initial render
        let doc;
        if (rawMarkdown.startsWith('"{')) { // json object
            let parsedContent;
            try {
                // we had to stringify it twice in order to preserve a string in graphql
                parsedContent = JSON.parse(JSON.parse(rawMarkdown));
            } catch(e) {
                console.error('error while trying to parse logbook content', e, rawMarkdown);
                return;
            }

            try {
                doc = schemaWithTable.nodeFromJSON(parsedContent);

            } catch(e) {
                console.error('error while trying to fromJSON logbook content', e, rawMarkdown);
                return;
            }
        } else {
            doc = ProseMirrorMarkdown.defaultMarkdownParser.parse(rawMarkdown);
        }
        const state = EditorState.create({
            schema: schemaWithTable,
            plugins: [],
            doc,
        });
        const x = new EditorView(viewHost.current, { state });
        x.editable = false;
        (x.dom as HTMLElement).contentEditable = 'false';
        view.current = x;
        return () => view.current.destroy();
    }, []);

    return <div className={className} ref={viewHost} />;
}

export default LogbookMarkdownViewer;
