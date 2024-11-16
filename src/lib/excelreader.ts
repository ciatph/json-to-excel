import fs from 'fs'
import path from 'path'

import {
  TendayHistoricalItemSchema,
  TendayMunicipalityItemSchema,
  TendayHistoricalItem,
  TendayMunicipalityItem,
} from '../types/schemas'
import { throwTypedError } from './utils'

/**
 * Reads weather forecast JSON input files and formats them for Excel export.
 */
class ExcelReader {
  data: TendayHistoricalItem[] | undefined
  columns: string[] | undefined
  outputFolder: string
  inputFolder: string

  /**
   * Creates and initializes an `ExcelReader` class.
   * @param filePath [string] (Optional) Full file path to a directory that contains JSON file(s) following the `TendayHistoricalItem[]` array structure. Defaults to the local `/data` directory.
   * @param outPath [string] (Optional) Full file path to a directory which will contain the converted Excel files. Defaults to the local `/output` directory.
   */
  constructor(filePath?: string, outPath?: string) {
    this.data = []

    this.outputFolder = outPath
      ? outPath
      : path.join(__dirname, '..', '..', 'output')

    this.inputFolder = filePath
      ? filePath
      : path.join(__dirname, '..', '..', 'data')

    this.initOutputDirectory()

    // Initialize Excel column headers ordering
    this.initColumnHeaders(['province', 'municipality'])

    // Read file input
    this.readDataDirectory(filePath)
  }

