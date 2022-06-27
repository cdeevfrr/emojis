import {Entity} from './Entity.js'

const playerIcon = {
    "d": "😗",
    "s": "🙃",
    "a": "🧐",
    "w": "🙂",
}

export class Player extends Entity{
    constructor({location, direction, money, energy, map}){
        super()
        this.location = location
        this.direction = direction
        this.money = money
        this.energy = energy
        this.map = map
    }

    image(){
        return playerIcon[this.direction]
    }
}