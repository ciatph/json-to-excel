## json-to-excel

Node script that exports historical 10-day weather forecast JSON data to Excel files.

### Requirements

1. Node LTS v20.15.0
   - node: 20.15.0
   - npm: 10.7.0

### Core Libraries

- xlsx [[link]](https://cdn.sheetjs.com) - Used for creating Excel files
- zod [[link]](https://www.npmjs.com/package/zod) - Light-weight data validation
- Node v20.15.0 - Native Node modules for file system operations

### Table of Contents

- [Requirements](#requirements)
- [Installation and Usage](#installation-and-usage)
- [Available Scripts](#available-scripts)
- [Debugging with Docker](#debugging-with-docker)
- [Data Description](#data-description)

## Installation and Usage

1. Clone the repository.

2. Install dependencies using Node or Docker.<br>
   - **Using Node**: Run the command<br>
      ```
      npm install
      ```
   - **Using Docker**: Run the command<br>
      ```
      docker compose -f docker-compose.prod.yml build
      ```

3. Put the weather forecast data JSON files inside the **/data** directory.
   > **INFO:** These files should follow uniform data and structure, following the `TendayHistoricalItem` TS type or the `TendayHistoricalItemSchema` zod schema. View the `/data/samples/sample_response.json` for example and the [Data Description](#data-description) section for more information.

4. Run the [Available Scripts](#available-scripts).
   - Example using **Node**
      ```
      npm run <AVAILABLE_SCRIPT>
      ```

   - Example using **Docker** (in Windows):
      > **INFO:** only the `"npm start"` and `"npm run start:container"` scripts are available on the production build

      ```
      # Run the JSON to EXCEL script
      docker run -it --rm -v %cd%\data:/opt/app/data -v %cd%\output:/opt/app/output ciatphdev/json-to-excel

      # Alternate option
      docker run -it --rm -v %cd%\data:/opt/app/data -v %cd%\output:/opt/app/output ciatphdev/json-to-excel npm run <AVAILABLE_SCRIPT>
      ```

## Available Scripts

### `npm start`

Reads the weather forecast data files and writes them to Excel files inside the **/output** directory.

### `npm run transpile`

Builds the JavaScript files from the TypeScript files.

### `npm run debug`

Transpiles the TypeScript files and runs the start script.

### `debug:container`

Runs the `npm run debug` script with VSCode inspector inside a container.

### `start:container`

Runs the `npm start` script with VSCode inspector inside a container.

### `npm run lint`
Lint TypeScript source codes.

### `npm run lint:fix`

Fixes TypeScript lint errors.

## Debugging with Docker

1. Copy the following data to the **.vscode/launch.json** file's `configurations[]` array.

   ```
   {
     "type": "node",
     "request": "attach",
     "name": "Attach to Docker",
     "port": 9229,
     "address": "localhost",
     "localRoot": "${workspaceFolder}",
     "remoteRoot": "/opt/app",
     "sourceMaps": true,
     "skipFiles": ["<node_internals>/**"]
   }
   ```

2. Build the **development** Docker image.<br>
`docker compose -f docker-compose.dev.yml build`

3. Run the **development** Docker container.<br>
`docker compose -f docker-compose.dev.yml up`

4. Run scripts in the development container for debugging.<br>
`docker exec -it ciatph-json-excel-dev npm run debug:container`

5. Start the **Attach to Docker** debug configuration in VSCode after seeing this log in the command line:<br>

   ```
   Debugger listening on ws://0.0.0.0:9229/<some-random-string>
   For help, see: https://nodejs.org/en/docs/inspector
   ```

## Data Description

The expected JSON input files contain the following data.

### `TendayMunicipalityItem`

Common data. (Items with `"*"` are displayed in the output Excel headers)

<details>
<summary>View the <b>TendayMunicipalityItem</b> data summary.</summary>

| ID | Type | Description |
| --- | ---| --- |
| date_archived | number | timestamp - date of archiving the 10-day forecast |
| date_archived_str | string | date string |
| date_created | number | timestamp - date of fetching the 10-day forecast |
| date_created_str* | string | date string |
| date_end | string | ISO date string of the date range's **end date** |
| date_end_str | string | date string |
| date_forecast | string | descriptive PAGASA date string of releasing the 10-day forecast |
| date_forecast_str* | string | date string |
| date_range* | string | free-format PAGASA 10-day validity date range string |
| date_start | string | ISO date string of the date range's **start date** |
| date_start_str | string | date string |
| error | Object | 10-day forecast fetching error logs |
| id* | String | Historical data unique ID |
| municipalities | Object | Key-value pairs whose keys are municipality names and value is an array of 10-day weather forecast data from day 1 - 10 (see **`TendayHistoricalItem`** for more information) |

</details>

<br>

### `TendayHistoricalItem`

Each Excel row contains the following column data per municipality.

<details>
<summary>View the <b>TendayHistoricalItem</b> data summary.</summary>

| ID | Type | Description |
| --- | --- | --- |
| cover | string | cloud cover |
| day | number | day number (one of 1 - 10) |
| day_format | string | String format of the forecast date, minus year |
| day_str | string | YYYY/MM/DD format of the forecast date |
| humidity | number | humidity value |
| municipality | string | municipality name |
| province | string | province name |
| rainfall | string | rainfall text description |
| rainfall_amt_text | string | Descriptive text of rainfall amount linked with the rainfall field. |
| tmax | number | maximum temperature |
| tmean | number | average mean temperature |
| tmin | number | minimum temperature |
| wdirection | string | wind direction text label |
| wspeed | number | wind speed value |

</details>

<br>

@ciatph<br>
20241116
