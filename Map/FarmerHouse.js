import { MapElement } from "./MapElement.js";
/**
 * The farmer house is a tile that stores all the info about the farmer
 * The (a?) farmer entity just moves around and takes actions based on their associated farmerHouse's data.
 * Farmer entities spawn at the Farmer house.
 */
export class FarmerHouse extends MapElement{
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