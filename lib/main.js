"use strict";

const {Controller, Command, Response} = require("@sabaki/gtp");
const got = require("got");
const fs = require("fs");
const crypto = require("crypto");

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
let report = config.report;

if (!(
    typeof config1.command === "string" &&
    typeof config2.command === "string" &&
    typeof times === "number" && times >= 0 && times <= 10000 &&
    (report === undefined || (typeof report.minutes === "number" && report.minutes >= 1))
)) {
    console.error("Some config attributes are wrong.");
    process.exit(1);
}

config1.name = "first";
config2.name = "second";

let testerId = crypto.randomBytes(4).toString("hex");

let results = [];

let sendCommand = async (engine, command) => {
    let {id, content, error} = await engine.sendCommand(command);
    if (error) throw new Error("Engine threw an error!");
    return content;
};

let convertMoveToSgf = move => {
    if (move === "pass") {
        return "";
    }
    else {
        let part1 = move[0];
        let part2 = move.substr(1);
        let r1 = part1;
        if (r1 >= "j") {
            r1 = String.fromCharCode(r1.charCodeAt(0) - 1);
        }
        let r2 = String.fromCharCode(116 - parseInt(part2));
        let r = r1 + r2;
        return r;
    }
};

let playGame = async swaps => {
    let controller1 = new Controller(config1.command, config1.args, config1.spawnOptions);
    let controller2 = new Controller(config2.command, config2.args, config2.spawnOptions);

    let [blackController, whiteController] = swaps ? [controller2, controller1] : [controller1, controller2];

    let [blackConfig, whiteConfig] = swaps ? [config2, config1] : [config1, config2];

    console.log(`Starting black (${blackConfig.name}) engine...`);
    blackController.start();
    await sendCommand(blackController, {name: "protocol_version"}); // just to trigger process init
    if (blackConfig.initialGtpCommands !== undefined) {
        for (let i = 0; i < blackConfig.initialGtpCommands.length; i++) {
            await sendCommand(blackController, blackConfig.initialGtpCommands[i]);
        }
    }
    console.log(`Starting white (${whiteConfig.name}) engine...`);
    whiteController.start();
    await sendCommand(whiteController, {name: "protocol_version"}); // just to trigger process init
    if (whiteConfig.initialGtpCommands !== undefined) {
        for (let i = 0; i < whiteConfig.initialGtpCommands.length; i++) {
            await sendCommand(whiteController, whiteConfig.initialGtpCommands[i]);
        }
    }

    let moveIndex = 0;
    let controller = null;
    let color = null;
    let move = null;
    let moves = [];
    let sgfMoves = [];
    let winnerColor = null;
    let sgfResult = null;

    while (true) {
        controller = moveIndex % 2 === 0 ? blackController : whiteController;
        if (move !== null) {
            await sendCommand(controller, {name: "play", args: [color, move]});
        }
        color = moveIndex % 2 === 0 ? "b" : "w";
        move = await sendCommand(controller, {name: "genmove", args: [color]});
        move = move.toLowerCase();
        console.log(moveIndex, color, move);
        if (move === "resign") {
            winnerColor = moveIndex % 2 === 0 ? "w" : "b";
            sgfResult = winnerColor.toUpperCase() + "+R";
            break;
        }
        moves.push(move);
        sgfMoves.push(";" + color.toUpperCase() + "[" + convertMoveToSgf(move) + "]");
        if (move === "pass" && moves.length >= 2 && moves[moves.length - 2] === "pass") {
            sgfResult = await sendCommand(controller, {name: "final_score"});
            winnerColor = sgfResult.startsWith("B+") ? "b" : "w";
            break;
        }
        moveIndex++;
    }

    let winnerConfig = winnerColor === "b" ? blackConfig : whiteConfig;

    results.push({
        winnerColor: winnerColor,
        winnerConfig: winnerConfig
    });

    let sgf =
        `(;GM[1]FF[4]CA[UTF-8]SZ[19]PB[${blackConfig.name}]PW[${whiteConfig.name}]RE[${sgfResult}]` +
        sgfMoves.join("") + ")";
    console.log(sgf);
    console.log(`Winner: ${winnerConfig.name} ${winnerColor}`);

    await controller1.stop();
    await controller2.stop();
};

let getFirstWinCount = () => results.filter(m => m.winnerConfig.name === "first").length;

let printFirstWinRate = () => {
    let firstWinCount = getFirstWinCount();
    let winRate = (firstWinCount / results.length).toFixed(4);
    console.log(`First wins ${firstWinCount} out of ${results.length}. Win rate: ${winRate}`);
};

if (report !== undefined) {
    setInterval(() => {
        got(
            report.uriPrefix +
            `?testerId=${testerId}&firstWins=${getFirstWinCount()}&total=${results.length}`
        ).catch(() => {});
    }, report.minutes * 60 * 1000);
}

(async () => {
    for (let i = 0; i < times; i++) {
        await playGame(i % 2 === 1);
        console.log(`Game ${i} ended.`);
        printFirstWinRate();
    }
    console.log("============================================================");
    results.forEach((m, index) => console.log(`${index} Winner: ${m.winnerConfig.name} ${m.winnerColor}`));
    printFirstWinRate();
})();
