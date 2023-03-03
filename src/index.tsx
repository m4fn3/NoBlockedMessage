import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import {getStoreHandlers} from "./utils/store"
import {getByProps} from "enmity/modules"
import {get} from "enmity/api/settings"
import Settings from "./components/Settings"

const Patcher = create('NoBlockedMessage')

const RelationshipStore = getByProps("isBlocked", "getFriendIDs");
const [
    MessageStore
] = [
    getStoreHandlers("MessageStore")
]


const NoBlockedMessage: Plugin = {
    ...manifest,
    onStart() {
        Patcher.before(MessageStore, "LOAD_MESSAGES_SUCCESS", (self, args, res) => {
            args[0].messages = args[0].messages.filter((message) => {
                return !RelationshipStore.isBlocked(message?.author?.id)
                    && !(message.referenced_message && get(plugin_name, "replies", true) && RelationshipStore.isBlocked(message.referenced_message.author?.id))
            })
        })
        for (const event of ["MESSAGE_CREATE", "MESSAGE_UPDATE"]) {
            Patcher.before(MessageStore, event, (self, args, res) => {
                let message = args[0].message
                if (
                    RelationshipStore.isBlocked(message?.author?.id)
                    || (message.referenced_message && get(plugin_name, "replies", true) && RelationshipStore.isBlocked(message.referenced_message.author?.id))
                ) {
                    args[0].message = {}
                }
            })
        }
    },
    onStop() {
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(NoBlockedMessage)
