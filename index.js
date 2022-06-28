import { Crop } from './Crops/Crop.js'
import { FarmerHouse } from './Map/FarmerHouse.js'
import { Farmer } from './Entities/Farmer.js'
import { Player } from './Entities/Player.js'
import * as Vector from './Map/Vectors.js'
import { Map } from './Map/Map.js'
import * as mapJson from './Map/mapFile.json' assert {type: 'json'}

const maxEntityEnergy = 100

function onCloseFarmer(player, entitiesList, callback){
    for (const entity of entitiesList){
        if(entity instanceof Farmer){
            if (
                Math.abs(entity.location.x - player.location.x) <= 3 &&
                Math.abs(entity.location.y - player.location.y) <= 3
            )
            callback(player, entity)
        }
    }
}

const map = new Map(mapJson.default)

const entities = []
map.forEachPoint((point, target) => {
    if (target instanceof FarmerHouse){
        entities.push(new Farmer({
            farmerHouse: target, 
            myLocation: {x: point.x + 2, y: point.y + 1}, 
            houseLocation: point,
            map
        }))
    }
})

const player = new Player({
    location: {x: 3, y: 3},
    direction: "d",
    money: 0,
    energy: 40,
    map,
})

// TODO: entities.push(player)
// need to verify this doesn't break anything.
// But then we could cut the call to player.image() below.

const defaultWidth = 11
const defaultHeight= 7

// You can only harvest between values 5 and 8 (inclusive)
// Harvesting reduces size by 4
// Things only grow by themselves between 3 and 7 (inclusive)
// So harvesting at 5 or 6 is detrimental - you should wait for 7 or 8.

/// Begin async stuff
window.onload = async function(){
    
    /**
     * @type HTMLTextAreaElement
     */ 
    const mainScreen = document.getElementById("mainScreen")
    const playerStats = document.getElementById("playerStats")
    const leftNotification = document.getElementById("leftNotification")
    const rightNotification = document.getElementById("rightNotification")


    mainScreen.onclick = () => {
        mainScreen.requestPointerLock()
    }

    // Pointer lock listers
    document.addEventListener('pointerlockchange',pointerLockChangeListener, false);
    let tickInterval = null

    function pointerLockChangeListener(){
        if (document.pointerLockElement === mainScreen){
            console.log("Adding listeners")
            mainScreen.addEventListener('keydown', handleKeypress)
            tickInterval = tickInterval ||  setInterval(tick, 1000)
        } else {
            console.log("Removing listeners")
            mainScreen.removeEventListener('keydown', handleKeypress, true)

            if(tickInterval){
                clearInterval(tickInterval)
                tickInterval = null
            }
        }
    }

    // End pointer lock listeners

    function printLocation({
        x = player.location.x, 
        y = player.location.y, 
        width = defaultWidth, 
        height = defaultHeight
    }){
        const toPrint = []
        // the point (x=0, y=0) is the top left. Positive y is down.
        for (let j = y - Math.floor(height/2); j < y + Math.ceil(height / 2); j += 1){
            const row = []
            for (let i = x- Math.floor(width/2); i < x + Math.ceil(width / 2); i+=1){
                row.push(map.findImageFor({y: j, x: i}))
                for (const entity of entities){
                    if(entity.location.x == i && entity.location.y == j){
                        row[row.length - 1] = entity.image()
                    }
                }
            }
            toPrint.push(row)
        }
        // Show the player in the center instead.
        toPrint[Math.floor(height / 2)][Math.floor(width / 2)] = player.image()

        mainScreen.value = toPrint.map(row => row.join("")).join("\n")

        playerStats.innerText = `Money: \$${player.money}  Energy: ${Math.floor(player.energy)}`
    }



    /**
     * @param {KeyboardEvent} event 
     */ 
    function handleKeypress(event){
        console.log(`"Got event ${event.key}`)

        if (event.key in Vector.directions){
            player.move(event.key)
        }

        if (event.key == "Enter"){
            const growSuccessful = player.grow()
            if (growSuccessful){
                onCloseFarmer(player, entities, (player, farmer) => {
                    const message = farmer.noticePlayerGrow(player)
                        notify(message)
                })
            }
        }

        if (event.key == "h"){
            const moneyGained = player.harvest()
            if (moneyGained > 0){
                notify(`+ $${moneyGained}`)
                onCloseFarmer(player, entities, (player, farmer) => {
                    const message = farmer.noticePlayerHarvest(player)
                    notify(message)
                })
            }
        }

        printLocation({})
    }

    /**
     * @type 
     */ 
    let endNotificationTimer = null
    function notify(toNotify){
        leftNotification.innerText = toNotify
        rightNotification.innerText = toNotify

        if (endNotificationTimer){
            clearTimeout(endNotificationTimer)
        }
        endNotificationTimer = setTimeout(endNotification, 3000)
    }

    function endNotification(){
        leftNotification.innerText = ""
        rightNotification.innerText = ""
        endNotificationTimer = null
    }

    function tick(){
        console.log("Running tick");
        map.forEachPoint((point, target) => {
            if (target instanceof Crop){
                // Grow things
                if (target.canAutoGrow()){
                    if (Math.random() < .08){
                        target.grow()
                    }
                }
                // Cleanup any crops that should be blank earth now.
                // Usually this happens from harvesting an overgrown crop.
                if(target.stage == -1){ 
                    map.set(point, 0)
                }
            }
        })

        // Gain energy
        if (player.energy < maxEntityEnergy){
            player.energy += .25
        }

        // Move entities
        for (const entity of entities){
            if (entity instanceof Farmer){
                entity.tickMove(map)
            }
        }

        printLocation({})
    }


    printLocation({})
}