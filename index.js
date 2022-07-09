// This is an example that uses mineflayer-pathfinder to showcase how simple it is to walk to goals

//import { states } from 'minecraft-protocol'

import mineflayer from 'mineflayer'
import { pathfinder, Movements } from 'mineflayer-pathfinder'

import {createFollowPlayerState} from "./sm/states.js"

import { BotStateMachine } from 'mineflayer-statemachine'

const HOST = "localhost"
const PORT = 50520
const USERNAME = "bot1"

function makeBot(_username, _password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const bot = mineflayer.createBot({
          username: _username,
          password: _password,
          host: HOST,
          port: PORT,
        })

        bot.loadPlugin(pathfinder)
          
        bot.once('spawn', () => {
            resolve(bot)

            //const mcData = require('minecraft-data')(bot.version)
            
            // Now we just wrap our transition list in a nested state machine layer. We want the bot
            // to start on the getClosestPlayer state, so we'll specify that here.
            const rootLayer = createFollowPlayerState(bot)
            
            // We can start our state machine simply by creating a new instance.
            const sm = new BotStateMachine(bot, rootLayer);

            bot.on('chat', (username, message) => {
                if (message == "stay") {
                    //transitionsMap["tIdle"].trigger()
                    transitions[3].trigger()
                }
                if (message == "debug") {
                    bot.chat(`♥${parseInt(bot.health)} ☙${parseInt(bot.food)} active state: [${rootLayer.activeState.stateName}]`)
                }
            })

        })

        bot.on('error', (err) => reject(err))
        setTimeout(() => reject(Error('Took too long to spawn.')), 5000) // 5 sec
      }, 500)
    })
  }

async function main () {
    const botProms = [makeBot("1"), makeBot("2")]

    const bots = (await Promise.allSettled(botProms)).map(({ value, reason }) => value || reason).filter(value => !(value instanceof Error))
    console.log("bots logged in")
}
  
main()