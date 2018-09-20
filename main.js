const {Controller, Command, Response} = require("@sabaki/gtp");
const fs = require("fs");

let args = process.argv.slice();
args.splice(0, 2); // strip "node" and the name of this file

let config = null;

try {
    if (args.length === 0) throw new Error();
    config = JSON.parse(fs.readFileSync(args[0], "utf8"));
}
catch (ex) {
    console.error("Config file error.");
    process.exit(1);
}

let config1 = config.first;
let config2 = config.second;
let times = config.times;

if (!(
    typeof config1.name === "string" && typeof config1.command === "string" &&
    typeof config2.name === "string" && typeof config2.command === "string" &&
    typeof times === "number"
)) {
    console.error("Some config attributes are wrong.");
    process.exit(1);
}

let results = [];

let sendCommand = async (engine, command) => {
    let {id, content, error} = await engine.sendCommand(command);
    if (error) throw new Error("Engine threw an error!");
    return content;
};

let playGame = async swaps => {
    let controller1 = new Controller(config1.command, config1.args, config1.spawnOptions);
    let controller2 = new Controller(config2.command, config2.args, config2.spawnOptions);
    if (swaps) {
        [controller1, controller2] = [controller2, controller1];
    }

    console.log("Starting black engine...");
    controller1.start();
    await sendCommand(controller1, {name: "komi", args: ["7.5"]});
    console.log("Starting white engine...");
    controller2.start();
    await sendCommand(controller2, {name: "komi", args: ["7.5"]});

    let moveIndex = 0;
    let engine = null;
    let color = null;
    let move = null;
    let moves = [];
    let gtpMoves = [];
    let winnerColor = null;

    while (true) {
        engine = moveIndex % 2 === 0 ? controller1 : controller2;
        if (move !== null) {
            await sendCommand(engine, {name: "play", args: [color, move]});
        }
        color = moveIndex % 2 === 0 ? "b" : "w";
        move = await sendCommand(engine, {name: "genmove", args: [color]});
        console.log(moveIndex, color, move);
        moves.push(move);
        gtpMoves.push(`play ${color} ${move}`);
        if (move === "resign") {
            winnerColor = moveIndex % 2 === 0 ? "w" : "b";
            break;
        }
        if (move === "pass" && moves.length >= 2 && moves[moves.length - 2] === "pass") {
            winnerColor = (await sendCommand(engine, {name: "final_score"})).startsWith("B+") ? "b" : "w";
            break;
        }
        moveIndex++;
    }

    gtpMoves.forEach(m => console.log(m));
    console.log(`Winner: ${winnerColor}`);

    await controller1.stop();
    await controller2.stop();

    results.push({
        winnerColor: winnerColor,
        winnerConfig: (winnerColor === "b" ? (swaps ? config2 : config1) : (swaps ? config1 : config2))
    });
};

(async () => {
    for (let i = 0; i < times; i++) {
        await playGame(i % 2 === 1);
        console.log(`Game ${i} ended.`);
    }
    results.forEach((m, index) => console.log(`${index} Winner: ${m.winnerConfig.name} ${m.winnerColor}`));
})();