  /**
   * Sets the Excel column ordering
   * @param initialCols {string[]} String array list of Excel column headers that should appear in the first columns
   * @returns {string[]} List of re-ordered Excel column names
   */
  initColumnHeaders (initialCols: string[]) {
    try {

      const columns = Object.keys(TendayMunicipalityItemSchema.shape)

      const columnOrder: string[] = columns.reduce((list, item) => {
        if (!list.includes(item)) {
          list.push(item)
        }

        return list
      }, [...initialCols])

      this.columns = columnOrder

      if (this.columns === undefined) {
        throw new Error('Undefined column headers')
      }
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Reads the contents of a JSON file that follows the `TendayHistoricalItem` structure into the `this.data[]` arrray.
   * Re-orders the column ordering from the initialized `this.columns[]`.
   * @param filePath {string} Full file path to a directory contaning JSON file(s) following the `TendayHistoricalItem[]` array structure.
   */
  readFile (filePath: string): TendayHistoricalItem[] | undefined {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      TendayHistoricalItemSchema.array().parse(data)
      return this.orderDataColumns(data) as TendayHistoricalItem[] | undefined
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Reads the contents of JSON files that follows the `TendayHistoricalItem[]` array structure into the `this.data[]` arrray from the preset or new directory path.
   * This function expects uniform data structure and metadata eg., `date_created`, etc across all files.
   * Ensures unique municipality-key names if there are duplicate municipality names across provinces.
   * @param filePath [string] (Optional) Full file path to a JSON file following the `TendayHistoricalType[]` array structure. Defaults to the initialized input directory.
   */
  readDataDirectory (filePath?: string) {
    try {
      const fileDirectory = filePath ?? this.inputFolder
      const files = fs.readdirSync(fileDirectory)

      if (files.length === 0) {
        throw new Error('No JSON files provided')
      }

      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(fileName => path.join(fileDirectory, fileName))

      // Read the initial data masterlist
      // NOTE: It expects succeeding data to follow the initial data's structure, contents and no. of items
      this.data = this.readFile(jsonFiles[0])
      const duplicateMunicipalities: string[] = []

      if (!this.data) return
      if (this.data.filter(x => x === undefined).length > 0) return

      // Read, parse and validate the rest of the JSON data files
      for (let i = 1; i < jsonFiles.length; i += 1) {
        const localData = this.readFile(jsonFiles[i])

        if (!localData) continue
        if (localData.filter(x => x === undefined).length > 0) return

        if (localData.length !== this.data.length) {
          throw new Error(`Inconsistent data length on ${jsonFiles[i]}`)
        }

        // Append new municipality data from other provinces (files) to the initial data municipality list
        for (let j = 0; j < localData.length; j += 1) {
          // Find the correct item entry in the initial data by index
          const dateCreated = localData[j].date_created_str
          const initialDataItemIndex = this.data.findIndex(x => x.date_created_str === dateCreated)

          if (initialDataItemIndex === -1) {
            throw new Error(`Error finding data entry for ${dateCreated}`)
          }

          for (const municipality in localData[j].municipalities) {
            let municipalityKey = municipality

            const parentItemList = this.data[initialDataItemIndex].municipalities
            const cursorItemList = localData[j].municipalities

            // Check for null, undefined data arrays
            if (!parentItemList || parentItemList === null || parentItemList === undefined) return
            if (!cursorItemList || cursorItemList === null || cursorItemList === undefined) return

            // Check for duplicate municipality names across provinces
            if (parentItemList[municipality]) {
              const province = cursorItemList[municipality][0].province

              // Create a unique municipality key - append the province name
              const duplicateMunicipalityKey = `${municipality}-${province}`.trim()
              municipalityKey = duplicateMunicipalityKey

              if (!duplicateMunicipalities.includes(duplicateMunicipalityKey)) {
                duplicateMunicipalities.push(duplicateMunicipalityKey)
              }
            }

            // Insert new province-municipality data to masterlist
            this.appendMunicipalityData(initialDataItemIndex, municipalityKey, cursorItemList[municipality])
          }
        }
      }

      if (duplicateMunicipalities.length > 0) {
        const msgHeader = '[WARNING]: Some municipalities already exist in the masterlist, and were assigned a unique province-municipality name:\n'
        const msg = duplicateMunicipalities.reduce((list, item) => list += (item + '\n'), msgHeader)

        console.log(msg)
      }

      console.log('success: reading input JSON data')
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   *
   * @param arrayIndex {number} Array index within the bounds of the `this.data[]` array.
   * @param municipality {string} Municipality name. This becomes a unique combo of province-municipality name in case a similar municipality exists on other province(s)
   * @param data {TendayMunicipalityItem[]} Array of 10-day weather forecast of a municipality (`TendayMunicipalityItem[]`)
   * @returns
   */
  appendMunicipalityData (arrayIndex: number, municipality: string, data: TendayMunicipalityItem[]) {
    try {
      if (!this.data) return
      if (!Array.isArray(this.data)) return
      if (this.data.length === 0) return
      if (arrayIndex > this.data.length || arrayIndex < 0) return

      if (!this.data[arrayIndex].municipalities) {
        this.data[arrayIndex].municipalities = {}
      }

      this.data[arrayIndex].municipalities[municipality] = data
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Sets the contents of the `this.data[]` array.
   * @param data {TendayHistoricalType} Object array following the `TendayHistoricalType` structure
   */
  setData (data: TendayHistoricalItem[]) {
    this.data = data
  }

  /**
   * Returns a `TendayHistoricalItem` entry from the `this.data[]` array by array index number.
   * It may return an empty array or null values.
   * @param arrayIndex {number} Array index within the bounds of the `this.data[]` array.
   * @returns {TendayHistoricalItem}
   */
  getDataItem (arrayIndex: number): TendayHistoricalItem | null {
    if (!Array.isArray(this.data) || this.data.length === 0) return null
    if (arrayIndex > this.data.length) return null

    return this.data[arrayIndex]
  }

  /**
   * Creates the output directory. Clears the output directory of file contents if it already exists.
   */
  initOutputDirectory () {
    try {
      if (!fs.existsSync(this.outputFolder)) {
        fs.mkdirSync(this.outputFolder, { recursive: true })
      } else {
        // Delay for 100 milliseconds when running in Docker
        const delay = process.env.IS_DOCKER ? 100 : 0

        setTimeout(() => {
          fs.rmSync(this.outputFolder, { recursive: true, force: true })
          fs.mkdirSync(this.outputFolder, { recursive: true })
        }, delay)
      }
    } catch (err: unknown) {
      throwTypedError(err)
    }
  }

  /**
   * Re-orders the column ordering of `municipalities[]` items under `TendayHistoricalItem` items.
   * @param data {TendayHistoricalItem[]} a set of `TendayHistoricalItem[]` array items
   * @returns {TendayHistoricalItem[]} Input `data[]` with re-ordered columns
   */
  orderDataColumns (data: TendayHistoricalItem[]) {
    try {
      const newData: TendayHistoricalItem[] = [...data]

      newData.forEach((row) => {
        for (const municipality in row.municipalities) {
          if (!this.columns) return

          // Re-order columns from day 1 - 10
          for (let i = 0; i < 10; i += 1) {
            const dayData = row.municipalities[municipality][i]

            row.municipalities[municipality][i] = this.columns.reduce((acc: TendayMunicipalityItem, key) => {
              acc[key as keyof object] = dayData[key as keyof object]
              return acc
            }, {} as TendayMunicipalityItem)
          }
        }
      })

      return newData
    } catch (err) {
      throwTypedError(err)
    }
  }
}

export default ExcelReader
