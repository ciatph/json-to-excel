import xlsx from 'xlsx'
import path from 'path'

import ExcelReader from './excelreader'
import { throwTypedError } from './utils'

/**
 * Writes processed weather forecast data from `ExcelReader` to Excel files.
 */
class ExcelWriter extends ExcelReader {
  /**
   * Writes object data to an Excel file
   * @param data {Object[]} Row object data
   */
  createExcel (params: {
    data: object[];
    sheetName: string;
    fileName: string;
    filePath?: string;
   }) {
    try {
      const excelFileName = params?.fileName ?? 'output.xlsx'
      let pathToFile = params?.filePath ?? path.join(__dirname, '..', '..')
      pathToFile = path.join(pathToFile, excelFileName)

      const worksheet = xlsx.utils.json_to_sheet(params.data)
      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, params.sheetName)

      xlsx.writeFile(workbook, pathToFile, { compression: true })
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Formats a `TendayHistoricalItem` weather forecast JSON data and writes it to an Excel file.
   * @param arrayIndex
   * @returns
   */
  createExcelByIndex (arrayIndex: number) {
    try {
      const item = this.getDataItem(arrayIndex)

      if (!item) {
        console.log('Nothing to export')
        return
      }

      if (
        !this.columns ||
        this.columns === undefined ||
        this.columns === null
      ) return

      if (item.error !== null) {
        console.log(`Skipping item with parsing error on ${item.date_created_str}`)
        return
      }

      // Create a new XLSX workbook
      const workbook = xlsx.utils.book_new()

      // Configure Excel file name and file path
      const fileName = `${item.date_created_str.replace(/\//g, '-')}.xlsx`
      const pathToFile = path.join(__dirname, '..', '..', 'output', fileName)

      // Build Excel data
      for (let i = 0; i < 10; i += 1) {
        const objData: object[] = []

        for (const municipality in item.municipalities) {
          // Check all municipalities have day 1 - 10 data
          if (item.municipalities[municipality].length !== 10) {
            throw new Error(`Missing day data on ${municipality}, ${item.date_created_str}`)
          }

          objData.push(item.municipalities[municipality][i])
        }

        // Create a new worksheet for the day
        const worksheet = xlsx.utils.aoa_to_sheet([
          ['Date Created', item.date_created_str],
          ['Valid until', item.date_range],
          ['Forecast Date', item.date_forecast],
          ['ID', item.id],
          [],
          this.columns // Add the column headers after the metadata
        ])

        // Rows data
        xlsx.utils.json_to_sheet(objData, { header: this.columns })
        xlsx.utils.sheet_add_json(worksheet, objData, { skipHeader: false, origin: 'A6' }) // Add objData starting from row 6
        xlsx.utils.book_append_sheet(workbook, worksheet, `Day ${i + 1}`)
      }

      // Write Excel data to file
      xlsx.writeFile(workbook, pathToFile, { compression: true })
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Formats all processed weather forecast JSON data (`TendayHistoricalType`) in the `this.inputPath` directory and writes them to Excel files per item.
   */
  exportDataToExcel () {
    try {
      this.initOutputDirectory()
      if (!this.data) return

      for (let i = 0; i < this.data.length; i += 1) {
        this.createExcelByIndex(i)
      }
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }
}

export default ExcelWriter
