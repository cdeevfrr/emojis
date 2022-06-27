

export function add(v1, v2){
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y
    }
}

export function negate(v1){
    return {
        x: -v1.x,
        y: -v1.y,
    }
}

export const directions = {
    a: {x: -1, y: 0},
    s: {x: 0,  y: 1},
    d: {x: 1,  y: 0},
    w: {x: 0,  y: -1},
}