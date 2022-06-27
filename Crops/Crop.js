import {MapElement} from './../Map/MapElement.js'

export const cropImages = {
    1: ".",
    2: ",",
    3: "+",
    4: "i",
    5: "l",
    6: ")",
    7: "|",
    8: "T",
}

export class Crop extends MapElement{
    stage;
    maxStage;

    toJSON(){
        return {
            [this.constructor.name]: {
                stage: this.stage, 
            }
        }
    }


    image(){
        if (this.stage in cropImages){
            return cropImages[this.stage]
        }
        return "#"
    }

    blocksMovement(){
        return this.unknownStage() || 7 <= this.stage && this.stage <=8
    }

    unknownStage(){
        return this.stage < 0 || this.stage > this.maxStage
    }

    harvestCost(){
        // Negative stages cannot be harvested.
        if (this.stage > this.maxStage){
            return 2
        }
        return 1
    }

    canHarvest(){
        // negative stages cannot be harvested.
        // Unknown stages greater than maxStage are weeds and CAN be harvested.
        return this.stage > 4
    }

    moneyGain(){
        if(this.unknownStage()){
            return 0
        }
        return 4
    }

    newStageFromHarvest(){
        if(this.unknownStage()){
            return -1
        }
        return this.stage - 4
    }

    canAutoGrow(){
        return this.stage >= 3 && this.stage < this.maxStage
    }

    grow(){
        this.stage += 1
    }

    harvest(){
        const moneyGain = this.moneyGain()
        this.stage = this.newStageFromHarvest()
        return moneyGain
    }
}
