import { MapElement } from './../Map/MapElement.js'
import { intervalsNeededBeforeGrowth } from './GrowthIntervalCalculator.js';

const cropImages = {
    1: ".",
    2: ",",
    3: "+",
    4: "i",
    5: "l",
    6: ")",
    7: "|",
    8: "T",
}

export const weedImage = "#"

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
        return weedImage
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
        if (this.canAutoGrow()){
            // Eventually, a crop could be saved or the timeout here stopped.
            // So the crop should eventually save a state like "want to grow after" instead.
            setTimeout(
                () => {if (this.canAutoGrow()) {this.grow()}}, 
                intervalsNeededBeforeGrowth(this.growchance, 100) * 1000 
            )
        }
    }

    harvest(){
        const moneyGain = this.moneyGain()
        this.stage = this.newStageFromHarvest()
        return moneyGain
    }
}
