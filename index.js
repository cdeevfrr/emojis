import {MapElement} from './Map/MapElement.js'
import {BaseCrop} from './Crops/BaseCrop.js'


const maxEntityEnergy = 100

const imageFor = {
    0: "_",
    // 1: Crop image
    9: "▓",
}

function addVector(v1, v2){
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y
    }
}

/**
 * The farmer house is a tile that stores all the info about the farmer
 * The (a?) farmer entity just moves around and takes actions based on their associated farmerHouse's data.
 * Farmer entities spawn at the Farmer house.
 */
class FarmerHouse extends MapElement{
    playerOpinion;

    constructor({playerOpinion}){
        super()
        this.playerOpinion = playerOpinion || -5
    }

    toJSON(){
        return {
            [this.constructor.name]: {
                playerOpinion: this.playerOpinion
            }
        }
    }

    image(){
        return "🏠"
    }

    blocksMovement(){
        return true
    }
}

/**
 * Each loadable class should have a toJson that returns 
 * [this.constructor.name]: {the stuff in the class}
 * and a constructor that takes in 
 * {the stuff in the class}
 */ 
const loadableClasses = {
    "BaseCrop": BaseCrop,
    "FarmerHouse": FarmerHouse,
}

function parseMap(text){
    // the second arg will read any crops as actual crops.
    const newMap = JSON.parse(text)
    for (const row of newMap){
        for(let i = 0; i < row.length; i ++){
            for(const key in row[i]){
                if (key in loadableClasses){
                    row[i] = new (loadableClasses[key])(row[i][key])
                }
            }
        }
    }
    return newMap
}

const directions = {
    a: {x: -1, y: 0},
    s: {x: 0,  y: 1},
    d: {x: 1,  y: 0},
    w: {x: 0,  y: -1},
}

const playerIcon = {
    "d": "😗",
    "s": "🙃",
    "a": "🧐",
    "w": "🙂",
}

const enemyIcon = {
    "d": "👺",
    "s": "😡",
    "a": "🤨",
    "w": "😤",
}
const relationshipIcon = {
    "d": "😘",
    "s": "🙃",
    "a": "😏",
    "w": "🥰",
}

class Entity{
    direction;
    money;
    energy;
    location;

    move(directionKey){
        this.direction = directionKey
        const newLocation = this.interactingLocation()

        const canMoveThere = this.canMove(newLocation.x, newLocation.y)

        if(canMoveThere){
            this.location.x = newLocation.x
            this.location.y = newLocation.y
        }

        return canMoveThere
    }

    canMove(x, y){
        return 0 <= y && y < map.length 
        && 0 <= x && x < map[y].length 
        && ! blockingMovementTiles.has(map[y][x])
        && ( map[y][x] in imageFor || 
          (map[y][x] instanceof MapElement && !map[y][x].blocksMovement())
        );
    }

    tryDecrementEnergy(amount){
        if (this.energy > amount){
            this.energy -= amount
            return true
        }
        return false
    }

    increaseMoney(amount){
        return
    }

    harvest(){
        const targetLocation = this.interactingLocation()
        let target = map[targetLocation.y]?.[targetLocation.x]

        if(target instanceof Crop){
            if(target.canHarvest() && this.energy >= target.harvestCost()){
                this.energy -= target.harvestCost()
                const moneyMade = target.harvest() // modifies target.
                this.money += moneyMade
                return moneyMade 
            }
        }

        return NaN // Didn't make any money.
    }

    grow(){
        const targetLocation = this.interactingLocation()

        const target = map[targetLocation.y]?.[targetLocation.x]

        if (this.energy < 1){
            return false
        }
        this.energy -= 1

        if (target instanceof Crop){
            target.grow()
            return true
        } if (isFinite(target) && target != 9){
            map[targetLocation.y][targetLocation.x] = new BaseCrop()
            return true
        }
        return false
    }

    interactingLocation(){
        return addVector(this.location, directions[this.direction])
    }
}

class Player extends Entity{
    constructor({location, direction, money, energy}){
        super()
        this.location = location
        this.direction = direction
        this.money = money
        this.energy = energy
    }

    image(){
        return playerIcon[this.direction]
    }
}

class Farmer extends Entity{
    house;
    houseLocation;
    squareMoveNextGoal;
    playerOpinion;

    constructor(farmerHouse, myLocation, houseLocation){
        super()
        this.house = farmerHouse
        this.location = myLocation
        this.houseLocation = houseLocation
        this.direction = "w"
        this.money = 0
        this.energy = 40

        /// Small state so that farmers can do 
        // different things based on last ticks
        // behavior.
        this.plannedMoves = []
        this.grewAgoTurns = 0
        this.squareMoveNextGoal = {x: 2, y: 2}
    }

