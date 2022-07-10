import {
    StateTransition,
    EntityFilters,
    BehaviorFollowEntity,
    BehaviorLookAtEntity,
    BehaviorGetClosestEntity,
    NestedStateMachine, 
    BehaviorIdle,
    BehaviorFindBlock,
    BehaviorFindInteractPosition}  from "mineflayer-statemachine"

// Build the state
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
            parent: enter,
            child: getClosestEntity,
            shouldTransition: () => true,
        }),

        // Once located an entity, attack it (includes pathfinding)
        new StateTransition({
            parent: getClosestEntity,
            child: attackEntity,
            shouldTransition: () => targets.entity !== undefined,
        }),

        // If the entity dies/disappears, find another
        new StateTransition({
            parent: attackEntity,
            child: getClosestEntity,
            shouldTransition: () => ((targets.entity !== undefined)),
        }),

        // If enough pork has been collected, exit
        new StateTransition({
            parent: getClosestEntity,
            child: exit,
            shouldTransition: () => (bot.inventory.count(763) >= 64),
        }),

    ];

    return new NestedStateMachine(transitions, enter, exit);
}

function createCook(bot, itemCode)
{
    const targets = {};

    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    // Create our states
    const getClosestBlock = new BehaviorFindBlock(248) // furance
    const attackEntity = new AttackBehavior(bot, targets)

    const transitions = [

        // Enter state
        new StateTransition({
            parent: enter,
            child: getClosestBlock,
            shouldTransition: () => true,
        }),

        // Go to block
        new StateTransition({
            parent: getClosestBlock,
            child: getInteractPosition,
            shouldTransition: () => true,
        }),

        // If the entity dies/disappears, find another
        new StateTransition({
            parent: getInteractPosition,
            child: getClosestEntity,
            shouldTransition: () => ((targets.entity !== undefined)),
        }),

        // If enough pork has been collected, exit
        new StateTransition({
            parent: getClosestEntity,
            child: exit,
            shouldTransition: () => (bot.inventory.count(763) >= 64),
        }),

    ];

    return new NestedStateMachine(transitions, enter, exit);
}


export { createFollowPlayerState, createKill};