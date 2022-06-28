import { BaseCrop } from "../Crops/BaseCrop.js";
import { FarmerHouse } from "./FarmerHouse.js";
import { MapElement } from "./MapElement.js";

const blockingMovementTiles = new Set([
    9,
])

const imageFor = {
    0: "_",
    // 1: Crop image
    9: "▓",
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

export class Map {
    array;
    constructor(jsonObject){
        this.array = jsonObject
        for (const row of this.array){
            for(let i = 0; i < row.length; i ++){
                for(const key in row[i]){
                    if (key in loadableClasses){
                        row[i] = new (loadableClasses[key])(row[i][key])
                    }
                }
            }
        }
    }

    canMove({x, y}){
        return 0 <= y && y < this.array.length 
        && 0 <= x && x < this.array[y].length 
        && ! blockingMovementTiles.has(this.array[y][x])
        && ( 
            this.array[y][x] in imageFor 
            || ( 
                this.array[y][x] instanceof MapElement 
                && !this.array[y][x].blocksMovement()
            )
        );
    }

    get({x, y}){
        return this.array[y]?.[x]
    }

    set({x, y}, value){
        this.array[y][x] = value
    }

    forEachPoint(callback){
        for (let j = 0; j < this.array.length; j ++){
            for(let i = 0; i < this.array[j].length; i++){
                const target = this.array[j][i]
                callback({x: i, y: j}, target)
            }
        }
    }

    findImageFor(location){
        const target = this.array[location.y]?.[location.x]
        if (target in imageFor){
            return imageFor[target]
        }

        if (target instanceof MapElement){
            return target.image()
        }

        return "0"
    }
}