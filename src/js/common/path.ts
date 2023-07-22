// https://stackoverflow.com/a/46427607
const buildPath = (...args: string[]) => {
    return args
        .map((part, i) => {
            if (i === 0) {
                return part.trim().replace(/\/*$/g, "")
            }

            return part.trim().replace(/(^\/*|\/*$)/g, "")
        })
        .filter((x) => x.length)
        .join("/")
}

// https://stackoverflow.com/a/50052194

interface DirList {
    dirOutput: string
    dirSrc: string
    dirWebpack: string
}

/**
 * Build common paths and file names
 */
export function getCommonPaths(appRoot = process.env.PWD ?? ""): DirList {
    const dirOutput = buildPath(appRoot, "public")
    const dirSrc = buildPath(appRoot, "src")
    const dirWebpack = buildPath(appRoot, "webpack")

    return {
        dirOutput,
        dirSrc,
        dirWebpack,
    }
}
