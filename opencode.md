# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze history for missed optimization opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## How It Works

All shell commands are automatically rewritten through RTK by the openrtk plugin.
Example: `git status` becomes `rtk git status` transparently, producing compressed output.

No manual prefixing is needed. Just run commands normally.
