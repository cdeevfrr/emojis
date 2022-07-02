export function intervalsNeededBeforeGrowth(growthChance, maxTimeToWait){
    let result = 1
    while (result < maxTimeToWait){
        if (Math.random() < growthChance){
            return result
        }
        result += 1
    }
    return result
}

