import { Crop } from "../Crops/Crop.js";
import { Entity } from "./Entity.js";
import * as Vector from '../Map/Vectors.js'


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

export class Farmer extends Entity{
    house;
    houseLocation;
    squareMoveNextGoal;
    playerOpinion;

    constructor({farmerHouse, myLocation, houseLocation, map}){
        super()
        this.house = farmerHouse
        this.location = myLocation
        this.houseLocation = houseLocation
        this.direction = "w"
        this.money = 0
        this.energy = 40
        this.map = map

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
        let target = this.map.get(targetLocation)

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
        let target = this.map.get(targetLocation)

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
        let target = this.map.get(targetLocation)
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
            const intermediatePoint = Vector.add(this.location, directions[secondMove])
            const finalPoint = Vector.add(intermediatePoint, headingVector)
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