    tickMove(){
        this.grewAgoTurns += 1
        if (this.wantsToHarvest()){
            this.harvest()
            return
        }
        if(this.plannedMoves.length > 0){
            this.tryMove(this.plannedMoves.pop())
            return
        } 
        if (this.wantsToGrow()){
            this.grow()
            this.grewAgoTurns = 0
            return
        } 
        this.squareMove()
    }

    wantsToHarvest(){
        const targetLocation = this.interactingLocation()
        let target = map[targetLocation.y]?.[targetLocation.x]

        if(target instanceof Crop){
            // If the target gives energy
            if (target.harvestCost() < 0){
                return true
            }
        }
    }

    wantsToGrow(){
        if (this.grewAgoTurns < 2){
            return false
        }
        if (this.energy < 10){
            return false
        }

        const targetLocation = this.interactingLocation()
        let target = map[targetLocation.y]?.[targetLocation.x]

        if(target instanceof Crop){
            if (target.canAutoGrow()){
                return false
            }
        }
        return true
    }

    changeHeadingToNextSquareMoveGoal(){
        if (this.squareMoveNextGoal.x > 0 ^ this.squareMoveNextGoal.y > 0){
            this.squareMoveNextGoal.y = - this.squareMoveNextGoal.y
        } else {
            this.squareMoveNextGoal.x = - this.squareMoveNextGoal.x
        }
    }

    /**
     * Move around the house clockwise.
     * If you are obstructed & CAN harvest, do so.
     * If you are obstructed & CANT harvest, try to move in the other direction.
     */ 
    squareMove(){
        const currentLocation = this.locationRelativeToHouse()
        const xAdjust = currentLocation.x - this.squareMoveNextGoal.x
        const yAdjust = currentLocation.y - this.squareMoveNextGoal.y
        if (xAdjust > 0){
            // Move left
            this.tryMove("a")
        }
        else if (xAdjust < 0){
            // move right
            this.tryMove("d")
        }
        else {
            if (yAdjust > 0){
                // move up
                this.tryMove("w")
            }
            else if (yAdjust < 0){
                // move down
                this.tryMove("s")
            }
            else {
                this.changeHeadingToNextSquareMoveGoal()
            }
        }
    }

    /**
     * Try to move in that direction.
     * If blocked, check if you can harvest. If so do so and stop there.
     * If blocked and can't harvest, check if you can go around in either direction.
     * If so do so and stop there.
     * 
     * Finally, return false if none of those things worked.
     */
    tryMove(direction){
        if (direction == "wait"){
            return true
        }
        if (this.move(direction)){ // move(direction) also sets this entity's direction heading.
            return true
        }
        const targetLocation = this.interactingLocation()
        let target = map[targetLocation.y]?.[targetLocation.x]
        if (target instanceof Crop && target.harvestCost() > 0 && target.blocksMovement() && !this.currentlyWaiting){
            for (const i of [1,2,3,4,5]){
                this.plannedMoves.push("wait")
            }
            this.currentlyWaiting = true
            return true
        }
        this.currentlyWaiting = false
        if (! isNaN(this.harvest())){
            return true
        }
        
        const headingVector = directions[direction] // vector
        const secondMoves = headingVector.x == 0? ["d", "a"] : ["s", "w"]
        for (const secondMove of secondMoves){
            const intermediatePoint = addVector(this.location, directions[secondMove])
            const finalPoint = addVector(intermediatePoint, headingVector)
            if ( 
                (this.canMove(intermediatePoint.x, intermediatePoint.y))
                && this.canMove(finalPoint.x, finalPoint.y)
            ){
                this.move(secondMove)
                this.plannedMoves.push(direction)
            }
            return true
        }
        return false
    }

    locationRelativeToHouse(){
        return {
            x: this.location.x - this.houseLocation.x, 
            y: this.location.y - this.houseLocation.y, 
        }
    }

    image(){
        if (this.house.playerOpinion > 100){
            return relationshipIcon[this.direction]
        }
        if (this.house.playerOpinion < -5){
            return enemyIcon[this.direction]
        }
        return playerIcon[this.direction]
    }

