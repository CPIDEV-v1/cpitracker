# Sample transactions

A handful of mainnet signatures useful for poking the parser.

## Single CPI

A simple SystemProgram transfer wrapped in one outer call — good first test.

```
3T6CtPTgNxXoQ8aS1L6n9aV9zNG3tMSf1mGsDWsv1JRGcWqXJVxh1xtsDZALxDBKNPzU98W4Sj37cTNUZjQTymgY
```

## Stake delegation

Native stake → vote-account delegation. Two CPIs into Stake program.

```
4xVKJjy6JPmfrgRXVhA8eGYHx2pJTm5VkPUu7RFhgsB6m3bhNzLWuBnWzuzAUoApgeXt5Z2GLYpYbbFGiaPmEXTk
```

## Jupiter swap (deep tree)

Multi-hop swap routed through 3 AMMs. Useful to stress collapsible nodes and account-diff highlighting.

```
hkE6CMNn9Hqj7Q9JqZJjrW7sCFYPGAfNPLQuv28U1QzVTVrnRQyt22VgeDqfHrYPNSL16D8aBhFSYnKhB8PqGxK
```

## Token mint with metadata

SPL Token init + Metaplex metadata upload. Mixes 2 program types.

```
5kbEgJWxsNGzjbMfzuABNn3z2dLCfMzU6n4ydaCmEbq8UR2Zb6yDXvgg66oM8zRnmKPM72k5Rrmcx21Mv6brbzVL
```

> Paste any of these into the analyse field on the homepage. Trees are
> rendered live; click any node to inspect the per-account diff.
