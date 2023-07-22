import { execSync } from "node:child_process"
import { isNodeError, putFetchError } from "./file.js"

export const executeCommand = (command: string): Buffer => {
    let result = {} as Buffer

    try {
        result = execSync(command)
    } catch (error: unknown) {
        if (isNodeError(error) && error.code === "ENOENT") {
            console.error("Command failed -->", error)
        } else {
            putFetchError(error as string)
        }
    }

    return result
}
