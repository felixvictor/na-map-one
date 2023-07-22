import yargs from "yargs"
import { hideBin } from "yargs/helpers"

const argv = yargs(hideBin(process.argv)).argv

// @ts-expect-error mode
export const isProduction = argv.mode === "production"
export const { TARGET, QUIET } = process.env
