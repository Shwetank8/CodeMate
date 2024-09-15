import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';

import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        // Initialize the CodeMirror editor
        editorRef.current = Codemirror.fromTextArea(
            document.getElementById('realtimeEditor'),
            {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            }
        );

        // Handle code change event
        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();

            // Emit code change only if the origin is not setValue (to prevent loops)
            if (origin !== 'setValue') {
                socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }

            // Notify the parent component
            onCodeChange(code);
        });
    }, []); // Empty dependency array since initialization happens once

    useEffect(() => {
        // Listen for code changes from the server
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                // Set code only if different to prevent overwriting user's local edits
                if (code !== editorRef.current.getValue()) {
                    editorRef.current.setValue(code);
                }
            });
        }

        // Cleanup the event listener on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            }
        };
    }, [socketRef, roomId]); // socketRef and roomId can change

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
