"use strict";

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
    typeof config1.command === "string" &&
    typeof config2.command === "string" &&
    typeof times === "number"
)) {
    console.error("Some config attributes are wrong.");
    process.exit(1);
}

config1.name = "first";
config2.name = "second";

let results = [];

let sendCommand = async (engine, command) => {
    let {id, content, error} = await engine.sendCommand(command);
    if (error) throw new Error("Engine threw an error!");
    return content;
};

let playGame = async swaps => {
    let controller1 = new Controller(config1.command, config1.args, config1.spawnOptions);
    let controller2 = new Controller(config2.command, config2.args, config2.spawnOptions);

    console.log("Starting first engine...");
    controller1.start();
    await sendCommand(controller1, {name: "protocol_version"}); // just to trigger process init
    if (config1.initialGtpCommands !== undefined) {
        for (let i = 0; i < config1.initialGtpCommands.length; i++) {
            await sendCommand(controller1, config1.initialGtpCommands[i]);
        }
    }
    console.log("Starting second engine...");
    controller2.start();
    await sendCommand(controller2, {name: "protocol_version"}); // just to trigger process init
    if (config2.initialGtpCommands !== undefined) {
        for (let i = 0; i < config2.initialGtpCommands.length; i++) {
            await sendCommand(controller2, config2.initialGtpCommands[i]);
        }
    }

    let [blackController, whiteController] = swaps ? [controller2, controller1] : [controller1, controller2];

    let [blackConfig, whiteConfig] = swaps ? [config2, config1] : [config1, config2];

    let moveIndex = 0;
    let controller = null;
    let color = null;
    let move = null;
    let moves = [];
    let gtpMoves = [];
    let winnerColor = null;

    while (true) {
        controller = moveIndex % 2 === 0 ? blackController : whiteController;
        if (move !== null) {
            await sendCommand(controller, {name: "play", args: [color, move]});
        }
        color = moveIndex % 2 === 0 ? "b" : "w";
        move = await sendCommand(controller, {name: "genmove", args: [color]});
        console.log(moveIndex, color, move);
        moves.push(move);
        gtpMoves.push(`play ${color} ${move}`);
        if (move === "resign") {
            winnerColor = moveIndex % 2 === 0 ? "w" : "b";
            break;
        }
        if (move === "pass" && moves.length >= 2 && moves[moves.length - 2] === "pass") {
            winnerColor = (await sendCommand(controller, {name: "final_score"})).startsWith("B+") ? "b" : "w";
            break;
        }
        moveIndex++;
    }

    let winnerConfig = winnerColor === "b" ? blackConfig : whiteConfig;

    results.push({
        winnerColor: winnerColor,
        winnerConfig: winnerConfig
    });

    gtpMoves.forEach(m => console.log(m));
    console.log(`Winner: ${winnerConfig.name} ${winnerColor}`);

    await controller1.stop();
    await controller2.stop();
};

(async () => {
    for (let i = 0; i < times; i++) {
        await playGame(i % 2 === 1);
        console.log(`Game ${i} ended.`);
    }
    console.log("============================================================");
    results.forEach((m, index) => console.log(`${index} Winner: ${m.winnerConfig.name} ${m.winnerColor}`));
})();
