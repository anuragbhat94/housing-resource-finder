# Marshall County Housing Resource Finder

## What This Demo Uses

The page reads housing resources from:

`demo/data/marshall-county-housing-resources.xlsx`

The website uses only the `Resources_Web` sheet. Keep the column names unchanged.

Rows with `Public_Status = Ready for public` show by default. Rows marked `Staff verify before public` only show when the checkbox is selected.

## Run Locally

From the `demo` folder:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open:

`http://127.0.0.1:8080/`

## Update The Local Excel File

1. Edit `demo/data/marshall-county-housing-resources.xlsx`.
2. Keep the `Resources_Web` sheet and its headers.
3. Save the workbook with the same file name.
4. Refresh the webpage.

## Use Google Drive / Google Sheets Later

Recommended no-cost approach:

1. Upload the workbook to Google Drive.
2. Open it with Google Sheets.
3. Keep `Resources_Web` as the sheet that powers the website.
4. In Google Sheets, go to `File > Share > Publish to web`.
5. Choose only the `Resources_Web` sheet.
6. Choose `Comma-separated values (.csv)`.
7. Publish and copy the CSV link.

The link usually looks like:

```text
https://docs.google.com/spreadsheets/d/e/PUBLISHED_ID/pub?gid=SHEET_GID&single=true&output=csv
```

Then edit the top of `demo/app.js`:

```js
const DATA_SOURCE = {
  type: "csv",
  url: "PASTE_PUBLISHED_CSV_LINK_HERE",
  sheetName: "Resources_Web",
};
```

After that, upload the `demo` folder to the website host. The page will fetch the published Google Sheet CSV.

You can also test without editing code by opening:

```text
http://127.0.0.1:8080/?type=csv&data=PASTE_ENCODED_CSV_LINK_HERE
```

## Privacy Note

Do not publish staff-only sheets if they contain notes that should not be public. The safest setup is to publish only the `Resources_Web` sheet or create a public copy with only `Resources_Web`.

## Microsoft Excel / OneDrive Note

OneDrive and SharePoint links often require authentication or block browser `fetch` requests through CORS. For a free static webpage, Google Sheets published CSV is usually simpler. If the final website must use Microsoft 365 directly, developers should fetch the workbook server-side through Microsoft Graph or export the `Resources_Web` sheet to a public CSV/JSON endpoint.
