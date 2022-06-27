
/** This "abstract" class is mostly just a template
 * to show you how map elements can be built.
 * And it's used to check if something is a MapElement
 * or is just a number in the runtime map array.
 */
export class MapElement{
    // mapData;

    constructor(/*mapData*/){}
    toJSON(){
        return {[this.constructor.name]: {/*mapData*/}}
    }

    image(){
        return "?"
    }

    blocksMovement(){
        return true
    }
}