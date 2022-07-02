import { BaseCrop } from '../Crops/BaseCrop.js'
import { SlowCashCrop } from '../Crops/SlowCashCrop.js'
import { SlowEnergyCrop } from '../Crops/SlowEnergyCrop.js'
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

    getCurrentCropType(){
        switch(Math.floor(Math.random() * 3)){
            case 0:
                return BaseCrop
            case 1:
                return SlowCashCrop
            case 2:
                return SlowEnergyCrop
        }
    }
}