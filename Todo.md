# TODO

# Farmer
### NPC
- Create farmer entity
    - Make map bigger
    - Make house tile
    - Put farmer at the new location
- Make farmer move
    - Generalize movement
        - class for entities/moveable things.
        - Put functionality for 'move' into the class.
    - Give farmer a "nextMove" function, call it ontick

# Make crop types
- Make a new crop type
    - Cash crop vs energy crop?
    - Quick grow crop vs slow crop?
    - Some should be hard to find? Hard to grow?
    - Might need an inventory.

# Inventory


# Dialogue
- Make the farmer head towards you
- Make a dialogue behavior
- Hello world dialogue

# Seed tooltops
- Some way to see info about a crop

# Gifts
- Add interaction with farmer house
- Can place things from inventory to house


# Abstract the map
- Arbitrary size map?
- Update tick logic to only be for loaded squares of the map
