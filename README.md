# Install

```bash
npm install go-engine-tester -g
```

# Usage

Add a file `config.json`:

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

This will play 30 games between the first engine and the second engine defined, and finally print the result.

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
