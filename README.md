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
        "args": ["-w", "network-173.gz", "--gtp", "--noponder", "-p", "100"]
    },
    "second": {
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder", "-p", "100"]
    },
    "times": 30
}
```

This will play 30 games between the first engine and the second engine, and finally print the result. Note that the path in `command` is relative to the working directory not the config file.

There's an optional `spawnOptions` attribute, so that it could pass environment variables to the engine processes:

```json
{
    "first": {
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder", "-p", "100"],
        "spawnOptions": {
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/your-name/boost_1_67_0/lib"
            }
        }
    },
    "second": {
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder", "-p", "100"],
        "spawnOptions": {
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/your-name/boost_1_67_0/lib"
            }
        }
    },
    "times": 30
}
```
