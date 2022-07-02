
import {Crop} from "./Crop.js"

export class BaseCrop extends Crop{
    constructor({stage, maxStage} = {stage: 1, maxStage: 8}){
        super()
        this.stage = stage || 1
        this.maxStage = maxStage || 8
        this.growchance = .08
    }

    moneyGain(){
        if(this.stage == 7){
            return 8
        }
        return super.moneyGain() 
    }

    harvestCost(){
        if(this.stage == 8){
            return -.5 // If fully grown, you get .5 energy back.
        }
        return super.harvestCost()
    }
}
