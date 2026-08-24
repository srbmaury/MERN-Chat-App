export const getSender = (loggedUser, users) => {
    return getSenderFull(loggedUser, users)?.name || "Deleted user";
};

export const getSenderFull = (loggedUser, users) => {
    if (!loggedUser || !Array.isArray(users)) return undefined;
    return users.find(user => user && user._id !== loggedUser._id);
};

export const isSameSender = (messages, m, i, userId) => {
    return (
        i < messages.length - 1 &&
        (messages[i + 1].sender._id !== m.sender._id ||
            messages[i + 1].sender._id === undefined || messages[i + 1].createdAt.slice(0, 10) !== m.createdAt.slice(0, 10)
        ) &&
        messages[i].sender._id !== userId
    );
};

export const isLastMessage = (messages, i, userId) => {
    return (
        i === messages.length - 1 &&
        messages[messages.length - 1].sender._id !== userId &&
        messages[messages.length - 1].sender._id
    );
};

export const isSameSenderMargin = (messages, m, i, userId) => {
    if (m.sender._id === userId) return "auto";

    else if (
        i < messages.length - 1 &&
        messages[i + 1].sender._id === m.sender._id &&
        messages[i].sender._id !== userId && messages[i + 1].createdAt.slice(0, 10) === m.createdAt.slice(0, 10)
    )
        return 33;
    return 0;
};

export const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
};

export const isFirstMessageofDay = (messages, m, i) => {
    if (i === 0 || format(new Date(m.createdAt)) !== format(new Date(messages[i - 1].createdAt)))
        return true;
    return false;
};

const format = date => {
    return date.getFullYear() + '-' + ((date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)) + '-' + ((date.getDate() < 10) ? '0' + (date.getDate()) : (date.getDate()));
};

export const formatDate = (givenDate) => {
    const messageDate = new Date(givenDate);
    var date = (new Date());
    var today = format(date);
    date.setDate(date.getDate() - 1)
    var yesterday = format(date);

    if (format(messageDate) === today) return "today";
    if (format(messageDate) === yesterday) return "yesterday";
    return messageDate.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
};

export const formatTime = givenDate => new Date(givenDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

export const formatDate2 = (givenDate) => {
    const messageDate = new Date(givenDate);
    var date = (new Date());
    var today = format(date);
    date.setDate(date.getDate() - 1)
    var yesterday = format(date);

    if (format(messageDate) === today) return formatTime(messageDate);
    if (format(messageDate) === yesterday) return "yesterday";
    return messageDate.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
};
