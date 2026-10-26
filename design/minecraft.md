### Illustrative second tenant

This small extension validates reuse, not Minecraft gameplay accuracy. It extends
the shared theme and owns only sample-specific material mappings. Its records
remain in the content manifest's explicitly illustrative source.

```yaml design:minecraft
$extensions:
  ror2.design-system:
    themes:
      dark-minecraft:
        status: active
        extends: dark
```

### Token group: minecraft.context.theme.dark-minecraft.color (color)

| Token | Value | Description |
| --- | --- | --- |
| `brand.foreground.primary` | `{primitive.color.shared.green-bright}` |  |
| `brand.background.solid.rest` | `{primitive.color.shared.green-bright}` |  |
| `brand.stroke.control.selected` | `{primitive.color.shared.green-bright}` |  |
| `brand.stroke.focus` | `{primitive.color.shared.green-bright}` |  |

### Token group: minecraft.tenant.minecraft.color.material (color)

| Token | Value | Description |
| --- | --- | --- |
| `wood` | `#B58B62FF` |  |
| `stone` | `#ADB0B4FF` |  |
| `iron` | `#E7DFD3FF` |  |
| `gold` | `#E8CC70FF` |  |
| `diamond` | `#6ED8D2FF` |  |
| `netherite` | `#B7A4BFFF` |  |
