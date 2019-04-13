# Introduction

This program can compare the strength of two Go (围棋, 囲碁, 바둑) engines that are GTP-compatible by running a batch of games between them. It can also compare the strength under different options of the same engine.

# Requirements

- Node.js 8 or higher installed.

# Usage

Add a file `config.json`, then run:

```bash
npx go-engine-tester config.json
```

`config.json` example:

```json
{
    "first": {
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
        ]
    },
    "second": {
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
        ]
    },
    "times": 30
}
```

This will play 30 games between the two engines, alternating black and white for each game, and finally print the result. Note that the path in `command` is relative to the working directory not the config file. Also note that on Windows, use `\\` not `\` for path separator, or just use `/`.

```json
{
    "first": {
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
            {"name": "lz-reset_all"}
        ]
    },
    "second": {
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
            {"name": "lz-reset_all"}
        ]
    },
    "times": 30,
    "inProcess": true
}
```

There's an in-process mode, in which it won't start 2 new processes on each game, but instead run all games in the same 2 processes. Note that while in this mode, the engine must support some kind of "reset all" features to reset all state including caches in the previous game in order to make the next game fair. Also note that `lz-reset_all` is just an imaginary GTP command. You should replace it with the real GTP command that does this behavior.

For details of GTP commands such as `time_settings`, [click here](http://www.lysator.liu.se/~gunnar/gtp/gtp2-spec-draft2/gtp2-spec.html).

You may do tests on a computer that can shut down at any random time. An example is EC2 Spot Instances. In this situation, you may want to send reports regularly to a server to prevent data loss. The optional `report` property is for that:

```
{
    ...
    "report": {"minutes": 10, "uriPrefix": "https://example.com/report"}
}
```

Every 10 minutes, it will send an HTTP GET request to `https://example.com/report?testerId=<testerId>&firstWins=<firstWins>&total=<total>`, where `<testerId>` is a random (but fixed during the tester process) string. Note that in this report, `<total>` is always an even number. The report reflects the last state when `<total>` is even.

There's an optional `spawnOptions` property, so that it could pass environment variables to the engine processes. For example:

```json
{
    "first": {
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
        ],
        "spawnOptions": {
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/your-name/boost_1_67_0/lib"
            }
        }
    },
    "second": {
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder"],
        "initialGtpCommands": [
            {"name": "komi", "args": ["7.5"]},
            {"name": "time_settings", "args": ["0", "0", "1"]},
            {"name": "boardsize", "args": ["19"]}
        ],
        "spawnOptions": {
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/your-name/boost_1_67_0/lib"
            }
        }
    },
    "times": 30
}
```

For details of `spawnOptions`, [click here](https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options).

# FAQ

Q: Why does it restart the process for each game? Process initialization can be slow!

A: This ensures that each game is treated equally. A lot of programs are so smart that they can cache the previous calculation to speed up calculations for the next game. We must avoid that, otherwise the result may be incorrect.
