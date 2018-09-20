# Introduction

This program runs a batch of games between 2 Go (围棋, 囲碁, 바둑) engines to compare their strength. It can also compare the strength under different options in the same engine.

# Install

```bash
npm install go-engine-tester -g
```

# Usage

Add a file `config.json`, then run:

```bash
go-engine-tester config.json
```

`config.json` example:

```json
{
    "first": {
        "name": "config1",
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder", "-p", "100"]
    },
    "second": {
        "name": "config2",
        "command": "./leelaz",
        "args": ["-w", "network-157.gz", "--gtp", "--noponder", "-p", "100"]
    },
    "times": 30
}
```

This will play 30 games between the first engine and the second engine, and finally print the result.

There's an optional `spawnOptions` attribute, so that it could pass environment variables to the engine processes:

```json
{
    "first": {
        "name": "config1",
        "command": "./leelaz",
        "args": ["-w", "network-173.gz", "--gtp", "--noponder", "-p", "100"],
        "spawnOptions": {
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/your-name/boost_1_67_0/lib"
            }
        }
    },
    "second": {
        "name": "config2",
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
