import {Crop, weedImage} from "./Crop.js"

const cropImages = {
    1: ".",
    2: ",",
    3: "+",
    4: ":",
    4: "i",
    5: "l",
    6: ")",
    7: "¡",
    8: "?",
    9: "$",
    10: "$",
    11: "$",
    12: "$",
    13: "$",
}
export class SlowCashCrop extends Crop{
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
        || this.stage == 12
    }

    moneyGain(){
        if(this.stage == 9){
            return 100
        }
        if (this.stage == 10){
            return 200
        }
        if (this.stage == 11){
            return 200
        }
        if (this.stage == 12){
            return 1000
        }
        if(this.stage == 13){
            return 50
        }
        return super.moneyGain() 
    }

    harvestCost(){
        if (this.stage > 7){
            if (this.stage == 11){
                return -3 // Just before optimal harvesting time, you can harvest it for a tiny bit of energy.
            }
            return 10
        }
        return 1
    }

    newStageFromHarvest(){
        if(this.unknownStage()){
            return -1
        }
        return 1
    }
}
