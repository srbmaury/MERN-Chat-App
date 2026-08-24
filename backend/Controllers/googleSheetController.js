const { google } = require('googleapis');
const asyncHandler = require("express-async-handler");
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const createClient = () => {
    if (!process.env.CLIENT_EMAIL || !process.env.PRIVATE_KEY || !spreadsheetId) {
        const error = new Error("Google Sheets integration is not configured");
        error.statusCode = 503;
        throw error;
    }
    return new google.auth.JWT({
        email: process.env.CLIENT_EMAIL,
        key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

const saveToSheet = asyncHandler(async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: "Only administrators can export review data" });
        }
        const client = createClient();
        let { dataToInsert } = req.body;
        if (!Array.isArray(dataToInsert)) {
            dataToInsert = [dataToInsert];
        }

        // Get the current data from the Google Sheets
        const sheets = google.sheets({ version: 'v4', auth: client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'labeled_data!A:G', // Assuming the serial number is in column A and data is in columns F and G
        });

        const currentData = response.data.values || [];
        const firstAppendRow = currentData.length + 1;

        // Increment the serial number for each row in dataToInsert
        let serialNumber = currentData.length;
        const modifiedDataToInsert = dataToInsert.map(item => {
            serialNumber++;
            return [serialNumber, '', '', '', '', item.category, item.message];
        });

        // Append the modified dataToInsert array to the Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'labeled_data!A' + firstAppendRow + ':G', // Range for columns A to G
            valueInputOption: 'RAW',
            resource: { values: modifiedDataToInsert },
        });

        console.log('Data inserted successfully!');
        res.status(200).json({ message: 'Data inserted successfully!' });
    } catch (err) {
        const googleError = err.response?.data?.error_description || err.message;
        console.error(`Google Sheets export failed: ${googleError}`);
        const authenticationFailed = err.response?.data?.error === 'invalid_grant';
        res.status(authenticationFailed ? 503 : 500).json({
            error: authenticationFailed
                ? 'Google Sheets service account is invalid or no longer exists.'
                : 'An error occurred while inserting data.'
        });
    }
});

module.exports = { saveToSheet };
