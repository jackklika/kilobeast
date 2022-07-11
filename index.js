// This is an example that uses mineflayer-pathfinder to showcase how simple it is to walk to goals

//import { states } from 'minecraft-protocol'

import mineflayer from 'mineflayer'
import { pathfinder } from 'mineflayer-pathfinder'
import { plugin } from 'mineflayer-pvp'

import { createKillCook } from "./sm/states.js"

import { BotStateMachine } from 'mineflayer-statemachine'

const HOST = "localhost"
const PORT = 58399

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
      bot.loadPlugin(plugin) // pvp

      bot.once('spawn', () => {
        resolve(bot)

        //const mcData = require('minecraft-data')(bot.version)

        // Now we just wrap our transition list in a nested state machine layer. We want the bot
        // to start on the getClosestPlayer state, so we'll specify that here.
      
        //const rootLayer = createFollowPlayerState(bot)
        const rootLayer = createKillCook(bot, "pig")
        

        // We can start our state machine simply by creating a new instance.
        new BotStateMachine(bot, rootLayer);

        bot.on('chat', (username, message) => {
          if (message == "debug") {
            bot.chat(`♥${parseInt(bot.health)} ☙${parseInt(bot.food)} [${rootLayer.activeState.activeState.stateName}]`)
            console.log(bot.inventory.count(763)) //porkchop 1.18
            console.log(bot.username, " -- ", rootLayer.activeState.activeState)
          }
        })

      })

      bot.on('error', (err) => reject(err))
      setTimeout(() => reject(Error('Took too long to spawn.')), 5000*5) // 5 sec
    }, 500)
  })
}

async function main() {
  const botProms = [...Array(5).keys()].map((num) => {
    makeBot(`${num}`)
  })


  const bots = (await Promise.allSettled(botProms)).map(({ value, reason }) => value || reason).filter(value => !(value instanceof Error))
  console.log("bots logging in", bots)
}

main()