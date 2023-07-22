export const getSender = (loggedUser, users) => {
    if (loggedUser && users)
        return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};

export const getSenderFull = (loggedUser, users) => {
    if (loggedUser && users)
        return users[0]._id === loggedUser._id ? users[1] : users[0];
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
    if (i === 0 || m.createdAt.slice(0, 10) !== messages[i - 1].createdAt.slice(0, 10))
        return true;
    return false;
};

const format = date => {
    return date.getFullYear() + '-' + ((date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)) + '-' + ((date.getDate() < 10) ? '0' + (date.getDate()) : (date.getDate()));
};

export const formatDate = (givenDate) => {
    var date = (new Date());
    var today = format(date);
    date.setDate(date.getDate() - 1)
    var yesterday = format(date);

    if (givenDate.slice(0, 10) === today) return "today";
    if (givenDate.slice(0, 10) === yesterday) return "yesterday";
    return givenDate.slice(8, 10) + ' ' + checkMonth(givenDate.slice(5, 7).toString()) + ' ' + givenDate.slice(0, 4);
};

export const formatDate2 = (givenDate) => {
    var date = (new Date());
    var today = format(date);
    date.setDate(date.getDate() - 1)
    var yesterday = format(date);

    if (givenDate.slice(0, 10) === today) return givenDate.slice(11, 16);
    if (givenDate.slice(0, 10) === yesterday) return "yesterday";
    return givenDate.slice(8, 10) + ' ' + checkMonth(givenDate.slice(5, 7).toString()) + ' ' + givenDate.slice(0, 4);
};

const checkMonth = (m) => {
    if (m === "01") return "january";
    if (m === "02") return "february";
    if (m === "03") return "march";
    if (m === "04") return "april";
    if (m === "05") return "may";
    if (m === "06") return "june";
    if (m === "07") return "july";
    if (m === "08") return "august";
    if (m === "09") return "september";
    if (m === "10") return "october";
    if (m === "11") return "november";
    if (m === "12") return "december";
}