const parseCookies = (header = "") => Object.fromEntries(
    header
        .split(";")
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => {
            const separator = value.indexOf("=");
            return [
                decodeURIComponent(value.slice(0, separator)),
                decodeURIComponent(value.slice(separator + 1)),
            ];
        })
);

module.exports = { parseCookies };
