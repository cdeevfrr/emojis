import {Crop, weedImage} from "./Crop.js"

const cropImages = {
    1: ".",
    2: ",",
    3: ":",
    4: "e",
    5: "l",
    6: ")",
    7: "¡",
    8: "E",
    9: "E",
    10: "E",
}

export class SlowEnergyCrop extends Crop{
    constructor({stage, maxStage} = {stage: 1, maxStage: 13}){
        super()
        this.stage = stage || 1
        this.maxStage = maxStage || 13
        this.growchance = .01
    }

    image(){
        if (this.stage in cropImages){
            return cropImages[this.stage]
        }
        return weedImage
    }

    blocksMovement(){
        return this.unknownStage() 
        || 7 <= this.stage && this.stage <=8
    }

    harvestCost(){
        if (this.stage == 7){
            return 2
        }
        if (this.stage == 4){
            return -5
        }
        if (this.stage == 8){
            return -10
        }
        if (this.stage == 9){
            return -20
        }
        if (this.stage == 10){
            return -8
        }
    }
}