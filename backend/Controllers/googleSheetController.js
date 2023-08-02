const { google } = require('googleapis');
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const client = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
);

client.authorize(err => {
    if (err) {
        console.error('Error authenticating:', err);
    } else {
        console.log('Authentication successful!');
    }
});

const saveToSheet = asyncHandler(async (req, res) => {
    try {
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
        const lastRow = currentData.length + 1;

        // Increment the serial number for each row in dataToInsert
        let serialNumber = lastRow;
        const modifiedDataToInsert = dataToInsert.map(item => {
            serialNumber++;
            return [serialNumber, '', '', '', '', item.category, item.message];
        });

        // Append the modified dataToInsert array to the Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'labeled_data!A' + lastRow + ':G', // Range for columns A to G
            valueInputOption: 'RAW',
            resource: { values: modifiedDataToInsert },
        });

        console.log('Data inserted successfully!');
        res.status(200).json({ message: 'Data inserted successfully!' });
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ error: 'An error occurred while inserting data.' });
    }
});

module.exports = { saveToSheet };