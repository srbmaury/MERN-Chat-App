import React, { useEffect } from 'react';
import 'emoji-picker-element';

const EmojiPicker = (props) => {
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

        const emojiPicker = document.querySelector('emoji-picker');
        if (!emojiPicker) return;
        emojiPicker.addEventListener('emoji-click', handleEmojiClick);

        return () => {
            emojiPicker.removeEventListener('emoji-click', handleEmojiClick);
        };
    }, []);

    return (
        <emoji-picker style={{ 'position': 'fixed' }}></emoji-picker>
    );
};

export default EmojiPicker;
