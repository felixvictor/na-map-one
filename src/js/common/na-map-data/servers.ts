export const serverIds = ["eu3", "eu1", "eu2"]
export type ServerId = (typeof serverIds)[number]
export type ServerType = "PVE" | "PVP"

export interface Server {
    id: ServerId
    name: string
    type: ServerType
    icon: string
    order: number
}

// If changed check also webpack.config
export const servers: Server[] = [
    { id: "eu3", name: "Main", type: "PVP", icon: "free", order: 1 },
    { id: "eu1", name: "War", type: "PVP", icon: "war", order: 2 },
    { id: "eu2", name: "Peace", type: "PVE", icon: "peace", order: 3 },
]

/* testbed
   server_base_name="clean"
   source_base_url="http://storage.googleapis.com/nacleandevshards/"
   server_names=(dev)
*/

export const getServerType = (serverId: ServerId): ServerType => servers.find((server) => server.id === serverId)!.type
