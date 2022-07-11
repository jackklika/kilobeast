import {
    StateTransition,
    EntityFilters,
    BehaviorFollowEntity,
    BehaviorLookAtEntity,
    BehaviorGetClosestEntity,
    NestedStateMachine, 
    BehaviorIdle,
    BehaviorFindBlock,
    BehaviorFindInteractPosition,
    BehaviorMoveTo}  from "mineflayer-statemachine"

class AttackBehavior {
    constructor(bot, targets) {
        this.stateName = 'attack';
        this.active = false;
        this.bot = bot;
        this.targets = targets;
    }

    onStateEntered = function () {
        this.bot.pvp.attack(this.targets.entity)
    };
}

class DepositFurnaceBehavior {
    constructor(bot, targets) {
        this.stateName = 'depositFurance';
        this.active = false;
        this.bot = bot;
        this.targets = targets;
    }

    onStateEntered = async function () {
        
        // Get block at state-stored position
        if (this.targets.position == undefined) {
            console.log("could not find block")
            return
        }
        var furnaceBlock = this.bot.blockAt(this.targets.position)

        // Open furnace
        /// Returns promise on a mineflayer.furnace
        var furnace = await this.bot.openFurnace(furnaceBlock)

        furnace.putInput(763, null, 8) // put pork in furance
        
    };
}

function createFollowPlayerState(bot)
{
    const targets = {};
    const playerFilter = EntityFilters().PlayersOnly;

    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    // Create our states
    const getClosestPlayer = new BehaviorGetClosestEntity(bot, targets, (entity) => {return entity.username === "chezhead"});
    const followPlayer = new BehaviorFollowEntity(bot, targets);
    const lookAtPlayer = new BehaviorLookAtEntity(bot, targets);

    const transitions = [


        // enterence transition
        // immediately transition to getClosestPlayer
        new StateTransition({
            parent: enter,
            child: getClosestPlayer,
            shouldTransition: () => true,
        }),

        // We want to start following the player immediately after finding them.
        // Since getClosestPlayer finishes instantly, shouldTransition() should always return true.
        new StateTransition({
            parent: getClosestPlayer,
            child: followPlayer,
            shouldTransition: () => targets.entity !== undefined,
        }),

        // If the distance to the player is less than four blocks, switch from the followPlayer
        // state to the lookAtPlayer state.
        new StateTransition({
            parent: followPlayer,
            child: lookAtPlayer,
            shouldTransition: () => followPlayer.distanceToTarget() < 4,
        }),

        // If the distance to the player is more than four blocks, switch from the lookAtPlayer
        // state to the followPlayer state.
        new StateTransition({
            parent: lookAtPlayer,
            child: followPlayer,
            shouldTransition: () => lookAtPlayer.distanceToTarget() >= 4,
        }),


    ];

    return new NestedStateMachine(transitions, enter, exit);
}

function createKillCook(bot, entityName)
{

    const targets = {};

    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    const killBehavior = createKill(bot, entityName)
    const cookBehavior = createCook(bot, null) //todo change to match collected item

    const transitions = [

        // Enter state
        new StateTransition({
            parent: enter,
            child: killBehavior,
            onTransition: () => {
                bot.chat("beginning killcook")
            },
            shouldTransition: () => true,
        }),

        // Transition when killing is over
        new StateTransition({
            parent: killBehavior,
            child: cookBehavior,
            shouldTransition: () => killBehavior.isFinished(),
        }),

        // Continue killing when cooking is over
        new StateTransition({
            parent: cookBehavior,
            child: killBehavior,
            shouldTransition: () => cookBehavior.isFinished(),
        }),

    ]

    return new NestedStateMachine(transitions, enter, exit);

}


function createKill(bot, entityName)
{
    const targets = {};

    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    // Create our states
    const getClosestEntity = new BehaviorGetClosestEntity(bot, targets, (entity) => {return entity.name === entityName});
    const attackEntity = new AttackBehavior(bot, targets)

    const transitions = [

        // Enter state
        new StateTransition({
            name: "Enter Kill",
            parent: enter,
            child: getClosestEntity,
            onTransition: () => {
                bot.chat(`transitioning to kill`)
            },
            shouldTransition: () => true,
        }),

        // If enough pork has been collected, exit
        new StateTransition({
            name: "Enough items",
            parent: getClosestEntity,
            child: exit,
            onTransition: () => {
                bot.chat(`leaving kill`)
            },
            shouldTransition: () => (bot.inventory.count(763) >= 64),
        }),

        // Once located an entity, attack it (includes pathfinding)
        new StateTransition({
            name: "Attack nearest entity",
            parent: getClosestEntity,
            child: attackEntity,
            shouldTransition: () => targets.entity !== undefined,
        }),

        // If the entity dies/disappears, find another
        new StateTransition({
            name: "Find new entity",
            parent: attackEntity,
            child: getClosestEntity,
            shouldTransition: () => ((targets.entity !== undefined)),
        }),


    ];

    return new NestedStateMachine(transitions, enter, exit);
}

function createCook(bot, itemCode)
{
    const targets = {};

    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    const getClosestBlock = new BehaviorFindBlock(bot, targets) // furance
    getClosestBlock.blocks = [61]
    getClosestBlock.maxDistance = 256

    const getInteractPosition = new BehaviorFindInteractPosition(bot, targets)
    const moveToPosition = new BehaviorMoveTo(bot, targets)
    const depositFurance = new DepositFurnaceBehavior(bot, targets)

    const transitions = [
        
        // todo make sure `shouldTransition` will be ok if it cannot find furnaces

        new StateTransition({
            name: "Enter Cook",
            parent: enter,
            child: getClosestBlock,
            onTransition: () => {
                bot.chat("transitioning to cook")
                console.log("enter", targets)
            },
            shouldTransition: () => true,
        }),

        new StateTransition({
            name: "Find furnace",
            parent: getClosestBlock,
            child: getInteractPosition,
            onTransition: () => {
                console.log("getclosestblock > getInteractPosition", targets)
            },
            shouldTransition: () => (targets.position !== undefined),
        }),

        new StateTransition({
            name: "Go to interact position for furnace",
            parent: getInteractPosition,
            child: moveToPosition,
            onTransition: () => {
                console.log("getInteractPosition > moveToPosition", targets, "111")
            },
            shouldTransition: () => (targets.position !== undefined),
        }),

        new StateTransition({
            name: "Deposit items in furance",
            parent: moveToPosition,
            child: depositFurance,
            shouldTransition: () => (moveToPosition.isFinished()),
        }),
    ];

    return new NestedStateMachine(transitions, enter, exit);
}


export { createFollowPlayerState, createKill, createCook, createKillCook};