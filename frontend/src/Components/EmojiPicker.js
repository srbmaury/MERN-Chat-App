import React, { useEffect, useRef } from 'react';
import 'emoji-picker-element';

const EmojiPicker = (props) => {
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleEmojiClick = (event) => {
            const input = props.inputRef.current;
            if (input) {
                const caretPosition = input.selectionStart;
                const emoji = event.detail.unicode;
                const newMessage =
                    props.newMessage.slice(0, caretPosition) + emoji + props.newMessage.slice(caretPosition);

                props.setEmojiDisplay(false);
                props.setNewMessage(newMessage);

                setTimeout(() => {
                    const newCaretPosition = caretPosition + emoji.length;
                    input.focus();
                    input.setSelectionRange(newCaretPosition, newCaretPosition);
                }, 0);
            }
        };

        const emojiPicker = pickerRef.current;
        if (!emojiPicker) return;
        emojiPicker.addEventListener('emoji-click', handleEmojiClick);

        return () => {
            emojiPicker.removeEventListener('emoji-click', handleEmojiClick);
        };
    }, [props.inputRef, props.newMessage, props.setEmojiDisplay, props.setNewMessage]);

    return (
        <emoji-picker
            ref={pickerRef}
            style={{
                position: 'absolute',
                bottom: '52px',
                left: 0,
                maxWidth: 'min(352px, calc(100vw - 32px))',
                zIndex: 200,
            }}
        />
    );
};

export default EmojiPicker;
