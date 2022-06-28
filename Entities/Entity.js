import { Crop } from "../Crops/Crop.js"
import { BaseCrop } from "../Crops/BaseCrop.js"
import * as Vector from '../Map/Vectors.js'

export class Entity{
    direction;
    money;
    energy;
    location;
    map;

    move(directionKey){
        this.direction = directionKey
        const newLocation = this.interactingLocation()

        const canMoveThere = this.map.canMove(newLocation)

        if(canMoveThere){
            this.location = newLocation
        }

        return canMoveThere
    }

    tryDecrementEnergy(amount){
        if (this.energy > amount){
            this.energy -= amount
            return true
        }
        return false
    }

    increaseMoney(amount){
        return
    }

    harvest(){
        const targetLocation = this.interactingLocation()
        let target = this.map.get(targetLocation)

        if(target instanceof Crop){
            if(target.canHarvest() && this.energy >= target.harvestCost()){
                this.energy -= target.harvestCost()
                const moneyMade = target.harvest() // modifies target.
                this.money += moneyMade
                return moneyMade 
            }
        }

        return NaN // Didn't make any money.
    }

    grow(){
        if (this.energy < 1){
            return false
        }

        const targetLocation = this.interactingLocation()

        const target = this.map.get(targetLocation)

        if (target instanceof Crop){
            this.energy -= 1
            target.grow()
            return true
        } if (isFinite(target) && target != 9){
            this.energy -= 1
            this.map.set(targetLocation, new BaseCrop())
            return true
        }
        return false
    }

    interactingLocation(){
        return Vector.add(this.location, Vector.directions[this.direction])
    }
}