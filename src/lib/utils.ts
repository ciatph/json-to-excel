/**
 * Throws an Error with an `"unknown"` type
 * @param error {Error} Error object from a try-catch block
 */
const throwTypedError = (error: unknown) => {
  if (error instanceof Error) {
    throw new Error(error.message)
  } else {
    throw new Error('An unknown error occured')
  }
}

export {
  throwTypedError
}