    noticePlayerHarvest(player){
        this.house.playerOpinion -= 2.5

        console.log(`Noticing harvest when house is ${JSON.stringify(this.house)}`)
        console.log(`Noticing harvest when opinion is ${this.house.playerOpinion}`)
        if (this.house.playerOpinion < -30){
            player.money -= 10
            return "Get your butt out of here you varmit! Quit stealin my hard earned work! You're paying me double for that."
        }
        if (this.house.playerOpinion < -15){
            return "I told you, those are MY crops!"
        }

        if (this.house.playerOpinion < -5){
            return "Hey!! Those are my crops! Go grow your own."
        }

        if (this.house.playerOpinion < 0){
            return "humph."
        }

        if (this.house.playerOpinion < 10){
            return "I'll let you get away with it this time you rascal"
        }

        if (this.house.playerOpinion < 20){
            return "Since you helped grow it, you can help enjoy it"
        }

        if (this.house.playerOpinion < 50){
            return "You've been mighty kind to me and I appreciate it. Hope that's yummy!"
        }

        if (this.house.playerOpinion < 100){
            return "That T looks almost as sweet as you!"
        }

        if (this.house.playerOpinion < 150){
            return "You're such a sweetheart."
        }

        return "Come back soon, ok cutie?"

    }

    noticePlayerGrow(player){

        this.house.playerOpinion += 1

        if (-10 < this.house.playerOpinion < -5){
            return "That's right! Put back what you stole."
        }
        if (this.house.playerOpinion < 0){
            return "What, you tryin to get on my good side or somethin?"
        }
        if (this.house.playerOpinion < 7){
            return "humph. Thanks."
        }
        if (this.house.playerOpinion < 15){
            return "Alright, you aint so bad"
        }
        if (this.house.playerOpinion < 25){
            return "'preciate that"
        }
        if (this.house.playerOpinion < 75){
            return "Thanks for all the work you do around here!"
        }
        if (this.house.playerOpinion < 125){
            return "You're being awful nice for someone who's just being friendly"
        }
        if (this.house.playerOpinion < 175){
            return "You're gonna make me blush!"
        }
        return "Thanks a bushel sweetheart"
    }

}

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

const mapString = `[
    [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],
    [
        0,0,0,{"BaseCrop":{"stage":1}},0,0,0,0,{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],
    [
        0,0,{"BaseCrop":{"stage":1}},0,0,0,{"BaseCrop":{"stage":5}},0,{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":8}},0,   
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

    ],
    [
        0,0,0,0,{"BaseCrop":{"stage":2}},0,{"BaseCrop":{"stage":5}},0,{"BaseCrop":{"stage":2}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":8}},0,   
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,{"FarmerHouse": {"playerOpinion": -5}},0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],
    [
        0,0,0,0,0,0,{"BaseCrop":{"stage":5}},0,{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":8}},0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],
    [
        0,{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":8}},0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],
    [
        0,{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},{"BaseCrop":{"stage":1}},0,0,0,0,0,0,{"BaseCrop":{"stage":8}},0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        -1,-1,-1,-1,-1,-1,-1,-1,
        {"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},{"BaseCrop":{"stage":9}},
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ]
]`

const map = parseMap(mapString)

const entities = []
for (let j = 0; j < map.length; j ++){
    for (let i = 0; i < map[j].length; i ++){
        if (map[j][i] instanceof FarmerHouse){
            entities.push(new Farmer(map[j][i], {x: i + 2, y: j + 1}, {x: i, y: j}))
        }
    }
}

const defaultWidth = 11
const defaultHeight= 7

const blockingMovementTiles = new Set([
    9,
])

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

    const player = new Player({
        location: {x: 3, y: 3},
        direction: "d",
        money: 0,
        energy: 40,
    })

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
                row.push(findImageFor(map[j]?.[i]))
                for (const entity of entities){
                    if(entity.location.x == i && entity.location.y == j){
                        row[row.length - 1] = entity.image()
                    }
                }
            }
            toPrint.push(row)
        }
        // Show the player in the center instead.
        toPrint[Math.floor(height / 2)][Math.floor(width / 2)] = playerIcon[player.direction]

        mainScreen.value = toPrint.map(row => row.join("")).join("\n")

        playerStats.innerText = `Money: \$${player.money}  Energy: ${Math.floor(player.energy)}`
    }

    function findImageFor(mapElement){
        if (mapElement in imageFor){
            return imageFor[mapElement]
        }

        if (mapElement instanceof MapElement){
            return mapElement.image()
        }

        return "0"
    }



    /**
     * @param {KeyboardEvent} event 
     */ 
    function handleKeypress(event){
        console.log(`"Got event ${event.key}`)

        if (event.key in directions){
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
        for (let j = 0; j < map.length; j ++){
            for (let i = 0; i < map[j].length; i ++){
                const target = map[j][i]
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
                        map[j][i] = 0
                    }
                }
            }
        }

        // Gain energy
        if (player.energy < maxEntityEnergy){
            player.energy += .25
        }

        // Move entities
        for (const entity of entities){
            if (entity instanceof Farmer){
                entity.tickMove()
            }
        }

        printLocation({})
    }


    printLocation({})
}