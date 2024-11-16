import path from 'path'

import ExcelWriter from './../lib/excelwriter'
import { throwTypedError } from '../lib/utils'

/**
 * Exports all weather forecast JSON files in a directory to Excel files
 */
const main = () => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'data')
    const outPath = path.join(__dirname, '..', '..', 'output')

    const converter = new ExcelWriter(filePath, outPath)
    converter.exportDataToExcel()

    console.log(`\nSuccess creating Excel files at ${filePath}`)
    process.exit(0)
  } catch (err: unknown) {
    throwTypedError(err)
  }
}

if (process.env.IS_DOCKER) {
  setTimeout(() => {
    console.log('Starting process')
    main()
  }, 5000)
} else {
  main()
}
